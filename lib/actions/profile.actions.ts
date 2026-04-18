"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmployeeByEntraId } from "@/lib/repositories/employee.repository";
import {
  isResumeOwnedByEmployee,
  touchResumeUpdatedAt,
  updateResumeProfile,
} from "@/lib/repositories/resume.repository";
import type { UpdateProfileInput } from "@/lib/db/types";

export async function saveProfileAction(
  resumeId: string,
  data: UpdateProfileInput,
): Promise<{ approvalInvalidated: boolean }> {
  const session = await auth();
  if (!session?.user?.entraObjectId) throw new Error("Unauthorized");

  const employee = await getEmployeeByEntraId(session.user.entraObjectId);
  if (!employee) throw new Error("Forbidden");

  const owned = await isResumeOwnedByEmployee(resumeId, employee.id);
  if (!owned) throw new Error("Forbidden");

  await updateResumeProfile(resumeId, data);
  const approvalInvalidated = await touchResumeUpdatedAt(
    resumeId,
    employee.id,
  );

  revalidatePath("/dashboard/resume");
  if (approvalInvalidated) {
    revalidatePath("/dashboard/hr/queue");
    revalidatePath(`/dashboard/hr/review/${resumeId}`);
  }

  return { approvalInvalidated };
}
