import { getResumeAllDataForEditor } from "@/lib/repositories/resume.repository";
import { auth } from "@/lib/auth";
import { ResumeEditorClient } from "@/components/resume/ResumeEditorClient";

export type ResumeEditorProps = {
  resumeId: string;
};

export async function ResumeEditor({ resumeId }: ResumeEditorProps) {
  const session = await auth();
  const data = await getResumeAllDataForEditor(resumeId);
  const {
    resumeWithProfile,
    experiences,
    education,
    skills,
    certifications,
    achievements,
    projects,
    licenses,
  } = data;
  const resume = resumeWithProfile?.resume;
  const profile = resumeWithProfile?.profile ?? null;
  const status = resume?.status ?? "DRAFT";

  return (
    <>
      <ResumeEditorClient
        resumeId={resumeId}
        status={status}
        reviewerNotes={resume?.reviewerNotes ?? null}
        publicShareToken={resume?.publicShareToken ?? null}
        employeeName={session?.user?.name ?? ""}
        userEmail={session?.user?.email ?? ""}
        role={session?.user?.role ?? "Employee"}
        profile={profile}
        resumeUpdatedAt={resume?.updatedAt ?? null}
        experiences={experiences}
        education={education}
        skills={skills}
        certifications={certifications}
        achievements={achievements}
        projects={projects}
        licenses={licenses}
      />
    </>
  );
}
