"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CycleListItem } from "@/features/cycles/cycle-queries";
import { transitionAdminCycle } from "@/features/cycles/client";
import type { ActionPlanCompletionReadiness } from "@/features/improvement-management";
import { useConfirm } from "@/shared/ui/components/confirm-dialog";
import { LoadingButton } from "@/shared/ui/components/loading";
import { formSurface } from "@/shared/layout/form-surface";
import { describeError, notify } from "@/infrastructure/notifications/notify";

function pendingSummary(readiness: ActionPlanCompletionReadiness): string[] {
  const lines: string[] = [];
  if (readiness.countsByReason.exception_pending > 0) {
    lines.push(
      `${readiness.countsByReason.exception_pending} solicitação(ões) de exceção aguardando decisão`,
    );
  }
  if (readiness.countsByReason.missing_active_action > 0) {
    lines.push(
      `${readiness.countsByReason.missing_active_action} recomendação(ões) sem ação ativa`,
    );
  }
  if (readiness.countsByReason.action_not_completed > 0) {
    lines.push(
      `${readiness.countsByReason.action_not_completed} ação(ões) ainda não concluída(s)`,
    );
  }
  if (readiness.countsByReason.open_supervision_request > 0) {
    lines.push(
      `${readiness.countsByReason.open_supervision_request} solicitação(ões) de supervisão abertas`,
    );
  }
  if (readiness.countsByReason.missing_execution_evidence > 0) {
    lines.push(
      `${readiness.countsByReason.missing_execution_evidence} ação(ões) concluída(s) sem comprovação válida`,
    );
  }
  if (readiness.countsByReason.action_not_approved > 0) {
    lines.push(
      `${readiness.countsByReason.action_not_approved} ação(ões) sem aceite válido`,
    );
  }
  return lines;
}

/**
 * Encerramento da avaliação — seção própria, fora do fluxo de reabertura.
 */
export function CycleCloseActions({
  cycle,
  completionReadiness,
}: {
  cycle: CycleListItem;
  completionReadiness: ActionPlanCompletionReadiness | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cycle.state !== "validated") return null;

  const ready = completionReadiness?.ready !== false;
  const summary = completionReadiness && !ready ? pendingSummary(completionReadiness) : [];
  const planHref = `/admin/plano-acao?organizationId=${encodeURIComponent(cycle.organizationId)}&formId=${encodeURIComponent(cycle.formId)}&cycleId=${encodeURIComponent(cycle.id)}`;

  async function handleClose() {
    if (
      !(await confirm({
        title: "Encerrar avaliação?",
        description:
          "O diagnóstico passará para Avaliação encerrada. Esta ação não reabre a validação.",
        confirmLabel: "Encerrar avaliação",
        cancelLabel: "Cancelar",
      }))
    ) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      await transitionAdminCycle(cycle.id, "completed");
      notify.success("Avaliação encerrada com sucesso.");
      router.refresh();
    } catch (caught) {
      setError(describeError(caught, "Falha ao encerrar a avaliação."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">
            Encerramento da avaliação
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Disponível após o acompanhamento do plano de ação.
          </p>
          {!ready && summary.length > 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Pendências no plano de ação: {summary.join("; ")}.{" "}
              <Link
                href={planHref}
                className="font-medium text-brand-700 hover:underline"
              >
                Abrir plano de ação
              </Link>
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              O plano de ação está apto para o encerramento.
            </p>
          )}
          {error ? (
            <p role="alert" className={`mt-2 ${formSurface.messageError}`}>
              {error}
            </p>
          ) : null}
        </div>
        <LoadingButton
          type="button"
          pending={pending}
          pendingLabel="Encerrando…"
          disabled={pending || !ready}
          onClick={() => void handleClose()}
          className={`${formSurface.secondaryButtonSm} shrink-0`}
        >
          Encerrar avaliação
        </LoadingButton>
      </div>
    </div>
  );
}
