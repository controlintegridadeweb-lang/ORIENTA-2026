import { describe, expect, it } from "vitest";
import { FAMI_SCORING_GROUPS } from "@/features/fami";
import { conclusionPriorityActions } from "./conclusion-section";
import { EXECUTIVE_SUMMARY_KPI_LABELS } from "./executive-summary";
import { OFFICIAL_REPORT_COVER_FIELD_LABELS } from "./cover-page";
import { hasComparableFamiEvolution } from "./evolution-section";
import { reportPeriodMetadataLines } from "./annexes-section";

describe("coesão textual do relatório oficial", () => {
  it("usa indicadores compatíveis com os valores exibidos", () => {
    expect(EXECUTIVE_SUMMARY_KPI_LABELS).toEqual({
      evaluated: "Critérios avaliados",
      attended: "Atendidos",
      notAttended: "Não atendidos",
      insufficientEvidence: "Evidência insuficiente",
      recommendations: "Recomendações",
      actions: "Ações registradas",
    });
  });


  it("mantém a capa executiva sem metadados técnicos duplicados", () => {
    expect(OFFICIAL_REPORT_COVER_FIELD_LABELS).toEqual([
      "Formulário",
      "Organização",
      "Resultado FAMI",
      "Data da emissão",
    ]);
  });

  it("não duplica período quando período informado e referência são iguais", () => {
    expect(
      reportPeriodMetadataLines({
        periodLabel: "2026",
        referencePeriodLabel: "2026",
      }),
    ).toEqual(["Período: 2026"]);

    expect(
      reportPeriodMetadataLines({
        periodLabel: "2026.1",
        referencePeriodLabel: "2026",
      }),
    ).toEqual(["Período: 2026.1", "Período de referência: 2026"]);
  });

  it("só exibe evolução FAMI com pelo menos dois resultados comparáveis", () => {
    expect(hasComparableFamiEvolution([])).toBe(false);
    expect(hasComparableFamiEvolution([{ globalPercentage: 50 }])).toBe(false);
    expect(
      hasComparableFamiEvolution([
        { globalPercentage: null },
        { globalPercentage: 50 },
      ]),
    ).toBe(false);
    expect(
      hasComparableFamiEvolution([
        { globalPercentage: 50 },
        { globalPercentage: null },
        { globalPercentage: 60 },
      ]),
    ).toBe(true);
  });

  it("consolida prioridades e próximos passos em encaminhamentos acionáveis", () => {
    expect(conclusionPriorityActions({
      criticalAxesCount: 0,
      recommendationsWithoutActions: 0,
      overdueActions: 0,
    })).toEqual([
      "Manter o acompanhamento dos responsáveis, prazos e evolução das ações.",
    ]);

    const actions = conclusionPriorityActions({
      criticalAxesCount: 2,
      topOpportunityAxis: "Social",
      recommendationsWithoutActions: 1,
      overdueActions: 1,
    });
    expect(actions).toEqual([
      "Priorizar o eixo Social e manter o acompanhamento dos demais eixos críticos.",
      "Cadastrar ações para as recomendações ainda sem plano de ação.",
      "Regularizar ou reprogramar, com justificativa formal, as ações com prazo vencido.",
      "Manter o acompanhamento dos responsáveis, prazos e evolução das ações.",
    ]);
    expect(actions.join(" ")).not.toContain("validar evidências");
  });

  it("reflete a regra FAMI vigente: 1,0 sem exigência; 0 sem aprovação em evidência", () => {
    const basicPoints = FAMI_SCORING_GROUPS.find((group) => group.id === "yes");
    const zeroPoints = FAMI_SCORING_GROUPS.find((group) => group.id === "zero");

    expect(basicPoints?.items).toEqual([
      "Resposta Sim em critério que não exige evidência.",
    ]);
    expect(zeroPoints?.items).toEqual([
      "Resposta Não.",
      "Resposta Sim em critério que exige evidência, mas sem comprovação aprovada.",
    ]);
  });
});
