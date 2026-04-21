import { WorkExperienceSection } from "@/components/resume/sections/WorkExperienceSection";
import type { WorkExperience } from "@/lib/db/types";

export function ExperienceTab({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled,
  headerActions,
  onActivateEdit,
  isAdding,
  onAddingChange,
  onNewDraftChange,
}: {
  resumeId: string;
  initial: WorkExperience[];
  onItemsChange?: (items: WorkExperience[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
  onActivateEdit?: () => void;
  isAdding?: boolean;
  onAddingChange?: (adding: boolean) => void;
  onNewDraftChange?: (draft: any | null) => void;
}) {
  return (
    <WorkExperienceSection
      resumeId={resumeId}
      initial={initial}
      onItemsChange={onItemsChange}
      onPersisted={onPersisted}
      disabled={disabled}
      headerActions={headerActions}
      onActivateEdit={onActivateEdit}
      isAdding={isAdding}
      onAddingChange={onAddingChange}
      onNewDraftChange={onNewDraftChange}
    />
  );
}
