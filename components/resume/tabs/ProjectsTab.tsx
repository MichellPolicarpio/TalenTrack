import { ProjectsSection } from "@/components/resume/sections/ProjectsSection";
import type { ResumeProject } from "@/lib/db/types";

export function ProjectsTab({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled,
  headerActions,
}: {
  resumeId: string;
  initial: ResumeProject[];
  onItemsChange?: (items: ResumeProject[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
}) {
  return (
    <ProjectsSection
      resumeId={resumeId}
      initial={initial}
      onItemsChange={onItemsChange}
      onPersisted={onPersisted}
      disabled={disabled}
      headerActions={headerActions}
    />
  );
}
