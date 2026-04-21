import { EducationSection } from "@/components/resume/sections/EducationSection";
import type { Education } from "@/lib/db/types";

export function EducationTab({
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
  initial: Education[];
  onItemsChange?: (items: Education[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
  onActivateEdit?: () => void;
  isAdding?: boolean;
  onAddingChange?: (adding: boolean) => void;
  onNewDraftChange?: (draft: any | null) => void;
}) {
  return (
    <EducationSection
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
