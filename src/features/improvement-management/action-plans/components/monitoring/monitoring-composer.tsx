"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { ActionPlanAction } from "@/features/improvement-management/action-plans/domain-model";
import type { SupervisionNoteEntry } from "@/features/improvement-management/action-plans/types";
import { createSupervisionNote } from "@/features/improvement-management/action-plans/client";
import {
  MONITORING_COMPOSER_TYPE_LABELS,
  MONITORING_COMPOSER_TYPES,
  SUPERVISION_NOTE_META,
} from "@/features/improvement-management/action-plans/supervision-presentation";
import type { SupervisionNoteComposerType } from "@/features/improvement-management/action-plans/schemas";
import { PanelSection } from "@/shared/ui/components/panel-section";
import { LoadingButton } from "@/shared/ui/components/loading";
import { formSurface } from "@/shared/layout/form-surface";
import { notify } from "@/infrastructure/notifications/notify";

type Props = {
  recommendationId: string;
  plan: ActionPlanAction;
  openRequestActionIds: Set<string>;
  onCreated: (created: SupervisionNoteEntry) => void;
};

export function MonitoringComposer({
  recommendationId,
  plan,
  openRequestActionIds,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [noteType, setNoteType] = useState<SupervisionNoteComposerType>("comment");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const approvalBlocked = useMemo(() => {
    if (noteType !== "approval") return false;
    return plan.status !== "completed" || openRequestActionIds.has(plan.id);
  }, [noteType, openRequestActionIds, plan.id, plan.status]);

  const adjustmentBlocked = noteType === "adjustment_request" && plan.status === "cancelled";
  const typeBlocked = approvalBlocked || adjustmentBlocked;

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const trimmed = body.trim();
      if (!trimmed || typeBlocked) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const created = await createSupervisionNote({
          recommendationId,
          actionPlanId: plan.id,
          noteType,
          body: trimmed,
        });
        setBody("");
        onCreated(created);
        setOpen(false);
        notify.success("Acompanhamento publicado.");
      } catch (caught) {
        setSubmitError(
          caught instanceof Error ? caught.message : "Falha ao publicar o acompanhamento.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [body, noteType, onCreated, plan.id, recommendationId, typeBlocked],
  );

  return (
    <PanelSection
      title="Acompanhamento"
      description="Registre uma orientação, comentário, solicitação ou decisão sobre a execução desta ação."
      size="compact"
    >
      {open ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
          <label className={formSurface.fieldGroup} htmlFor="monitoring-note-type">
            <span className={formSurface.label}>Tipo</span>
            <select
              id="monitoring-note-type"
              value={noteType}
              onChange={(event) =>
                setNoteType(event.target.value as (typeof MONITORING_COMPOSER_TYPES)[number])
              }
              className={formSurface.inputSelect}
            >
              {MONITORING_COMPOSER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MONITORING_COMPOSER_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          {approvalBlocked ? (
            <p className={formSurface.messageWarning}>
              A decisão de aceite só pode ser registrada em ação concluída e sem solicitação aberta.
            </p>
          ) : null}
          {adjustmentBlocked ? (
            <p className={formSurface.messageWarning}>
              Não é possível solicitar ajuste em uma ação cancelada.
            </p>
          ) : null}
          <label className={formSurface.fieldGroup} htmlFor="monitoring-note-body">
            <span className={formSurface.label}>Registro</span>
            <textarea
              id="monitoring-note-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              maxLength={4000}
              placeholder={SUPERVISION_NOTE_META[noteType].description}
              className={formSurface.inputTextarea}
            />
          </label>
          {submitError ? <p role="alert" className={formSurface.messageError}>{submitError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={formSurface.secondaryButtonSm}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
            <LoadingButton
              type="submit"
              pending={submitting}
              pendingLabel="Publicando…"
              disabled={!body.trim() || submitting || typeBlocked}
              className={formSurface.primaryButtonSm}
            >
              Publicar acompanhamento
            </LoadingButton>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className={formSurface.secondaryButtonSm}
          onClick={() => setOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Registrar acompanhamento
        </button>
      )}
    </PanelSection>
  );
}
