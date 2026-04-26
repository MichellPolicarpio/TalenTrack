import { ensureEmployeeAndResume } from "@/lib/actions/onboarding.actions";
import { getResumeSnapshotsMeta } from "@/lib/repositories/resume.repository";
import { HistoryClient } from "@/components/resume/history/HistoryClient";
import { History as HistoryIcon } from "lucide-react";

export default async function HistoryPage() {
  const { resumeId } = await ensureEmployeeAndResume();
  const snapshots = await getResumeSnapshotsMeta(resumeId);

  return (
    <div className="flex h-full flex-col bg-neutral-50/30 px-6 py-8 md:px-10">
      <HistoryClient snapshots={snapshots} />
    </div>
  );
}
