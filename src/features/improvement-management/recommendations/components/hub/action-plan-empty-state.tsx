"use client";

import { Plus } from "lucide-react";
import { formSurface } from "@/shared/layout/form-surface";
import {
  OverviewSoftPanel,
  RecommendationCardText,
} from "@/features/improvement-management/recommendations/components/hub/overview-section-primitives";

type Props = {
  onCreate: () => void;
  /** Mantido por compatibilidade com callers anteriores. */
  accentColor?: string;
};

export function ActionPlanEmptyState({ onCreate }: Props) {
  return (
    <OverviewSoftPanel>
      <div className="flex flex-col items-start gap-3 py-2 sm:items-center sm:py-6 sm:text-center">
        <div className="space-y-1.5">
          <p className="text-base font-bold text-slate-900">Nenhuma ação cadastrada.</p>
          <RecommendationCardText variant="meta">
            Cadastre a primeira ação para iniciar a execução desta recomendação.
          </RecommendationCardText>
        </div>
        <button
          type="button"
          className={`${formSurface.primaryButton} inline-flex items-center justify-center gap-2`}
          onClick={onCreate}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Nova ação
        </button>
      </div>
    </OverviewSoftPanel>
  );
}
