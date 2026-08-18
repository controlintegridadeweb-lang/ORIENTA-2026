"use client";

import { useState } from "react";
import type { ActionPlanAction } from "@/features/improvement-management/action-plans/domain-model";
import { updateRespondentActionProgress } from "@/features/improvement-management/action-plans/client";
import { PLAN_STATUS_LABELS } from "@/features/improvement-management/action-plans/components/shared/plan-status-badge";
import { deriveActionStatus } from "@/features/improvement-management/action-plans/plan-progress";
import { ActionPlanEvidenceManager } from "@/features/improvement-management/recommendations/components/hub/action-plan-evidence-manager";
import { formSurface } from "@/shared/layout/form-surface";
import { LoadingButton } from "@/shared/ui/components/loading";
import { describeError, notify } from "@/infrastructure/notifications/notify";

type Props = {
  plan: ActionPlanAction;
  recommendationId: string;
  onSaved: () => Promise<void>;
  onCancel: () => void;
};

export function UpdateActionProgressForm({
  plan,
  recommendationId,
  onSaved,
  onCancel,
}: Props) {
  const [pending, setPending] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(plan.progressPercentage);
  const [error, setError] = useState<string | null>(null);
  const derivedStatus = deriveActionStatus(progressPercentage, false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await updateRespondentActionProgress({
        intent: "update_progress",
        planId: plan.id,
        recommendationId,
        expectedRevision: plan.revision,
        progressPercentage,
        progressUpdateDescription: String(form.get("progressUpdateDescription") ?? ""),
      });
      notify.success("Andamento atualizado.");
      await onSaved();
    } catch (caught) {
      setError(describeError(caught, "Falha ao atualizar o andamento."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">Atualizar andamento</h3>
        <button type="button" className={formSurface.ghostButton} onClick={onCancel}>
          cancelar
        </button>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2">{plan.actionText}</p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-4 shadow-sm sm:p-5">
        {error ? <p role="alert" className={formSurface.messageError}>{error}</p> : null}

        <div className={formSurface.fieldGroup}>
          <span className={formSurface.label}>Progresso da ação (%)</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              className="min-w-0 flex-1 accent-brand-400"
              value={progressPercentage}
              aria-label="Progresso da ação"
              aria-valuetext={`${progressPercentage}% · ${PLAN_STATUS_LABELS[derivedStatus]}`}
              onChange={(event) => setProgressPercentage(Number(event.target.value))}
            />
            <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-slate-800">
              {progressPercentage}%
            </span>
          </div>
        </div>

        <label className={formSurface.fieldGroup}>
          <span className={formSurface.label}>O que foi realizado nesta atualização?</span>
          <textarea
            name="progressUpdateDescription"
            rows={3}
            className={formSurface.inputTextarea}
            placeholder="Ex.: Capacitação concluída e implantação iniciada."
            required
            minLength={5}
            maxLength={4000}
          />
        </label>

        <ActionPlanEvidenceManager embedded plan={plan} onChanged={onSaved} />

        <LoadingButton
          type="submit"
          pending={pending}
          pendingLabel="Salvando..."
          className={`${formSurface.primaryButton} w-full justify-center sm:w-auto sm:min-w-40`}
        >
          Salvar atualização
        </LoadingButton>
      </form>
    </div>
  );
}
