"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmployeeByEntraId } from "@/lib/repositories/employee.repository";
import {
  isResumeOwnedByEmployee,
  touchResumeUpdatedAt,
} from "@/lib/repositories/resume.repository";
import {
  upsertWorkExperience,
  deleteWorkExperience,
  reorderWorkExperiences,
  upsertEducation,
  deleteEducation,
  reorderEducation,
  upsertSkill,
  deleteSkill,
  reorderSkills,
  upsertCertification,
  deleteCertification,
  reorderCertifications,
  upsertAchievement,
  deleteAchievement,
  reorderAchievements,
  upsertProject,
  deleteProject,
  reorderProjects,
  upsertLicense,
  deleteLicense,
  reorderLicenses,
  updateItemVisibility,
} from "@/lib/repositories/sections.repository";
import type {
  WorkExperienceInput,
  EducationInput,
  SkillInput,
  CertificationInput,
  AchievementInput,
  Project,
  ProjectInput,
  LicenseInput,
  ReorderItem,
} from "@/lib/db/types";

const REVALIDATE_PATH = "/dashboard/resume";

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getVerifiedEmployee(resumeId: string) {
  const session = await auth();
  if (!session?.user?.entraObjectId) throw new Error("Unauthorized");

  const employee = await getEmployeeByEntraId(session.user.entraObjectId);
  if (!employee) throw new Error("Forbidden");

  const owned = await isResumeOwnedByEmployee(resumeId, employee.id);
  if (!owned) throw new Error("Forbidden");

  return employee;
}

async function afterContentMutation(
  resumeId: string,
  employeeId: string,
  options: { shouldInvalidateApproval?: boolean; revalidateHR?: boolean } = {},
) {
  const { shouldInvalidateApproval = true, revalidateHR = true } = options;
  const invalidated = await touchResumeUpdatedAt(resumeId, employeeId, shouldInvalidateApproval);
  revalidatePath(REVALIDATE_PATH);
  if (revalidateHR && (invalidated || shouldInvalidateApproval)) {
    revalidatePath("/dashboard/hr/queue");
    revalidatePath(`/dashboard/hr/review/${resumeId}`);
  }
}

// ─── Work Experience ─────────────────────────────────────────────────────────

export async function saveWorkExperience(
  resumeId: string,
  data: WorkExperienceInput,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await upsertWorkExperience(resumeId, data);
  await afterContentMutation(resumeId, employee.id);
}

export async function removeWorkExperience(
  resumeId: string,
  id: string,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await deleteWorkExperience(id, resumeId);
  await afterContentMutation(resumeId, employee.id);
}

export async function reorderWorkExperiencesAction(
  resumeId: string,
  items: ReorderItem[],
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await reorderWorkExperiences(items);
  await afterContentMutation(resumeId, employee.id);
}

// ─── Education ───────────────────────────────────────────────────────────────

export async function saveEducation(
  resumeId: string,
  data: EducationInput,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await upsertEducation(resumeId, data);
  await afterContentMutation(resumeId, employee.id);
}

export async function removeEducation(
  resumeId: string,
  id: string,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await deleteEducation(id, resumeId);
  await afterContentMutation(resumeId, employee.id);
}

export async function reorderEducationAction(
  resumeId: string,
  items: ReorderItem[],
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await reorderEducation(items);
  await afterContentMutation(resumeId, employee.id);
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export async function saveSkill(
  resumeId: string,
  data: SkillInput,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await upsertSkill(resumeId, data);
  await afterContentMutation(resumeId, employee.id);
}

export async function removeSkill(
  resumeId: string,
  id: string,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await deleteSkill(id, resumeId);
  await afterContentMutation(resumeId, employee.id);
}

export async function reorderSkillsAction(
  resumeId: string,
  items: ReorderItem[],
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await reorderSkills(items);
  await afterContentMutation(resumeId, employee.id);
}

// ─── Certifications ──────────────────────────────────────────────────────────

export async function saveCertification(
  resumeId: string,
  data: CertificationInput,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await upsertCertification(resumeId, data);
  await afterContentMutation(resumeId, employee.id);
}

export async function removeCertification(
  resumeId: string,
  id: string,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await deleteCertification(id, resumeId);
  await afterContentMutation(resumeId, employee.id);
}

export async function reorderCertificationsAction(
  resumeId: string,
  items: ReorderItem[],
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await reorderCertifications(items);
  await afterContentMutation(resumeId, employee.id);
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function saveAchievement(
  resumeId: string,
  data: AchievementInput,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await upsertAchievement(resumeId, data);
  await afterContentMutation(resumeId, employee.id);
}

export async function removeAchievement(
  resumeId: string,
  id: string,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await deleteAchievement(id, resumeId);
  await afterContentMutation(resumeId, employee.id);
}

export async function reorderAchievementsAction(
  resumeId: string,
  items: ReorderItem[],
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await reorderAchievements(items);
  await afterContentMutation(resumeId, employee.id);
}

// ─── Resume projects ─────────────────────────────────────────────────────────

export async function saveProject(
  resumeId: string,
  data: ProjectInput,
): Promise<Project> {
  const employee = await getVerifiedEmployee(resumeId);
  const project = await upsertProject(resumeId, data);
  await afterContentMutation(resumeId, employee.id);
  return project;
}

export async function removeProject(
  resumeId: string,
  id: string,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await deleteProject(id, resumeId);
  await afterContentMutation(resumeId, employee.id);
}

export async function reorderProjectsAction(
  resumeId: string,
  items: ReorderItem[],
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await reorderProjects(items);
  await afterContentMutation(resumeId, employee.id);
}

// ─── Licenses ────────────────────────────────────────────────────────────────

export async function saveLicense(
  resumeId: string,
  data: LicenseInput,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await upsertLicense(resumeId, data);
  await afterContentMutation(resumeId, employee.id);
}

export async function removeLicense(
  resumeId: string,
  id: string,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await deleteLicense(id, resumeId);
  await afterContentMutation(resumeId, employee.id);
}

export async function reorderLicensesAction(
  resumeId: string,
  items: ReorderItem[],
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await reorderLicenses(items);
  await afterContentMutation(resumeId, employee.id);
}

// ─── Visibility toggle ───────────────────────────────────────────────────────

export async function toggleVisibilityAction(
  resumeId: string,
  table:
    | "WorkExperiences"
    | "Education"
    | "Skills"
    | "Certifications"
    | "Achievements"
    | "ResumeProjects"
    | "Licenses",
  itemId: string,
  visible: boolean,
): Promise<void> {
  const employee = await getVerifiedEmployee(resumeId);
  await updateItemVisibility(table, itemId, resumeId, visible);
  // Visibility toggles do NOT invalidate HR approval (OPT-05)
  // and we don't necessarily need to revalidate HR views immediately for just a toggle.
  await afterContentMutation(resumeId, employee.id, {
    shouldInvalidateApproval: false,
    revalidateHR: false,
  });
}
