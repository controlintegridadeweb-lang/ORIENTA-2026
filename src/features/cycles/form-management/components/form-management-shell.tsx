"use client";

import Link from "next/link";
import { formSurface } from "@/shared/layout/form-surface";
import { layout } from "@/shared/layout/design-system";
import type { FormManagementDetails } from "../types";
import { useFormManagementController } from "./useFormManagementController";
import { FormManagementHistorySection } from "./form-management-history-section";
import { FormManagementOverviewSection } from "./form-management-overview-section";
import { FormManagementOrganizationsSection } from "./form-management-organizations-section";
import { FormManagementActionsSection } from "./form-management-actions-section";

export function FormManagementShell({
  details: initialDetails,
  returnTo,
}: {
  details: FormManagementDetails;
  returnTo: string;
}) {
  const controller = useFormManagementController(initialDetails);
  const { details, startOrganizationAction } = controller;

  return (
    <div className={`${layout.panelStack} pt-1`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Detalhes e gestão do formulário
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {details.formName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Versão {details.formVersion || "—"} · Período {details.periodLabel || "—"}
          </p>
        </div>
        <Link href={returnTo} className={formSurface.secondaryButtonSm}>
          Voltar ao acompanhamento
        </Link>
      </header>

      <FormManagementOverviewSection details={details} />
      <FormManagementOrganizationsSection
        details={details}
        startOrganizationAction={startOrganizationAction}
      />
      <FormManagementActionsSection controller={controller} />
      <FormManagementHistorySection history={details.history} />
    </div>
  );
}
