import { AchievementsSection } from "@/components/resume/sections/AchievementsSection";
import type { Achievement } from "@/lib/db/types";

export function AchievementsTab({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled,
  headerActions,
}: {
  resumeId: string;
  initial: Achievement[];
  onItemsChange?: (items: Achievement[]) => void;
  onPersisted?: () => void;
  disabled: boolean;
  headerActions?: React.ReactNode;
}) {
  return (
    <AchievementsSection
      resumeId={resumeId}
      initial={initial}
      onItemsChange={onItemsChange}
      onPersisted={onPersisted}
      disabled={disabled}
      headerActions={headerActions}
    />
  );
}
