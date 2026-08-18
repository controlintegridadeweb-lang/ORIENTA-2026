"use client";

import Link from "next/link";
import { countLabel } from "@/shared/format/count-label";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { MetricCard } from "@/shared/ui/components/metric-card";
import { PanelSection } from "@/shared/ui/components/panel-section";
import { AdminActionPlanProgress } from "@/features/improvement-management/action-plans/components/admin/admin-action-plan-progress";
import { computeActionPlanMetrics } from "@/features/improvement-management/action-plans/plan-metrics";
import { PLAN_PROGRESS_CALCULATION_HINT } from "@/features/improvement-management/recommendations/respondent-presentation";
import { recommendationTypeLabel } from "@/shared/ui/status-registry";
import { adminPlanoAcaoDetailHref } from "@/shared/navigation/admin-paths";
import { formSurface } from "@/shared/layout/form-surface";
import { layout, typography } from "@/shared/layout/design-system";
import { useRecommendationDetailContext } from "@/features/improvement-management/recommendations/components/hub/recommendation-detail-context";
import { formatLocalDate } from "@/shared/datetime/business-date";
import {
  adminReturnPathOrFallback,
  withAdminReturnPath,
} from "@/shared/navigation/admin-navigation-context";

const PANEL = `${formSurface.dashboardPanel} ${formSurface.dashboardPanelPadding}`;

function buildInstitutionalSummary(
  progress: number,
  stats: {
    overdue: number;
    noResp: number;
    completed: number;
    total: number;
    active: number;
  },
  hasPlan: boolean,
): string {
  if (!hasPlan || stats.total === 0) {
    return "A organização ainda não estruturou o plano de ação desta recomendação. Acompanhe a evolução e registre orientações na supervisão quando necessário.";
  }
  if (stats.active > 0 && stats.completed === stats.active) {
    return "Plano concluído pela organização. Revise entregas e evidências antes de encerrar a avaliação.";
  }
  if (stats.overdue > 0) {
    return `Execução em andamento com ${countLabel(stats.overdue, "ação em atraso", "ações em atraso")} — requer acompanhamento gerencial.`;
  }
  if (progress < 40) {
    return `Plano iniciado (${progress}% de progresso). A organização está estruturando a execução.`;
  }
  return `Execução em curso (${progress}% de progresso).`;
}

/** Resumo executivo do plano — primeira aba do workspace de supervisão (admin). */
export function AdminActionPlanExecutiveOverview() {
  const ctx = useRecommendationDetailContext();
  const row = ctx.row;
  const adminItem = ctx.adminItem;
  const searchParams = useSearchParams();

  const plans = useMemo(() => row?.plans ?? [], [row?.plans]);
  const stats = useMemo(() => computeActionPlanMetrics(plans), [plans]);
  const progress = stats.progress;

  if (!row || !adminItem) return null;

  const returnTo = adminReturnPathOrFallback(
    searchParams.get("returnTo"),
    "/admin/plano-acao",
  );
  const acoesHref = withAdminReturnPath(
    adminPlanoAcaoDetailHref(row.recommendationId, "acoes"),
    returnTo,
  );
  const monitoramentoHref = withAdminReturnPath(
    adminPlanoAcaoDetailHref(row.recommendationId, "monitoramento"),
    returnTo,
  );
  const overdue = adminItem.isOverdue;

  const blockers: string[] = [];
  if (!adminItem.hasPlan || stats.total === 0) {
    blockers.push("Plano de ação ainda não cadastrado pela organização");
  }
  if (stats.overdue > 0) {
    blockers.push(countLabel(stats.overdue, "ação com final vencido", "ações com final vencido"));
  }
  if (stats.noResp > 0) {
    blockers.push(countLabel(stats.noResp, "ação sem responsável definido", "ações sem responsável definido"));
  }

  const summaryText = buildInstitutionalSummary(progress, stats, adminItem.hasPlan);
  const pendingCount = Math.max(0, stats.active - stats.completed);
  const fieldLabel = typography.fieldLabel;

  return (
    <div className={layout.panelStack}>
      <PanelSection
        title="Resumo do plano"
        description="Progresso consolidado e dados institucionais da execução."
        variant="plain"
        actions={
          <div className="text-right">
            <p className={typography.metricLabel}>Progresso consolidado</p>
            <p className={`mt-1.5 ${typography.metricValueCompact}`}>{progress}%</p>
          </div>
        }
      >
        <div className={`${PANEL} space-y-4`}>
          <AdminActionPlanProgress value={progress} overdue={overdue} size="sm" showLabel={false} />
          <p className="text-xs leading-relaxed text-slate-600">{PLAN_PROGRESS_CALCULATION_HINT}</p>

          <dl className="grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className={fieldLabel}>Organização</dt>
              <dd className="mt-0.5 text-slate-800">{row.organizationName}</dd>
            </div>
            <div>
              <dt className={fieldLabel}>Formulário</dt>
              <dd className="mt-0.5 text-slate-800">
                {row.formName}
                <span className="tabular-nums text-slate-400"> v{adminItem.formVersion}</span>
              </dd>
            </div>
            <div>
              <dt className={fieldLabel}>Eixo</dt>
              <dd className="mt-0.5 text-slate-800">{row.axisName || "—"}</dd>
            </div>
            <div>
              <dt className={fieldLabel}>Início</dt>
              <dd className="mt-0.5 text-slate-800">
                {formatLocalDate(adminItem.startDate)}
              </dd>
            </div>
            <div>
              <dt className={fieldLabel}>Final</dt>
              <dd className="mt-0.5 text-slate-800">
                {formatLocalDate(adminItem.dueDate)}
                {overdue ? (
                  <span className="ml-1.5 text-xs font-semibold text-rose-700">Atrasado</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className={fieldLabel}>Responsável</dt>
              <dd className="mt-0.5 text-slate-800">
                {adminItem.responsibleName || "Não definido"}
              </dd>
            </div>
          </dl>
        </div>
      </PanelSection>

      <PanelSection
        title="Indicadores"
        description="Panorama consolidado do progresso e da situação das ações."
        variant="plain"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            variant="neutral"
            density="compact"
            label="Total de ações"
            value={stats.total}
            secondary={countLabel(stats.completed, "concluída", "concluídas")}
          />
          <MetricCard
            variant={stats.overdue > 0 ? "danger" : "neutral"}
            density="compact"
            label="Atrasadas"
            value={stats.overdue}
            secondary={stats.overdue > 0 ? "Exigem supervisão" : undefined}
            status={stats.overdue > 0 ? "critical" : undefined}
          />
          <MetricCard
            variant={pendingCount > 0 ? "warning" : "success"}
            density="compact"
            label="Pendências"
            value={pendingCount + stats.noResp}
            secondary={
              stats.noResp > 0
                ? `${stats.noResp} sem responsável`
                : pendingCount > 0
                  ? "Em execução"
                  : "Nenhuma pendência"
            }
            status={stats.noResp > 0 || stats.overdue > 0 ? "attention" : "neutral"}
          />
        </div>
      </PanelSection>

      <PanelSection
        title="Situação do plano"
        description="Leitura gerencial — bloqueios e próximos passos."
        variant="plain"
      >
        <div className={`${PANEL} space-y-4`}>
          <p className="text-sm leading-relaxed text-slate-700">{summaryText}</p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className={formSurface.label}>Bloqueios</p>
            {blockers.length === 0 ? (
              <p className="mt-1 text-sm text-slate-700">
                Nenhum bloqueio crítico identificado no momento.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {blockers.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-amber-950">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <Link
              href={acoesHref}
              className={`${formSurface.secondaryButtonSm} inline-flex items-center gap-1`}
            >
              Ver execução
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link
              href={monitoramentoHref}
              className={`${formSurface.primaryButtonSm} inline-flex items-center gap-1`}
            >
              Ir para monitoramento
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </PanelSection>

      <PanelSection
        title="Relação com o próximo diagnóstico"
        description="As ações podem contribuir para avaliações futuras, sem alterar o resultado FAMI já concluído."
        variant="plain"
      >
        <div className={PANEL}>
          <p className="text-sm leading-relaxed text-slate-700">
            {recommendationTypeLabel(row.recommendationType)}. Efeito esperado: potencial de
            melhoria a ser verificado em um próximo diagnóstico.
          </p>
        </div>
      </PanelSection>
    </div>
  );
}
