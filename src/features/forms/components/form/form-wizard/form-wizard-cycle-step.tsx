"use client";

import { diagnosisLabels } from "@/shared/labels/official-labels";

/**
 * Etapa 4 — próximos passos para disponibilização em diagnósticos.
 *
 * O prazo de resposta não é definido no modelo de formulário: ele pertence ao
 * diagnóstico, criado para cada organização e período. Esta etapa apenas orienta
 * o administrador; não grava prazo no formulário.
 */
export function FormWizardCycleStep() {
  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h3 className="text-base font-medium text-slate-900">Próximos passos após a publicação</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          O formulário é um modelo. Depois de publicá-lo, crie um diagnóstico para cada
          organização e período, definindo o início e o prazo de resposta.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="space-y-3 p-4">
          <p className="text-sm text-slate-700">
            Ao publicar este formulário, ele fica disponível como versão para novos diagnósticos.
            Cada diagnóstico (organização + período) define seu próprio prazo de resposta em{" "}
            <span className="font-medium">Diagnósticos</span>.
          </p>
          <p className="border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500" title={diagnosisLabels.configHint}>
            {diagnosisLabels.configHint}
          </p>
          <p className="text-xs text-slate-500">
            Os ajustes solicitados em evidências seguem a Regra Oficial após o envio das respostas
            e a validação de evidências.
          </p>
        </div>
      </div>
    </section>
  );
}
