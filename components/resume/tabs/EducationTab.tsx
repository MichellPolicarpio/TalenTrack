import { EducationSection } from "@/components/resume/sections/EducationSection";
import type { Education } from "@/lib/db/types";

export function EducationTab({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled,
  headerActions,
}: {
  resumeId: string;
  initial: Education[];
  onItemsChange?: (items: Education[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
}) {
  return (
    <EducationSection
      resumeId={resumeId}
      initial={initial}
      onItemsChange={onItemsChange}
      onPersisted={onPersisted}
      disabled={disabled}
      headerActions={headerActions}
    />
  );
}
