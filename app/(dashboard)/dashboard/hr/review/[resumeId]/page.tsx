import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getResumeWithEmployeeById,
  getAuditLogByResumeId,
} from "@/lib/repositories/approval.repository";
import { getResumeById } from "@/lib/repositories/resume.repository";
import {
  getWorkExperiencesByResumeId,
  getEducationByResumeId,
  getSkillsByResumeId,
  getCertificationsByResumeId,
  getResumeProjectsByResumeId,
  getLicensesByResumeId,
} from "@/lib/repositories/sections.repository";
import { HrReviewClient } from "@/components/hr/HrReviewClient";

export default async function HrReviewPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;

  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "HR_Revisor" && session.user.role !== "Admin")
  ) {
    redirect("/dashboard/resume");
  }

  const [
    resume,
    resumeWithProfile,
    auditLog,
    experiences,
    education,
    skills,
    certifications,
    resumeProjects,
    licenses,
  ] = await Promise.all([
    getResumeWithEmployeeById(resumeId),
    getResumeById(resumeId),
    getAuditLogByResumeId(resumeId),
    getWorkExperiencesByResumeId(resumeId),
    getEducationByResumeId(resumeId),
    getSkillsByResumeId(resumeId),
    getCertificationsByResumeId(resumeId),
    getResumeProjectsByResumeId(resumeId),
    getLicensesByResumeId(resumeId),
  ]);

  if (!resume) notFound();

  const profile = resumeWithProfile?.profile ?? null;
  const resumeUpdatedAt = resumeWithProfile?.resume.updatedAt ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HrReviewClient
        resumeId={resumeId}
        employeeName={resume.employeeName}
        status={resume.status}
        version={resume.version}
        profile={profile}
        experiences={experiences}
        education={education}
        skills={skills}
        certifications={certifications}
        resumeProjects={resumeProjects}
        licenses={licenses}
        auditLog={auditLog}
        resumeUpdatedAtIso={
          resumeUpdatedAt ? resumeUpdatedAt.toISOString() : null
        }
        reviewerName={session.user.name ?? ""}
        reviewerEmail={session.user.email ?? ""}
      />
    </div>
  );
}
