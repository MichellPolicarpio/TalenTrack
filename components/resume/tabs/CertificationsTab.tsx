import { CertificationsSection } from "@/components/resume/sections/CertificationsSection";
import type { Certification } from "@/lib/db/types";

export function CertificationsTab({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled,
  headerActions,
}: {
  resumeId: string;
  initial: Certification[];
  onItemsChange?: (items: Certification[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
}) {
  return (
    <CertificationsSection
      resumeId={resumeId}
      initial={initial}
      onItemsChange={onItemsChange}
      onPersisted={onPersisted}
      disabled={disabled}
      headerActions={headerActions}
    />
  );
}
