import { LicensesSection } from "@/components/resume/sections/LicensesSection";
import type { License, LicenseInput } from "@/lib/db/types";

export function LicensesTab({
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
  initial: License[];
  onItemsChange?: (items: License[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
  onAddingChange?: (isAdding: boolean) => void;
  onNewDraftChange?: (draft: LicenseInput | null) => void;
}) {
  return (
    <LicensesSection
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
