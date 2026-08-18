"use client";

import type { PlanStatus } from "@/features/improvement-management/action-plans/schemas";
import { ACTION_PLAN_REGISTRY } from "@/shared/ui/status-registry";

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = Object.fromEntries(
  (Object.keys(ACTION_PLAN_REGISTRY) as PlanStatus[]).map((k) => [
    k,
    ACTION_PLAN_REGISTRY[k].label,
  ]),
) as Record<PlanStatus, string>;
