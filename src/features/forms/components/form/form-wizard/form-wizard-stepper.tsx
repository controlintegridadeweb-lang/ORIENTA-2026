"use client";

import { Check } from "lucide-react";
import { FORM_WIZARD_STEPS, type FormWizardStepId } from "./form-wizard-steps";

type Props = {
  currentStep: FormWizardStepId;
  maxReachableStep: FormWizardStepId;
  onStepSelect?: (step: FormWizardStepId) => void;
};

export function FormWizardStepper({ currentStep, maxReachableStep, onStepSelect }: Props) {
  return (
    <nav aria-label="Etapas do formulário" className="w-full min-w-0">
      <ol className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-0">
        {FORM_WIZARD_STEPS.map((step, index) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          const reachable = step.id <= maxReachableStep;
          const isLast = index === FORM_WIZARD_STEPS.length - 1;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2 md:gap-0">
              <button
                type="button"
                disabled={!reachable || !onStepSelect}
                onClick={() => onStepSelect?.(step.id)}
                className={[
                  "flex min-h-11 w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-left transition md:flex-col md:items-center md:gap-2 md:px-2 md:py-2.5 md:text-center",
                  active ? "bg-brand-50/80" : "",
                  reachable && onStepSelect ? "hover:bg-slate-50" : "",
                  !reachable ? "cursor-default opacity-50" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    done
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : active
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-slate-300 bg-white text-slate-600",
                  ].join(" ")}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : step.id}
                </span>
                <span className="min-w-0 md:text-center">
                  <span
                    className={`block break-words text-sm font-medium leading-snug md:text-xs ${active ? "text-brand-800" : "text-slate-700"}`}
                  >
                    <span className="md:hidden">{step.label}</span>
                    <span className="hidden md:inline">{step.shortLabel}</span>
                  </span>
                  {!active && !done ? (
                    <span className="mt-0.5 block text-xs text-slate-500 md:hidden">
                      Etapa futura
                    </span>
                  ) : null}
                </span>
              </button>
              {!isLast ? (
                <span
                  className="hidden h-px flex-1 bg-slate-200 md:block"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
