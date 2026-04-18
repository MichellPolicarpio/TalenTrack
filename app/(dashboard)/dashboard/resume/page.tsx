import { OnboardingWizard } from "@/components/resume/OnboardingWizard";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { ensureEmployeeAndResume } from "@/lib/actions/onboarding.actions";

export default async function ResumePage() {
  const { resumeId, isNew } = await ensureEmployeeAndResume();

  if (isNew) {
    return <OnboardingWizard resumeId={resumeId} />;
  }

  return <ResumeEditor resumeId={resumeId} />;
}
