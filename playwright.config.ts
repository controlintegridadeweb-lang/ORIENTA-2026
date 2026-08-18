import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3002";
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  // Não há retry automático: uma falha E2E deve expor flakiness ou regressão.
  retries: 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // No CI usamos um build de producao (next build + next start): o servidor de
  // desenvolvimento compila cada rota sob demanda (varios segundos por rota, via
  // Fast Refresh), o que estoura o orcamento de 90s por teste ao navegar por todo
  // o fluxo. Em producao as rotas ja vem compiladas — rapido e deterministico.
  // Localmente mantemos o dev server (iteracao rapida e reaproveitamento).
  webServer: {
    command: isCI ? "npm run build && npm run start" : "npm run dev",
    url: baseURL,
    timeout: isCI ? 300_000 : 120_000,
    reuseExistingServer: !isCI,
    // Herda o ambiente do job. Só reforça chaves quando estão definidas —
    // string vazia sobrescreveria o .env.local carregado pelo Next.js.
    env: Object.fromEntries(
      Object.entries({
        ...process.env,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || baseURL,
      }).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0),
    ),
  },
});
