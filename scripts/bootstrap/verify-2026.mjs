#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const dataDir = resolve(root, "data/bootstrap-2026/private");
const manifestPath = resolve(dataDir, "manifest.json");

if (!existsSync(manifestPath)) throw new Error("data/bootstrap-2026/private/manifest.json ausente");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const issues = [];
for (const [file, expected] of Object.entries(manifest.files)) {
  const path = resolve(dataDir, file);
  if (!existsSync(path)) {
    issues.push(`${file}: ausente`);
    continue;
  }
  const bytes = readFileSync(path);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const rows = bytes.toString("utf8").split("\n").filter(Boolean).length;
  if (digest !== expected.sha256) issues.push(`${file}: checksum divergente`);
  if (rows !== expected.rows) issues.push(`${file}: ${rows} linhas; esperado ${expected.rows}`);
}
if (issues.length) {
  console.error(issues.map((issue) => `✗ ${issue}`).join("\n"));
  process.exit(1);
}
console.log(`✓ ${manifest.dataset}`);
console.log(`✓ ${manifest.summary.organizations} órgãos / ${manifest.summary.authUsers} usuários`);
console.log(`✓ ${manifest.summary.questions} perguntas / ${manifest.summary.responses} respostas / ${manifest.summary.evidences} evidências`);
console.log(`✓ ${manifest.summary.cyclesWithResponses} ciclos históricos com respostas`);
