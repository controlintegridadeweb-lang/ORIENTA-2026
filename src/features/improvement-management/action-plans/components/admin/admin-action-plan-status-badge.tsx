"use client";

import { WorkflowStatusBadge } from "@/shared/ui/components/workflow-status-badge";
import type { PlanStatus } from "@/features/improvement-management/action-plans/schemas";
import type { AdminPlanView } from "@/features/improvement-management/action-plans/admin-monitoring";

type Props = {
  status?: PlanStatus;
  view?: AdminPlanView;
  withIcon?: boolean;
  size?: "sm" | "md";
};

export function AdminActionPlanStatusBadge({
  status,
  view,
  withIcon = false,
  size = "sm",
}: Props) {
  const resolved = status ?? view ?? "not_started";
  if (resolved === "overdue") {
    return (
      <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
        Em atraso
      </span>
    );
  }
  return (
    <WorkflowStatusBadge
      domain="action_plan"
      status={resolved}
      size={size === "md" ? "md" : "default"}
      showIcon={withIcon}
    />
  );
}
