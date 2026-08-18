import type { ReactNode } from "react";
import { FilePlus } from "lucide-react";
import { AdminNewFormHero } from "@/features/forms/components/admin/admin-new-form-hero";
import { ADMIN_PAGE_HERO_BLEED } from "@/shared/layout/admin-page-layout";
import { layout, typography } from "@/shared/layout/design-system";
import { formSurface } from "@/shared/layout/form-surface";
import { FormWizardStepper } from "./form-wizard-stepper";
import type { FormWizardStepId } from "./form-wizard-steps";

type Props = {
  backHref: string;
  backLabel?: string;
  formName?: string;
  currentStep: FormWizardStepId;
  maxReachableStep: FormWizardStepId;
  onStepSelect?: (step: FormWizardStepId) => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Shell do assistente linear de criação/publicação de formulário. */
export function FormWizardShell({
  backHref,
  backLabel,
  formName,
  currentStep,
  maxReachableStep,
  onStepSelect,
  children,
  footer,
}: Props) {
  return (
    <div className={layout.pageStack}>
      <div className={ADMIN_PAGE_HERO_BLEED}>
        <AdminNewFormHero
          backHref={backHref}
          backLabel={backLabel}
          title={formName ? formName : undefined}
          subtitle={
            formName
              ? "Assistente de publicação — o formulário permanece em rascunho até você publicar."
              : undefined
          }
        />
      </div>

      <div className={`${layout.pageStack} pt-1`}>
        <section className={layout.sectionStack} aria-label="Assistente de formulário">
          <h2 className={typography.sectionTitle}>Assistente</h2>

          <div className={formSurface.dashboardPanel}>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6 md:px-7">
              <FormWizardStepper
                currentStep={currentStep}
                maxReachableStep={maxReachableStep}
                onStepSelect={onStepSelect}
              />
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-6 md:px-7">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FilePlus className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">{children}</div>
            </div>

            {footer ? (
              <footer className="border-t border-slate-100 px-5 py-4 sm:px-6 md:px-7">
                {footer}
              </footer>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
