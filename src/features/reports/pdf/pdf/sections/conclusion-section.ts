import { reportLevelLabel } from "@/features/reports/pdf/build-official-report-data";
import type { Cursor, OrientaPdfDocument } from "../document";
import { reportTheme } from "../theme";

export function conclusionPriorityActions(params: {
  criticalAxesCount: number;
  topOpportunityAxis?: string | null;
  recommendationsWithoutActions: number;
  overdueActions: number;
}): string[] {
  const actions: string[] = [];

  if (params.criticalAxesCount > 0) {
    actions.push(
      params.topOpportunityAxis
        ? `Priorizar o eixo ${params.topOpportunityAxis} e manter o acompanhamento dos demais eixos críticos.`
        : "Priorizar os eixos críticos no plano de ação.",
    );
  }

  if (params.recommendationsWithoutActions > 0) {
    actions.push("Cadastrar ações para as recomendações ainda sem plano de ação.");
  }

  if (params.overdueActions > 0) {
    actions.push(
      "Regularizar ou reprogramar, com justificativa formal, as ações com prazo vencido.",
    );
  }

  actions.push("Manter o acompanhamento dos responsáveis, prazos e evolução das ações.");
  return actions;
}

function recommendationsWithoutActions(doc: OrientaPdfDocument): number {
  return (
    doc.data.actionPlan.summary.totalRecommendations -
    doc.data.actionPlan.summary.recommendationsWithActions
  );
}

function overdueActions(doc: OrientaPdfDocument): number {
  return doc.data.actionPlan.axes.reduce(
    (total, axis) =>
      total +
      axis.recommendations.reduce(
        (axisTotal, recommendation) =>
          axisTotal +
          recommendation.actions.filter((action) => action.slaLabel === "overdue").length,
        0,
      ),
    0,
  );
}

export function renderConclusionSection(doc: OrientaPdfDocument): Cursor {
  let cur = doc.beginMajorSection(
    "Conclusão institucional",
    undefined,
    "conclusion",
  );

  const d = doc.data;
  const g = d.fami.global;
  const withoutActions = recommendationsWithoutActions(doc);
  const overdue = overdueActions(doc);

  cur = doc.drawSubsectionTitle(cur, "Leitura institucional");
  const maturityInterpretation =
    g.maturityLevel == null
      ? "O FAMI não é aplicável a este diagnóstico porque não há critérios aplicáveis para classificação de maturidade."
      : `O diagnóstico posiciona a organização em ${reportLevelLabel(g.maturityLevel)}. O resultado deve orientar a priorização das fragilidades identificadas e a manutenção das práticas já consolidadas.`;
  cur = doc.drawParagraph(cur, maturityInterpretation, { size: 10, gap: 2 });

  cur = doc.drawSubsectionTitle(cur, "Encaminhamentos prioritários");
  const actions = conclusionPriorityActions({
    criticalAxesCount: d.criticalAxesCount,
    topOpportunityAxis: d.topOpportunityAxis,
    recommendationsWithoutActions: withoutActions,
    overdueActions: overdue,
  });

  for (const [index, action] of actions.entries()) {
    cur = doc.drawParagraph(cur, `${index + 1}. ${action}`, {
      size: 9,
      color: reportTheme.slate700,
      gap: 2,
    });
  }

  return cur;
}
