"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePatchState } from "@/shared/hooks/use-patch-state";
import { describeError } from "@/infrastructure/notifications/notify";
import {
  listActionPlanAudit,
  listActionPlanProgressUpdates,
  listAdminDeadlineChangeRequests,
  listRespondentActionPlanAudit,
  listRespondentActionPlanProgressUpdates,
  listRespondentDeadlineChangeRequests,
  listRespondentSupervisionNotes,
  listSupervisionNotes,
} from "@/features/improvement-management/action-plans/client";
import type {
  ActionPlanAuditEntry,
  ActionPlanDeadlineChangeRequest,
  ActionPlanProgressUpdate,
  SupervisionNoteEntry,
} from "@/features/improvement-management/action-plans/types";
import type { AuditFeedItem } from "@/features/improvement-management/recommendations/components/hub/action-plan-audit-feed";
import { loadOpenRequestActionIds } from "@/features/improvement-management/action-plans/monitoring/load-open-request-action-ids";
import { buildPendingDecisions } from "@/features/improvement-management/action-plans/monitoring/build-monitoring-history";

const NOTES_LIMIT = 100;
const DEADLINE_LIMIT = 50;
const AUDIT_PAGE_SIZE = 20;

type Role = "admin" | "respondent";

type Args = {
  role: Role;
  recommendationId: string | undefined;
  selectedActionId: string | null;
};

export function useActionMonitoringWorkspace({
  role,
  recommendationId,
  selectedActionId,
}: Args) {
  const [state, patchState] = usePatchState({
    notes: [] as SupervisionNoteEntry[],
    notesError: null as string | null,
    notesLoading: false,
    notesRetry: 0,
    openRequestActionIds: new Set<string>(),
    deadlineRequests: [] as ActionPlanDeadlineChangeRequest[],
    deadlineError: null as string | null,
    deadlineLoading: false,
    deadlineRetry: 0,
    progressUpdates: [] as ActionPlanProgressUpdate[],
    progressError: null as string | null,
    progressLoading: false,
    progressRetry: 0,
    auditEntries: [] as ActionPlanAuditEntry[],
    auditOffset: 0,
    auditTotal: 0,
    auditHasMore: false,
    auditLoading: false,
    auditError: null as string | null,
    auditRetry: 0,
  });

  useEffect(() => {
    patchState({ auditOffset: 0 });
  }, [recommendationId, selectedActionId, patchState]);

  useEffect(() => {
    if (!recommendationId) {
      patchState({
        notes: [],
        notesError: null,
        notesLoading: false,
        openRequestActionIds: new Set(),
      });
      return;
    }

    let cancelled = false;
    patchState({ notesLoading: true, notesError: null });
    const notesLoader =
      role === "admin" ? listSupervisionNotes : listRespondentSupervisionNotes;

    void Promise.all([
      notesLoader(recommendationId, { limit: NOTES_LIMIT, offset: 0 }),
      role === "admin"
        ? loadOpenRequestActionIds(recommendationId)
        : Promise.resolve(new Set<string>()),
    ])
      .then(([notesPage, openIds]) => {
        if (cancelled) return;
        patchState({
          notes: notesPage.items,
          openRequestActionIds: openIds,
        });
      })
      .catch((caught) => {
        if (cancelled) return;
        patchState({
          notesError: describeError(caught, "Falha ao carregar o acompanhamento."),
        });
      })
      .finally(() => {
        if (!cancelled) patchState({ notesLoading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [recommendationId, role, state.notesRetry, patchState]);

  useEffect(() => {
    if (!selectedActionId) {
      patchState({
        deadlineRequests: [],
        deadlineError: null,
        deadlineLoading: false,
        progressUpdates: [],
        progressError: null,
        progressLoading: false,
      });
      return;
    }

    let cancelled = false;
    patchState({
      deadlineLoading: true,
      deadlineError: null,
      progressLoading: true,
      progressError: null,
    });

    const deadlineLoader =
      role === "admin"
        ? listAdminDeadlineChangeRequests
        : listRespondentDeadlineChangeRequests;
    const progressLoader =
      role === "admin"
        ? listActionPlanProgressUpdates
        : listRespondentActionPlanProgressUpdates;

    void Promise.all([
      deadlineLoader({ planId: selectedActionId, limit: DEADLINE_LIMIT, offset: 0 }),
      progressLoader(selectedActionId),
    ])
      .then(([deadlinePage, progressItems]) => {
        if (cancelled) return;
        patchState({
          deadlineRequests: deadlinePage.items,
          progressUpdates: progressItems,
        });
      })
      .catch((caught) => {
        if (cancelled) return;
        const message = describeError(caught, "Falha ao carregar o acompanhamento.");
        patchState({
          deadlineError: message,
          progressError: message,
        });
      })
      .finally(() => {
        if (!cancelled) {
          patchState({
            deadlineLoading: false,
            progressLoading: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectedActionId,
    role,
    state.deadlineRetry,
    state.progressRetry,
    patchState,
  ]);

  useEffect(() => {
    if (!selectedActionId) {
      patchState({
        auditEntries: [],
        auditTotal: 0,
        auditHasMore: false,
        auditError: null,
        auditLoading: false,
      });
      return;
    }
    let cancelled = false;
    patchState({ auditLoading: true, auditError: null });
    const loader = role === "admin" ? listActionPlanAudit : listRespondentActionPlanAudit;
    void loader(selectedActionId, {
      limit: AUDIT_PAGE_SIZE,
      offset: state.auditOffset,
    })
      .then((page) => {
        if (cancelled) return;
        patchState({
          auditEntries: page.items,
          auditTotal: page.total,
          auditHasMore: page.hasMore,
        });
      })
      .catch((caught) => {
        if (!cancelled) {
          patchState({
            auditError: describeError(caught, "Falha ao carregar a auditoria da ação."),
          });
        }
      })
      .finally(() => {
        if (!cancelled) patchState({ auditLoading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedActionId, role, state.auditOffset, state.auditRetry, patchState]);

  const actionNotes = useMemo(
    () => state.notes.filter((note) => note.actionPlanId === selectedActionId),
    [selectedActionId, state.notes],
  );

  const pendingItems = useMemo(
    () =>
      buildPendingDecisions({
        notes: actionNotes,
        deadlineRequests: state.deadlineRequests,
      }),
    [actionNotes, state.deadlineRequests],
  );

  const auditFeedItems = useMemo<AuditFeedItem[]>(
    () =>
      state.auditEntries.map((entry) => ({
        id: entry.id,
        entry,
      })),
    [state.auditEntries],
  );

  const operationalLoading =
    (state.notesLoading && state.notes.length === 0)
    || (state.deadlineLoading && state.deadlineRequests.length === 0)
    || (state.progressLoading && state.progressUpdates.length === 0);
  const operationalError = state.notesError ?? state.deadlineError ?? state.progressError;

  const retryOperational = useCallback(() => {
    patchState((current) => ({
      notesRetry: current.notesRetry + 1,
      deadlineRetry: current.deadlineRetry + 1,
      progressRetry: current.progressRetry + 1,
    }));
  }, [patchState]);

  return {
    openRequestActionIds: state.openRequestActionIds,
    pendingItems,
    progressUpdates: state.progressUpdates,
    operationalLoading,
    operationalError,
    retryOperational,
    auditFeedItems,
    auditLoading: state.auditLoading,
    auditError: state.auditError,
    auditTotal: state.auditTotal,
    auditOffset: state.auditOffset,
    auditHasMore: state.auditHasMore,
    auditPageSize: AUDIT_PAGE_SIZE,
    retryAudit: () => patchState((current) => ({ auditRetry: current.auditRetry + 1 })),
    previousAuditPage: () =>
      patchState((current) => ({
        auditOffset: Math.max(0, current.auditOffset - AUDIT_PAGE_SIZE),
      })),
    nextAuditPage: () =>
      patchState((current) => ({
        auditOffset: current.auditOffset + AUDIT_PAGE_SIZE,
      })),
    replaceNote: (updated: SupervisionNoteEntry) => {
      patchState((current) => ({
        notes: current.notes.map((note) => (note.id === updated.id ? updated : note)),
      }));
    },
    prependNote: (created: SupervisionNoteEntry) => {
      patchState((current) => {
        const openRequestActionIds = new Set(current.openRequestActionIds);
        if (
          created.actionPlanId
          && ["adjustment_request", "pending"].includes(created.noteType)
        ) {
          openRequestActionIds.add(created.actionPlanId);
        }
        return {
          notes: [created, ...current.notes.filter((note) => note.id !== created.id)],
          openRequestActionIds,
        };
      });
    },
    replaceDeadline: (updated: ActionPlanDeadlineChangeRequest) => {
      patchState((current) => ({
        deadlineRequests: current.deadlineRequests.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
    },
    refreshOpenRequests: async () => {
      if (role !== "admin" || !recommendationId) return;
      const openRequestActionIds = await loadOpenRequestActionIds(recommendationId);
      patchState({ openRequestActionIds });
    },
  };
}
