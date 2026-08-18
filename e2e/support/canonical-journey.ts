import { expect, type Page } from "@playwright/test";

export type WorkbenchPayload = {
  rows: Array<{ questionId: string; prompt: string; storagePath: string | null }>;
};

export type NotificationsPayload = {
  notifications: Array<{
    kind: string;
    title: string;
    action_path: string | null;
  }>;
};

export async function fetchWorkbenchPayload(page: Page, cycleId: string) {
  return page.evaluate(async (id) => {
    const response = await fetch(`/api/workbench/data?cycleId=${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    return { status: response.status, body: (await response.json()) as WorkbenchPayload };
  }, cycleId);
}

export async function fetchNotifications(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/notifications", {
      credentials: "include",
      cache: "no-store",
    });
    return { status: response.status, body: (await response.json()) as NotificationsPayload };
  });
}

/** Preenche o campo controlado de nova pergunta de forma atômica. */
export async function typeQuestionPrompt(page: Page, prompt: string) {
  const field = page.getByLabel("Nova pergunta");
  await field.click();
  await field.fill(prompt);
  await expect(field).toHaveValue(prompt);
}

/** Submete a pergunta apenas quando o estado controlado já habilitou a ação. */
export async function addQuestion(page: Page, prompt: string) {
  const addButton = page.getByRole("button", { name: "Adicionar pergunta" });
  await expect(addButton).toBeEnabled();
  await addButton.click();
  const questionsList = page.getByRole("list", { name: "Lista de perguntas" });
  await expect(questionsList.getByText(prompt, { exact: true })).toBeVisible();
}
