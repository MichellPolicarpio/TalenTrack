import { redirect } from "next/navigation";

import { HrQueueView } from "@/components/hr/hr-queue-view";
import { auth } from "@/lib/auth";
import { getAllPendingResumes, getAllApprovedResumes, getAllResumesHistory } from "@/lib/repositories/approval.repository";

const CRITICAL_WAIT_DAYS = 3;

function computeQueueKpis(
  queue: Awaited<ReturnType<typeof getAllPendingResumes>>,
  nowMs: number,
) {
  const dayMs = 86_400_000;
  const day24Ms = 24 * 60 * 60 * 1000;

  if (queue.length === 0) {
    return {
      pendingCount: 0,
      oldestWaitDays: null as number | null,
      resubmissionCount: 0,
      submittedLast24h: 0,
      avgWaitDays: null as number | null,
      criticalCount: 0,
    };
  }

  const oldest = queue.reduce(
    (min, row) => (row.submittedAt < min ? row.submittedAt : min),
    queue[0]!.submittedAt,
  );
  const oldestWaitDays = Math.max(
    0,
    Math.floor((nowMs - oldest.getTime()) / dayMs),
  );

  const waitDaysSum = queue.reduce(
    (s, r) => s + (nowMs - r.submittedAt.getTime()) / dayMs,
    0,
  );
  const avgWaitDays = waitDaysSum / queue.length;

  const criticalCount = queue.filter(
    (r) => (nowMs - r.submittedAt.getTime()) / dayMs >= CRITICAL_WAIT_DAYS,
  ).length;

  return {
    pendingCount: queue.length,
    oldestWaitDays,
    resubmissionCount: queue.filter((r) => r.version > 1).length,
    submittedLast24h: queue.filter(
      (r) => nowMs - r.submittedAt.getTime() <= day24Ms,
    ).length,
    avgWaitDays,
    criticalCount,
  };
}

export default async function HrQueuePage() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "HR_Revisor" && session.user.role !== "Admin")
  ) {
    redirect("/dashboard/resume");
  }

  const [pendingQueue, approvedQueue, historyQueue] = await Promise.all([
    getAllPendingResumes(),
    getAllApprovedResumes(15),
    getAllResumesHistory(),
  ]);
  const nowMs = Date.now();
  const kpis = computeQueueKpis(pendingQueue, nowMs);

  const pendingRows = pendingQueue.map((item) => ({
    resumeId: item.resumeId,
    employeeName: item.employeeName,
    employeeEmail: item.employeeEmail,
    jobTitle: item.jobTitle,
    submittedAt: item.submittedAt.toISOString(),
    version: item.version,
  }));

  const approvedRows = approvedQueue.map((item) => ({
    resumeId: item.resumeId,
    employeeName: item.employeeName,
    employeeEmail: item.employeeEmail,
    jobTitle: item.jobTitle,
    submittedAt: item.submittedAt.toISOString(),
    version: item.version,
    isSnapshot: item.isSnapshot,
    snapshotId: item.snapshotId,
  }));

  const historyRows = historyQueue.map((item) => ({
    resumeId: item.resumeId,
    employeeName: item.employeeName,
    employeeEmail: item.employeeEmail,
    jobTitle: item.jobTitle,
    submittedAt: item.submittedAt.toISOString(),
    version: item.version,
    status: item.status,
    isSnapshot: item.isSnapshot,
    snapshotId: item.snapshotId,
    operationDate: item.operationDate.toISOString(),
  }));

  return (
    <div className="flex h-full flex-col p-4 md:p-6 pb-20">
      <HrQueueView 
        pendingRows={pendingRows} 
        approvedRows={approvedRows} 
        historyRows={historyRows}
        kpis={kpis} 
      />
    </div>
  );
}
