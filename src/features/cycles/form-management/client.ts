import { apiResponseSchema, buildHeaders, formatError, parseJson } from "@/infrastructure/api/fetch-client";
import { objectContract } from "@/infrastructure/api/contract-schema";
import type { DeadlineScope } from "./domain";
import type { FormManagementMutationResult } from "./types";

const formManagementMutationContract = objectContract<FormManagementMutationResult>(
  "resultado de alteração da aplicação",
  { batchId: "string", updated: "number", action: "string" },
);
const mutationResponseSchema = apiResponseSchema({ result: formManagementMutationContract.optional() });
function formApplicationPath(formId: string, suffix = "") {
  return `/api/admin/form-applications/${encodeURIComponent(formId)}${suffix}`;
}

export async function changeFormApplicationDeadline(input: {
  formId: string;
  periodLabel: string;
  action: "change_deadline" | "extend_deadline" | "early_close";
  scope: DeadlineScope;
  organizationIds?: string[];
  newDeadlineAt?: string | null;
  justification: string;
}): Promise<FormManagementMutationResult> {
  const res = await fetch(formApplicationPath(input.formId, "/deadline"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      periodLabel: input.periodLabel,
      action: input.action,
      scope: input.scope,
      organizationIds: input.organizationIds,
      newDeadlineAt: input.newDeadlineAt ?? null,
      justification: input.justification,
    }),
  });
  const body = await parseJson(res, mutationResponseSchema);
  if (!res.ok || !body.result) throw new Error(formatError(body));
  return body.result;
}

export async function setFormApplicationPause(input: {
  formId: string;
  periodLabel: string;
  pause: boolean;
  scope?: DeadlineScope;
  organizationIds?: string[];
  justification: string;
}): Promise<FormManagementMutationResult> {
  const res = await fetch(formApplicationPath(input.formId, "/collection-pause"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      periodLabel: input.periodLabel,
      pause: input.pause,
      scope: input.scope ?? "all",
      organizationIds: input.organizationIds,
      justification: input.justification,
    }),
  });
  const body = await parseJson(res, mutationResponseSchema);
  if (!res.ok || !body.result) throw new Error(formatError(body));
  return body.result;
}

export async function reopenFormApplication(input: {
  formId: string;
  periodLabel: string;
  scope: DeadlineScope;
  organizationIds?: string[];
  newDeadlineAt: string;
  justification: string;
  reopenMode?: "full" | "partial";
  questionVersionIds?: string[];
}): Promise<FormManagementMutationResult> {
  const res = await fetch(formApplicationPath(input.formId, "/reopen"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      periodLabel: input.periodLabel,
      scope: input.scope,
      organizationIds: input.organizationIds,
      newDeadlineAt: input.newDeadlineAt,
      justification: input.justification,
      reopenMode: input.reopenMode ?? "full",
      questionVersionIds: input.questionVersionIds,
    }),
  });
  const body = await parseJson(res, mutationResponseSchema);
  if (!res.ok || !body.result) throw new Error(formatError(body));
  return body.result;
}

export async function reopenFormApplicationValidation(input: {
  formId: string;
  periodLabel: string;
  scope: DeadlineScope;
  organizationIds?: string[];
  justification: string;
}): Promise<FormManagementMutationResult> {
  const res = await fetch(formApplicationPath(input.formId, "/reopen-validation"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      periodLabel: input.periodLabel,
      scope: input.scope,
      organizationIds: input.organizationIds,
      justification: input.justification,
    }),
  });
  const body = await parseJson(res, mutationResponseSchema);
  if (!res.ok || !body.result) throw new Error(formatError(body));
  return body.result;
}
