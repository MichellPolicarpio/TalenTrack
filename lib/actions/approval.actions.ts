"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmployeeByEntraId } from "@/lib/repositories/employee.repository";
import {
  approveResume,
  requestChanges,
  submitResumeForApproval,
  withdrawSubmissionForReview,
  reopenResumeForEdit,
} from "@/lib/repositories/approval.repository";
import { createNotification } from "@/lib/repositories/notifications.repository";
import {
  getResumeById,
  isResumeOwnedByEmployee,
  getFullResumeForPdf,
  saveResumeSnapshot,
} from "@/lib/repositories/resume.repository";

import { APP_NOTIFICATION_TYPE, RESUME_STATUS } from "@/lib/db/types";

async function getSession() {
  const session = await auth();
  if (!session?.user?.entraObjectId) throw new Error("Unauthorized");
  return session;
}

async function getEmployee(entraObjectId: string) {
  const employee = await getEmployeeByEntraId(entraObjectId);
  if (!employee) throw new Error("Forbidden");
  return employee;
}

export async function submitForApprovalAction(resumeId: string): Promise<void> {
  const session = await getSession();
  const employee = await getEmployee(session.user.entraObjectId!);

  const owned = await isResumeOwnedByEmployee(resumeId, employee.id);
  if (!owned) throw new Error("Forbidden");

  await submitResumeForApproval(resumeId, employee.id);
  revalidatePath("/dashboard/resume");
}

export async function withdrawSubmissionAction(resumeId: string): Promise<void> {
  const session = await getSession();
  const employee = await getEmployee(session.user.entraObjectId!);

  const owned = await isResumeOwnedByEmployee(resumeId, employee.id);
  if (!owned) throw new Error("Forbidden");

  await withdrawSubmissionForReview(resumeId, employee.id);
  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard/hr/queue");
  revalidatePath(`/dashboard/hr/review/${resumeId}`);
}

export async function approveResumeAction(resumeId: string): Promise<void> {
  const session = await getSession();
  const role = session.user.role;
  if (role !== "HR_Revisor" && role !== "Admin") throw new Error("Forbidden");

  const employee = await getEmployee(session.user.entraObjectId!);
  await approveResume(resumeId, employee.id);

  const ownerResume = await getResumeById(resumeId);
  if (ownerResume?.resume.employeeId) {
    await createNotification({
      employeeId: ownerResume.resume.employeeId,
      resumeId,
      type: APP_NOTIFICATION_TYPE.APPROVED,
      message: "Your resume was approved.",
    });
  }

  revalidatePath("/dashboard/hr/queue");
  revalidatePath(`/dashboard/hr/review/${resumeId}`);
  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard", "layout");
}

export async function requestChangesAction(
  resumeId: string,
  notes: string,
): Promise<void> {
  const session = await getSession();
  const role = session.user.role;
  if (role !== "HR_Revisor" && role !== "Admin") throw new Error("Forbidden");

  const employee = await getEmployee(session.user.entraObjectId!);
  await requestChanges(resumeId, employee.id, notes);

  const ownerResume = await getResumeById(resumeId);
  if (ownerResume?.resume.employeeId) {
    const preview = notes.length > 380 ? `${notes.slice(0, 380)}…` : notes;
    await createNotification({
      employeeId: ownerResume.resume.employeeId,
      resumeId,
      type: APP_NOTIFICATION_TYPE.NEEDS_CHANGES,
      message: `HR requested changes: ${preview}`,
    });
  }

  revalidatePath("/dashboard/hr/queue");
  revalidatePath(`/dashboard/hr/review/${resumeId}`);
  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard", "layout");
}

export async function reopenResumeForUpdateAction(resumeId: string): Promise<void> {
  const session = await getSession();
  const employee = await getEmployee(session.user.entraObjectId!);

  const owned = await isResumeOwnedByEmployee(resumeId, employee.id);
  if (!owned) throw new Error("Forbidden");

  // Get current snapshot data
  const fullData = await getFullResumeForPdf(resumeId);
  if (!fullData) throw new Error("Resume not found");

  const resumeData = await getResumeById(resumeId);
  const currentVersion = resumeData?.resume.version ?? 1;

  // Save historical snapshot before reverting to draft
  await saveResumeSnapshot(resumeId, currentVersion, fullData);

  // Change status back to DRAFT
  await reopenResumeForEdit(resumeId, employee.id);

  revalidatePath("/dashboard/resume");
}
