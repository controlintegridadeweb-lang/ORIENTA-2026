import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { pickOne } from "@/features/improvement-management/action-plans/domain-model";
import { queryActionPlanRecommendationRows } from "./cycle-read-model";
import type { RecommendationRowRaw } from "./types";

export const ACTION_PLAN_COMPLETION_BLOCK_REASONS = [
  "exception_pending",
  "missing_active_action",
  "action_not_completed",
  "open_supervision_request",
  "missing_execution_evidence",
  "action_not_approved",
] as const;

export type ActionPlanCompletionBlockReason =
  (typeof ACTION_PLAN_COMPLETION_BLOCK_REASONS)[number];

export type ActionPlanCompletionBlock = {
  recommendationId: string;
  questionId: string;
  questionPrompt: string;
  actionPlanId: string | null;
  actionLabel: string | null;
  reason: ActionPlanCompletionBlockReason;
};

export type ActionPlanCompletionReadiness = {
  ready: boolean;
  pendingCount: number;
  blocks: ActionPlanCompletionBlock[];
  countsByReason: Record<ActionPlanCompletionBlockReason, number>;
};

type BlockerRow = {
  recommendation_id: string;
  action_plan_id: string | null;
  blocker: ActionPlanCompletionBlockReason;
};

const blockerRowSchema = z.object({
  recommendation_id: z.string().min(1),
  action_plan_id: z.string().min(1).nullable(),
  blocker: z.enum(ACTION_PLAN_COMPLETION_BLOCK_REASONS),
});

function emptyCounts(): Record<ActionPlanCompletionBlockReason, number> {
  return {
    exception_pending: 0,
    missing_active_action: 0,
    action_not_completed: 0,
    open_supervision_request: 0,
    missing_execution_evidence: 0,
    action_not_approved: 0,
  };
}

function actionLabel(row: RecommendationRowRaw | undefined, actionPlanId: string | null) {
  if (!row || !actionPlanId) return null;
  const plans = Array.isArray(row.action_plans)
    ? row.action_plans
    : row.action_plans
      ? [row.action_plans]
      : [];
  const plan = plans.find((item) => String(item.id) === actionPlanId);
  const text = String(plan?.action_text ?? "").trim();
  if (!text) return null;
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

/**
 * Converte os bloqueios calculados pelo banco em uma visão legível da UI.
 * A regra permanece centralizada em `cycle_action_plan_supervision_blockers`;
 * esta função apenas enriquece cada item com o critério e a ação correspondentes.
 */
export function evaluateActionPlanCompletionReadiness(
  blockers: BlockerRow[],
  recommendations: RecommendationRowRaw[],
): ActionPlanCompletionReadiness {
  const recommendationById = new Map(
    recommendations.map((recommendation) => [recommendation.id, recommendation]),
  );
  const countsByReason = emptyCounts();

  const blocks = blockers.map<ActionPlanCompletionBlock>((blocker) => {
    const recommendation = recommendationById.get(blocker.recommendation_id);
    const question = recommendation ? pickOne(recommendation.questions) : null;
    countsByReason[blocker.blocker] += 1;
    return {
      recommendationId: blocker.recommendation_id,
      questionId: recommendation?.question_id ?? "",
      questionPrompt: question?.prompt ?? "Critério sem título",
      actionPlanId: blocker.action_plan_id,
      actionLabel: actionLabel(recommendation, blocker.action_plan_id),
      reason: blocker.blocker,
    };
  });

  return {
    ready: blocks.length === 0,
    pendingCount: blocks.length,
    blocks,
    countsByReason,
  };
}

export async function loadActionPlanCompletionReadiness(
  client: SupabaseClient,
  cycleId: string,
): Promise<ActionPlanCompletionReadiness> {
  const [recommendations, blockerResult] = await Promise.all([
    queryActionPlanRecommendationRows(client, { cycleId }),
    client.rpc("cycle_action_plan_supervision_blockers", { p_cycle_id: cycleId }),
  ]);
  if (blockerResult.error) throw blockerResult.error;
  const blockers = z.array(blockerRowSchema).parse(blockerResult.data ?? []);
  return evaluateActionPlanCompletionReadiness(blockers, recommendations);
}
