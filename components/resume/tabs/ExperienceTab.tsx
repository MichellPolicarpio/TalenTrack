import { WorkExperienceSection } from "@/components/resume/sections/WorkExperienceSection";
import type { WorkExperience } from "@/lib/db/types";

export function ExperienceTab({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled,
  headerActions,
}: {
  resumeId: string;
  initial: WorkExperience[];
  onItemsChange?: (items: WorkExperience[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
}) {
  return (
    <WorkExperienceSection
      resumeId={resumeId}
      initial={initial}
      onItemsChange={onItemsChange}
      onPersisted={onPersisted}
      disabled={disabled}
      headerActions={headerActions}
    />
  );
}
