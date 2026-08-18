"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AdminMonitoringTableFrame } from "@/features/improvement-management/monitoring/components/admin-monitoring-table-primitives";

import { AdminActionPlanProgress } from "@/features/improvement-management/action-plans/components/admin/admin-action-plan-progress";
import { AdminActionPlanStatusBadge } from "@/features/improvement-management/action-plans/components/admin/admin-action-plan-status-badge";
import {
  firstLineAction,
  firstLineRecommendation,
  formatPlanDate,
  riskBadge,
} from "@/features/improvement-management/action-plans/components/admin/admin-action-plan-row-utils";
import type { AdminPlanItem } from "@/features/improvement-management/action-plans/admin-monitoring";
import {
  adminPlanoAcaoDetailHref,
} from "@/shared/navigation/admin-paths";
import { formSurface } from "@/shared/layout/form-surface";
import { currentAdminListPath, withAdminReturnPath } from "@/shared/navigation/admin-navigation-context";

type Props = {
  items: AdminPlanItem[];
  hideOrganizationColumn?: boolean;
};

export function AdminActionPlanTable({
  items,
  hideOrganizationColumn = false,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentAdminListPath(pathname, searchParams.toString());

  if (items.length === 0) return null;

  return (
    <AdminMonitoringTableFrame minWidthClassName="min-w-280">
      <thead className={formSurface.brandTable.head}>
        <tr>
          {hideOrganizationColumn ? null : (
            <th className={`${formSurface.brandTable.headCell} min-w-32`}>Organização</th>
          )}
          <th className={`${formSurface.brandTable.headCell} min-w-24`}>Eixo</th>
          <th className={`${formSurface.brandTable.headCell} min-w-48`}>Recomendação</th>
          <th className={formSurface.brandTable.headCell}>Situação</th>
          <th className={`${formSurface.brandTable.headCell} min-w-40`}>Ação</th>
          <th className={`${formSurface.brandTable.headCell} min-w-28`}>Progresso</th>
          <th className={formSurface.brandTable.headCell}>Prazo</th>
          <th className={formSurface.brandTable.headCell}>Risco</th>
          <th className={`${formSurface.brandTable.headCell} w-16 text-right`}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          const recommendationTitle = firstLineRecommendation(item.recommendationText);
          const actionTitle = firstLineAction(item);
          const risk = riskBadge(item.risk);
          const planoHref = withAdminReturnPath(
            adminPlanoAcaoDetailHref(item.recommendationId, "visao-geral"),
            returnTo,
          );

          return (
            <tr
              key={item.rowKey}
              className={index % 2 === 0 ? formSurface.brandTable.rowEven : formSurface.brandTable.rowOdd}
            >
              {hideOrganizationColumn ? null : (
                <td className={`${formSurface.brandTable.cell} text-slate-700`}>
                  <span className="line-clamp-2" title={item.organizationName}>
                    {item.organizationName}
                  </span>
                </td>
              )}
              <td className={formSurface.brandTable.cell}>
                <span className="line-clamp-2" title={item.axisName}>
                  {item.axisName || "—"}
                </span>
              </td>
              <td className={formSurface.brandTable.cell}>
                <p
                  className="line-clamp-2 font-semibold text-slate-900"
                  title={recommendationTitle}
                >
                  {recommendationTitle}
                </p>
              </td>
              <td className={formSurface.brandTable.cell}>
                <AdminActionPlanStatusBadge view={item.view} />
              </td>
              <td className={formSurface.brandTable.cell}>
                {actionTitle ? (
                  <p className="line-clamp-2 text-sm text-slate-800" title={actionTitle}>
                    {actionTitle}
                  </p>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
              <td className={`${formSurface.brandTable.cell} min-w-32`}>
                <div className="flex min-w-28 items-center gap-2.5">
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-800">
                    {item.progress}%
                  </span>
                  <div className="min-w-16 flex-1">
                    <AdminActionPlanProgress
                      value={item.progress}
                      overdue={item.isOverdue}
                      size="xs"
                      showLabel={false}
                    />
                  </div>
                </div>
              </td>
              <td
                className={`${formSurface.brandTable.cell} whitespace-nowrap ${
                  item.isOverdue ? "font-semibold text-rose-700" : "text-slate-700"
                }`}
              >
                {formatPlanDate(item.dueDate)}
              </td>
              <td className={formSurface.brandTable.cell}>
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-micro font-semibold ${risk.className}`}
                >
                  {risk.label}
                </span>
              </td>
              <td className={`${formSurface.brandTable.cell} text-right`}>
                <Link
                  href={planoHref}
                  title="Abrir plano"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white/80 hover:text-slate-900"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Abrir plano</span>
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </AdminMonitoringTableFrame>
  );
}
