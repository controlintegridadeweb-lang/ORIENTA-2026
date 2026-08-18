import { formatPlatformDateTime } from "@/shared/datetime/platform-date-time";

/** Exibição amigável da última atualização da pontuação FAMI. */
export function formatFamiUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "Ainda não calculada para este escopo";
  return formatPlatformDateTime(
    iso,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    iso,
  );
}
