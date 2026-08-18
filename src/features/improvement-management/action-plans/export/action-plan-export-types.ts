import type { RecommendationPortfolioExportDocument } from "@/features/improvement-management/recommendations/export/portfolio-export-types";
import type { RecommendationPortfolioExportRow } from "@/features/improvement-management/recommendations/export/portfolio-export-types";
import type { RecommendationPortfolioExportSource } from "@/features/improvement-management/recommendations/export/portfolio-export-types";

/** Cabeçalhos pt-BR na ordem analítica do plano de ação (1 linha por ação). */
export const ACTION_PLAN_EXPORT_HEADERS = [
  "Formulário",
  "Órgão",
  "Eixo",
  "Seção",
  "Pergunta",
  "Recomendação",
  "Situação da recomendação",
  "Ação",
  "Responsável",
  "Início",
  "Final",
  "Situação da ação",
  "Progresso",
  "Última atualização",
] as const;

export type ActionPlanExportFormat = "xlsx" | "pdf";

/**
 * Camada única de dados da exportação do plano de ação.
 * Excel e PDF consomem a mesma estrutura; só a apresentação muda.
 */
export type ActionPlanExportData = {
  sources: readonly RecommendationPortfolioExportSource[];
  rows: RecommendationPortfolioExportRow[];
  document: RecommendationPortfolioExportDocument;
  issuedOn: string;
};
