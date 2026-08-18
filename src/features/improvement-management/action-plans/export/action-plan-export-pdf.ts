import { formatPlatformDate } from "@/shared/datetime/platform-date-time";
import { ACTION_PLAN_PDF_CARD_OPTIONS } from "@/features/improvement-management/recommendations/export/portfolio-export-pdf-card";
import {
  actionPlanPdfContextFields,
} from "@/features/improvement-management/recommendations/export/portfolio-export-pdf-layout";
import { buildInstitutionalHierarchyPdf } from "@/features/improvement-management/recommendations/export/portfolio-export-pdf";
import type { ActionPlanExportData } from "./action-plan-export-types";

const CIVIL_DATE_FORMAT = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
} as const;

/**
 * PDF institucional do plano de ação. Só formata o ViewModel já montado
 * por `getActionPlanExportData` — sem reler status, progresso ou datas.
 */
export async function generateActionPlanPdf(
  data: ActionPlanExportData,
): Promise<{ filename: string; content: Uint8Array }> {
  const issuedOnLabel = formatPlatformDate(
    data.issuedOn,
    CIVIL_DATE_FORMAT,
    data.issuedOn,
  );
  return buildInstitutionalHierarchyPdf(data.rows, {
    title: "Plano de ação",
    filenameBase: "plano-de-acao",
    emptyMessage: "Nenhuma ação para exportar.",
    showGeneratedAt: false,
    card: ACTION_PLAN_PDF_CARD_OPTIONS,
    contextFields: (context) => actionPlanPdfContextFields(context, issuedOnLabel),
  });
}
