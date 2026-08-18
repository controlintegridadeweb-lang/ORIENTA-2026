import type { Cursor, OrientaPdfDocument } from "../document";
import { contentWidth, reportTheme } from "../theme";
import { drawKpiTile } from "../helpers";

export const EXECUTIVE_SUMMARY_KPI_LABELS = {
  evaluated: "Critérios avaliados",
  attended: "Atendidos",
  notAttended: "Não atendidos",
  insufficientEvidence: "Evidência insuficiente",
  recommendations: "Recomendações",
  actions: "Ações registradas",
} as const;

export function renderExecutiveSummary(doc: OrientaPdfDocument): Cursor {
  let cur = doc.beginMajorSection(
    "Resumo executivo",
    "Visão consolidada do diagnóstico e indicadores-chave.",
    "executive",
  );

  const w = contentWidth();
  const gap = 12;
  const tileW = (w - gap) / 2;
  const tileH = 64;
  cur = doc.ensureBlock(cur, tileH * 3 + gap * 2 + 20);
  const rowY = cur.y;

  const { actionPlan, diagnostic } = doc.data;
  drawKpiTile(doc, cur, {
    label: EXECUTIVE_SUMMARY_KPI_LABELS.evaluated,
    value: String(diagnostic.summary.evaluated),
    sub: `${diagnostic.summary.total} no escopo · ${diagnostic.summary.waived} dispensados`,
    x: reportTheme.margin,
    y: rowY,
    w: tileW,
    h: tileH,
    accent: reportTheme.brand,
  });
  drawKpiTile(doc, cur, {
    label: EXECUTIVE_SUMMARY_KPI_LABELS.attended,
    value: String(diagnostic.summary.attended),
    sub: "resultado validado",
    x: reportTheme.margin + tileW + gap,
    y: rowY,
    w: tileW,
    h: tileH,
    accent: reportTheme.sky,
  });

  const row2Y = rowY - tileH - gap;
  drawKpiTile(doc, cur, {
    label: EXECUTIVE_SUMMARY_KPI_LABELS.notAttended,
    value: String(diagnostic.summary.notAttended),
    sub: "respostas negativas",
    x: reportTheme.margin,
    y: row2Y,
    w: tileW,
    h: tileH,
    accent: reportTheme.emerald,
  });
  drawKpiTile(doc, cur, {
    label: EXECUTIVE_SUMMARY_KPI_LABELS.insufficientEvidence,
    value: String(diagnostic.summary.insufficientEvidence),
    sub: "ausente ou não aprovada",
    x: reportTheme.margin + tileW + gap,
    y: row2Y,
    w: tileW,
    h: tileH,
    accent: reportTheme.amber,
  });

  const row3Y = row2Y - tileH - gap;
  drawKpiTile(doc, cur, {
    label: EXECUTIVE_SUMMARY_KPI_LABELS.recommendations,
    value: String(actionPlan.summary.totalRecommendations),
    sub: "providências geradas",
    x: reportTheme.margin,
    y: row3Y,
    w: tileW,
    h: tileH,
    accent: reportTheme.sky,
  });
  drawKpiTile(doc, cur, {
    label: EXECUTIVE_SUMMARY_KPI_LABELS.actions,
    value: String(actionPlan.summary.totalActions),
    sub: `${actionPlan.summary.recommendationsWithActions} ${actionPlan.summary.recommendationsWithActions === 1 ? "recomendação com ação" : "recomendações com ações"}`,
    x: reportTheme.margin + tileW + gap,
    y: row3Y,
    w: tileW,
    h: tileH,
    accent: reportTheme.emerald,
  });

  cur = { page: cur.page, y: row3Y - tileH - 24 };

  const actionStatus = actionPlan.summary.actionsByStatus;
  cur = doc.drawParagraph(
    cur,
    `Situação das ações: ${actionStatus.completed ?? 0} concluídas, ${actionStatus.in_progress ?? 0} em andamento, ${actionStatus.not_started ?? 0} não iniciadas e ${actionStatus.cancelled ?? 0} canceladas.`,
    { size: 9, color: reportTheme.slate600, gap: 2 },
  );


  return { ...cur, y: cur.y - 12 };
}
