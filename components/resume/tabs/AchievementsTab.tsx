import { AchievementsSection } from "@/components/resume/sections/AchievementsSection";
import type { Achievement } from "@/lib/db/types";

export function AchievementsTab({
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
  initial: Achievement[];
  onItemsChange?: (items: Achievement[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
  onActivateEdit?: () => void;
  isAdding?: boolean;
  onAddingChange?: (adding: boolean) => void;
  onNewDraftChange?: (draft: any | null) => void;
}) {
  return (
    <AchievementsSection
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
