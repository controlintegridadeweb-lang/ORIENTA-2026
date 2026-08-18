import { formatPlatformDate } from "@/shared/datetime/platform-date-time";

export function formatRecommendationDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return formatPlatformDate(d, { day: "2-digit", month: "short", year: "numeric" });
}
