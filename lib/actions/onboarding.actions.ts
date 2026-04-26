"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import type { ProfileFormValues } from "@/lib/db/types";
import { getEmployeeByEntraId, upsertEmployee } from "@/lib/repositories/employee.repository";
import {
  createResumeWithProfile,
  getResumeByEmployeeId,
  isResumeOwnedByEmployee,
  updateResumeProfile,
  updateResumeReminderMonths,
} from "@/lib/repositories/resume.repository";

function emptyToNull(value: string): string | null {
  const t = value.trim();
  return t.length === 0 ? null : t;
}

export async function ensureEmployeeAndResume(): Promise<{
  resumeId: string;
  isNew: boolean;
}> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const entraObjectId = session.user.entraObjectId;
  if (!entraObjectId) {
    throw new Error("Missing Entra object id in session");
  }

  const displayName = session.user.name ?? "";
  const corporateEmail = session.user.email ?? "";

  const employee = await upsertEmployee({
    entraObjectId,
    displayName,
    corporateEmail,
    appRole: session.user.role,
  });

  const existing = await getResumeByEmployeeId(employee.id);
  if (existing) {
    return { resumeId: existing.resume.id, isNew: false };
  }

  const resumeId = await createResumeWithProfile(employee.id, 6);
  return { resumeId, isNew: true };
}

export async function saveResumeProfile(
  resumeId: string,
  formData: ProfileFormValues,
): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const entraObjectId = session.user.entraObjectId;
  if (!entraObjectId) {
    throw new Error("Missing Entra object id in session");
  }

  const employee = await getEmployeeByEntraId(entraObjectId);
  if (!employee) {
    throw new Error("Forbidden");
  }

  const owned = await isResumeOwnedByEmployee(resumeId, employee.id);
  if (!owned) {
    throw new Error("Forbidden");
  }

  await updateResumeProfile(resumeId, {
    jobTitle: formData.jobTitle.trim(),
    professionalSummary: formData.professionalSummary.trim(),
    homeAddress: emptyToNull(formData.homeAddress),
    personalPhone: emptyToNull(formData.personalPhone),
    personalEmail: emptyToNull(formData.personalEmail),
  });

  await updateResumeReminderMonths(resumeId, formData.reminderMonths);

  revalidatePath("/dashboard/resume");
}
