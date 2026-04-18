"use server";

import { getResumeSnapshotById } from "@/lib/repositories/resume.repository";
import { ResumeSnapshot } from "@/lib/db/types";

export async function getSnapshotDetailAction(snapshotId: string): Promise<ResumeSnapshot | null> {
  try {
    return await getResumeSnapshotById(snapshotId);
  } catch (error) {
    console.error("Error fetching snapshot detail:", error);
    return null;
  }
}
