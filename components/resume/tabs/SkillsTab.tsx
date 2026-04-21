import { SkillsSection } from "@/components/resume/sections/SkillsSection";
import type { Skill } from "@/lib/db/types";

export function SkillsTab({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled,
  headerActions,
  onAddingChange,
  onNewDraftChange,
}: {
  resumeId: string;
  initial: Skill[];
  onItemsChange?: (items: Skill[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
  onAddingChange?: (isAdding: boolean) => void;
  onNewDraftChange?: (draft: any | null) => void;
}) {
  return (
    <SkillsSection
      resumeId={resumeId}
      initial={initial}
      onItemsChange={onItemsChange}
      onPersisted={onPersisted}
      disabled={disabled}
      headerActions={headerActions}
      onAddingChange={onAddingChange}
      onNewDraftChange={onNewDraftChange}
    />
  );
}
