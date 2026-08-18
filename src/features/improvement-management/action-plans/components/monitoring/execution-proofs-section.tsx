"use client";

import Link from "next/link";
import type { ActionPlanAction } from "@/features/improvement-management/action-plans/domain-model";
import {
  ACTION_DOCUMENT_STATUS_LABEL,
  summarizeActionDocuments,
} from "@/features/improvement-management/action-plans/monitoring/summarize-action-documents";
import { formatLocalDate } from "@/shared/datetime/business-date";
import { PanelSection } from "@/shared/ui/components/panel-section";
import { formSurface } from "@/shared/layout/form-surface";
import { typography } from "@/shared/layout/design-system";
import { statusPillBase } from "@/shared/ui/components/status-pill";

type Props = {
  plan: ActionPlanAction;
  consultHref: string | null;
};

export function ExecutionProofsSection({ plan, consultHref }: Props) {
  const summary = summarizeActionDocuments(plan.documents);

  return (
    <PanelSection title="Comprovações da execução" size="compact">
      {summary.current.length === 0 ? (
        <p className={typography.auxiliary}>Nenhuma comprovação nesta revisão da ação.</p>
      ) : (
        <div className="space-y-3">
          {summary.line ? <p className="text-sm text-slate-600">{summary.line}</p> : null}
          <ul>
            {summary.recent.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {document.title.trim() || document.originalFilename || "Comprovação"}
                  </p>
                  <p className={`mt-0.5 ${typography.meta}`}>
                    {formatLocalDate(document.createdAt)}
                  </p>
                </div>
                <span className={`${statusPillBase} bg-slate-100 text-slate-700`}>
                  {ACTION_DOCUMENT_STATUS_LABEL[document.fileValidationStatus]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {consultHref ? (
        <div className="mt-3 flex justify-end">
          <Link href={consultHref} className={formSurface.ghostButton}>
            Consultar comprovações
          </Link>
        </div>
      ) : null}
    </PanelSection>
  );
}
