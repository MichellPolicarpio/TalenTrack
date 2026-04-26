"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type HrQueueKpis = {
  pendingCount: number;
  oldestWaitDays: number | null;
  resubmissionCount: number;
  submittedLast24h: number;
  avgWaitDays: number | null;
  criticalCount: number;
};

function KpiCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "ring-neutral-200 transition-shadow",
        highlight && "border-amber-200/80 bg-[#FFF8F3] ring-amber-200/60 shadow-sm",
      )}
    >
      <CardContent className="flex flex-col gap-0.5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums text-[#111827]">{value}</p>
        {hint ? (
          <p className="text-[10.5px] leading-snug text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function HrKpiGrid({ kpis }: { kpis: HrQueueKpis }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
      <KpiCard
        label="Total in queue"
        value={kpis.pendingCount}
        hint={
          kpis.submittedLast24h > 0
            ? `+${kpis.submittedLast24h} submitted in the last 24h`
            : "All pending HR decision"
        }
      />
      <KpiCard
        label="Avg. turnaround (est.)"
        value={kpis.avgWaitDays == null ? "—" : kpis.avgWaitDays.toFixed(1)}
        hint="Mean days waiting in this queue"
      />
      <KpiCard
        label="Resubmit rate"
        value={
          kpis.pendingCount === 0
            ? "—"
            : `${Math.round((kpis.resubmissionCount / kpis.pendingCount) * 100)}%`
        }
        hint={`${kpis.resubmissionCount} with version > 1`}
      />
      <KpiCard
        label="Critical priority"
        value={kpis.criticalCount}
        hint="Waiting ≥ 3 days"
        highlight={kpis.criticalCount > 0}
      />
    </div>
  );
}
