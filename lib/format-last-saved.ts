/** Normalize values from the server (Date or ISO string after RSC serialization). */
export function coerceDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) || t <= 0 ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    const t = d.getTime();
    return Number.isNaN(t) || t <= 0 ? null : d;
  }
  return null;
}

export function latestOf(...dates: (Date | null)[]): Date | null {
  const ms = dates
    .filter((d): d is Date => d != null && d.getTime() > 0)
    .map((d) => d.getTime());
  if (ms.length === 0) return null;
  return new Date(Math.max(...ms));
}

/** Short English label for “time since last save” (updates when `nowMs` changes). */
export function formatLastSavedRelative(
  savedAt: Date | null,
  nowMs: number,
): string {
  if (!savedAt) return "No saved data on server yet";
  const diffMs = nowMs - savedAt.getTime();
  if (diffMs < 0) {
    return savedAt.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  const sec = Math.floor(diffMs / 1000);
  if (sec < 15) return "Just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.floor(min / 60);
  if (hr < 24) return rtf.format(-hr, "hour");
  const days = Math.floor(hr / 24);
  if (days < 60) return rtf.format(-days, "day");
  return savedAt.toLocaleDateString("en-US", { dateStyle: "medium" });
}
