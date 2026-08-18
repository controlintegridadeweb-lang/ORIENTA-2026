import { listSupervisionNotes } from "@/features/improvement-management/action-plans/client";

const OPEN_REQUEST_PAGE_SIZE = 100;

export async function loadOpenRequestActionIds(
  recommendationId: string,
): Promise<Set<string>> {
  const actionIds = new Set<string>();
  let offset = 0;
  while (true) {
    const page = await listSupervisionNotes(recommendationId, {
      lifecycleStatuses: ["open", "acknowledged"],
      limit: OPEN_REQUEST_PAGE_SIZE,
      offset,
    });
    for (const note of page.items) {
      if (note.actionPlanId) actionIds.add(note.actionPlanId);
    }
    if (!page.hasMore) return actionIds;
    offset += page.items.length;
    if (page.items.length === 0) return actionIds;
  }
}
