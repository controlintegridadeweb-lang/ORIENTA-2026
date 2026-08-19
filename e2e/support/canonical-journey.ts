import { expect, type Locator, type Page } from "@playwright/test";

type WorkbenchPayload = {
  rows: Array<{ questionId: string; prompt: string; storagePath: string | null }>;
};

type NotificationsPayload = {
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

function questionBinding(page: Page, prompt: string): Locator {
  return page.getByTestId("question-binding").filter({ hasText: prompt });
}

/**
 * Abre o painel da pergunta e espera a configuração da biblioteca carregar.
 * Se a API falhar, usa o próprio “Tentar novamente” da tela — não há valor
 * padrão silencioso, então o E2E só segue com o contrato persistido.
 */
async function openQuestionBinding(page: Page, prompt: string): Promise<Locator> {
  const binding = questionBinding(page, prompt);
  const header = binding.getByRole("button", { name: prompt });
  if ((await header.getAttribute("aria-expanded")) !== "true") {
    await header.click();
  }
  await expect(header).toHaveAttribute("aria-expanded", "true");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await expect(binding.getByText("Carregando configuração…")).toBeHidden();
    const retry = binding.getByRole("button", { name: "Tentar novamente" });
    if (await retry.isVisible()) {
      const pending = page.waitForResponse(
        (response) =>
          response.url().includes("/binding") && response.request().method() === "GET",
      );
      await retry.click();
      await pending;
      continue;
    }
    const alert = binding.getByRole("alert");
    if (await alert.isVisible()) {
      throw new Error(
        `Configuração da pergunta não carregou: ${(await alert.innerText()).trim()}`,
      );
    }
    await expect(binding.getByRole("textbox", { name: /Recomendação-base/ })).toBeVisible();
    return binding;
  }

  throw new Error(`Configuração da pergunta não carregou após novas tentativas: ${prompt}`);
}

/** Grava a recomendação-base e confirma o sinal persistido na própria tela. */
export async function saveQuestionRecommendation(page: Page, prompt: string) {
  const binding = await openQuestionBinding(page, prompt);
  const recommendationField = binding.getByRole("textbox", { name: /Recomendação-base/ });
  const recommendationText = `E2E: executar providência para ${prompt}`;
  await recommendationField.fill(recommendationText);
  await expect(binding.getByText("Recomendação-base configurada.")).toBeVisible();
  await binding.getByRole("button", { name: "Salvar configuração" }).click();
  await expect(binding.getByText("Recomendação-base configurada.")).toBeVisible();
}

/**
 * Cadastro real de ação: comprovante HTTPS, 100% de andamento (status done)
 * e evidência carregada para a revisão corrente — pré-requisitos do aceite
 * administrativo e do encerramento do ciclo.
 */
export async function createCompletedActionWithProof(
  page: Page,
  recommendationId: string,
  index: number,
) {
  await page.goto(`/respondente/plano-acao/${recommendationId}/acoes`);
  await expect(page.getByRole("button", { name: "Nova ação" })).toBeVisible();
  await page.getByRole("button", { name: "Nova ação" }).click();

  const actionText = `E2E: executar plano de adequação ${index + 1}`;
  await page.getByLabel("Ação ou compromisso").fill(actionText);
  await page.getByLabel("Área responsável").fill("Unidade de Integridade");
  const responsibleSelect = page.getByLabel("Respondente responsável");
  await expect(responsibleSelect).toBeEnabled();
  await responsibleSelect.selectOption({ index: 1 });

  await page.getByRole("button", { name: /^\+ Adicionar comprovante$/ }).click();
  await page.getByRole("button", { name: "Link HTTPS" }).click();
  await page.getByLabel("Título da comprovação").fill("Comprovante E2E de execução");
  await page.getByLabel("URL").fill("https://example.org/comprovante-e2e");
  await page.getByRole("button", { name: /^Adicionar comprovante$/ }).click();

  await page.getByRole("button", { name: "Cadastrar ação" }).click();
  await expect(page.getByText(actionText)).toBeVisible();

  await page.getByRole("button", { name: `Opções da ação ${actionText}` }).click();
  await page.getByRole("menuitem", { name: "Andamento" }).click();
  await page.getByLabel("Progresso da ação").fill("100");
  await page
    .getByLabel("O que foi realizado nesta atualização?")
    .fill("Execução concluída no fluxo canônico E2E.");
  await page.getByRole("button", { name: "Salvar atualização" }).click();
  await expect(page.getByRole("cell", { name: "Concluída" })).toBeVisible();
}

/** Aceite administrativo da ação já concluída e comprovada. */
export async function publishActionApproval(page: Page, recommendationId: string) {
  await page.goto(`/admin/plano-acao/${recommendationId}/monitoramento`);
  await expect(page.getByRole("button", { name: "Registrar acompanhamento" })).toBeVisible();
  await page.getByRole("button", { name: "Registrar acompanhamento" }).click();
  await page.getByLabel("Tipo").selectOption("approval");
  await page.getByLabel("Registro").fill("Execução concluída e aceita no fluxo E2E.");
  await page.getByRole("button", { name: "Publicar acompanhamento" }).click();
  await expect(page.getByText("Aceite vigente").first()).toBeVisible();
}
