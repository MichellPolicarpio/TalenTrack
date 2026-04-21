import { ProjectsSection } from "@/components/resume/sections/ProjectsSection";
import type { Project } from "@/lib/db/types";

export function ProjectsTab({
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
  initial: Project[];
  onItemsChange?: (items: Project[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
  onAddingChange?: (isAdding: boolean) => void;
  onNewDraftChange?: (draft: any | null) => void;
}) {
  return (
    <ProjectsSection
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
