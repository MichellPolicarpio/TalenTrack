import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { 
  getResumeSnapshotById, 
  getResumeById 
} from "@/lib/repositories/resume.repository";
import { 
  getAuditLogByResumeId,
  getResumeWithEmployeeById
} from "@/lib/repositories/approval.repository";
import { HrReviewClient } from "@/components/hr/HrReviewClient";
import { RESUME_STATUS } from "@/lib/db/types";

export default async function HrSnapshotReviewPage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = await params;

  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "HR_Revisor" && session.user.role !== "Admin")
  ) {
    redirect("/dashboard/resume");
  }

  const snapshot = await getResumeSnapshotById(snapshotId);
  if (!snapshot) notFound();

  // We still want to see the audit log and current employee context for the HR reviewer
  const [currentResume, auditLog] = await Promise.all([
    getResumeWithEmployeeById(snapshot.resumeId),
    getAuditLogByResumeId(snapshot.resumeId),
  ]);

  if (!currentResume) notFound();

  const data = snapshot.snapshotData;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HrReviewClient
        resumeId={snapshot.resumeId}
        employeeName={data.employee.displayName}
        status={RESUME_STATUS.APPROVED} // Snapshots are by definition historical approvals
        version={snapshot.version}
        profile={data.profile}
        experiences={data.workExperiences}
        education={data.education}
        skills={data.skills}
        certifications={data.certifications}
        resumeProjects={data.projects}
        licenses={data.licenses}
        achievements={data.achievements}
        auditLog={auditLog}
        resumeUpdatedAtIso={snapshot.createdAt.toISOString()}
        reviewerName={session.user.name ?? ""}
        reviewerEmail={session.user.email ?? ""}
        isReadOnly={true}
      />
    </div>
  );
}
