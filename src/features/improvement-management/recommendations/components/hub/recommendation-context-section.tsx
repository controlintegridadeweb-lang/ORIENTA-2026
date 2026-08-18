import type { ActionPlanListItem } from "@/features/improvement-management/action-plans/types";
import {
  OverviewBlockTitle,
  OverviewMetaGrid,
  OverviewMetaItem,
  OverviewSoftPanel,
  RecommendationCardText,
  overviewStack,
} from "@/features/improvement-management/recommendations/components/hub/overview-section-primitives";
import { recommendationTypeLabel } from "@/shared/ui/status-registry";
import { getAxisTheme } from "@/shared/theme/axis-theme";

type Props = {
  row: ActionPlanListItem;
};

/** Cabeçalho de escopo (Eixo + Seção) — primeiro bloco da Visão geral. */
export function RecommendationScopeHeader({ row }: Props) {
  const theme = getAxisTheme(row.axisName);
  return (
    <OverviewSoftPanel
      className="relative space-y-3 overflow-hidden"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.softBackground,
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: theme.primary }}
        aria-hidden
      />
      <div className="relative space-y-1">
        <RecommendationCardText variant="label" as="p">
          Eixo
        </RecommendationCardText>
        <p
          className="text-xl font-bold tracking-tight sm:text-2xl"
          style={{ color: theme.text }}
        >
          {row.axisName}
        </p>
      </div>

      {row.sectionName ? (
        <div className="relative rounded-xl bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Seção
          </p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {row.sectionName}
          </p>
        </div>
      ) : null}
    </OverviewSoftPanel>
  );
}

export function RecommendationContextSection({ row }: Props) {
  const cycleLabel = row.periodLabel?.trim() || row.cycleState;

  return (
    <section aria-labelledby="rec-context-heading" className={overviewStack}>
      <OverviewBlockTitle
        id="rec-context-heading"
        title="Contexto"
        description="Onde esta recomendação se encaixa no diagnóstico."
      />

      <OverviewSoftPanel>
        <OverviewMetaGrid>
          <OverviewMetaItem
            label="Formulário"
            value={`${row.formName} · Versão ${row.formVersion}`}
          />
          <OverviewMetaItem label="Órgão" value={row.organizationName} />
          <OverviewMetaItem
            label="Tipo"
            value={recommendationTypeLabel(row.recommendationType)}
          />
          <OverviewMetaItem label="Ciclo" value={cycleLabel} />
        </OverviewMetaGrid>
      </OverviewSoftPanel>
    </section>
  );
}
