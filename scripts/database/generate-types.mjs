#!/usr/bin/env node
/**
 * Gera e valida os tipos do schema `public` com o Supabase CLI oficial.
 *
 * Uso:
 *   DATABASE_URL=postgresql://... npm run gen:types
 *   DATABASE_URL=postgresql://... npm run check:generated-types
 *
 * Quando a URL aponta para o Postgres do `supabase start` (porta 54322), a
 * geração usa `--local` primeiro — reutiliza a rede Docker do stack e evita
 * um pull isolado de postgres-meta sempre que possível.
 *
 * Alternativa sem porta Postgres (Management API):
 *   SUPABASE_ACCESS_TOKEN=... + NEXT_PUBLIC_SUPABASE_URL do projeto
 *
 * `gen:types` substitui o arquivo versionado pela saída oficial do CLI.
 * `check:generated-types` não altera o repositório: compara estruturalmente os
 * contratos `Database` e `Json`, evitando falsos diffs de formatação.
 */
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, resolveDbUrl, supabaseProjectRef } from "../shared/load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const target = resolve(root, "src/infrastructure/supabase/database.types.ts");
const checkOnly = process.argv.includes("--check");
const supabaseCli = resolve(root, "node_modules/supabase/dist/supabase.js");

loadEnv();
const databaseUrl = resolveDbUrl();
const projectRef = supabaseProjectRef();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const canUseProjectApi = Boolean(projectRef && accessToken);

if (!databaseUrl && !canUseProjectApi) {
  console.error(
    "Fonte do schema não definida. Informe SUPABASE_DB_URL/DATABASE_URL/POSTGRES_URL, ou SUPABASE_ACCESS_TOKEN + NEXT_PUBLIC_SUPABASE_URL do projeto.",
  );
  process.exit(2);
}

const result = generateTypesFromSchema({
  databaseUrl,
  projectRef,
  accessToken,
  canUseProjectApi,
});

if (result.status !== 0) {
  const stderr = result.stderr?.trim();
  console.error("Falha ao gerar tipos com o Supabase CLI.");
  if (stderr) console.error(stderr);
  process.exit(result.status ?? 1);
}

const generated = normalize(extractGeneratedTypes(result.stdout ?? ""));
if (
  !generated.includes("export type Database") &&
  !generated.includes("export interface Database")
) {
  console.error("A saída do Supabase CLI não contém o contrato Database esperado.");
  process.exit(1);
}

if (checkOnly) {
  verifyStructuralCompatibility(generated);
  console.log("Tipos versionados estão estruturalmente sincronizados com o schema real.");
  process.exit(0);
}

writeFileSync(target, generated, "utf8");
console.log(`Tipos gerados pelo Supabase CLI: ${target}`);

function verifyStructuralCompatibility(generatedSource) {
  // Garante falha clara quando o arquivo versionado não existe ou está inválido.
  readFileSync(target, "utf8");

  const workdir = mkdtempSync(resolve(tmpdir(), "orienta-generated-types-"));
  const generatedPath = resolve(workdir, "database.generated.ts");
  const comparisonPath = resolve(workdir, "compare.ts");

  try {
    writeFileSync(generatedPath, generatedSource, "utf8");

    const currentImport = toImportSpecifier(
      relative(workdir, target).replace(/\.ts$/, ""),
    );
    const generatedImport = "./database.generated";

    writeFileSync(
      comparisonPath,
      [
        `import type { Database as CurrentDatabase, Json as CurrentJson } from ${JSON.stringify(currentImport)};`,
        `import type { Database as GeneratedDatabase, Json as GeneratedJson } from ${JSON.stringify(generatedImport)};`,
        "",
        "type Assert<T extends true> = T;",
        "type Extends<A, B> = [A] extends [B] ? true : false;",
        // PostgrestVersion embutido pelo CLI varia entre projeto cloud e stack local;
        // o contrato canônico do schema é o restante de Database.
        "type CurrentSchema = Omit<CurrentDatabase, \"__InternalSupabase\">;",
        "type GeneratedSchema = Omit<GeneratedDatabase, \"__InternalSupabase\">;",
        "",
        "type CurrentDatabaseCoversGenerated = Assert<Extends<CurrentSchema, GeneratedSchema>>;",
        "type GeneratedDatabaseCoversCurrent = Assert<Extends<GeneratedSchema, CurrentSchema>>;",
        "type CurrentJsonCoversGenerated = Assert<Extends<CurrentJson, GeneratedJson>>;",
        "type GeneratedJsonCoversCurrent = Assert<Extends<GeneratedJson, CurrentJson>>;",
        "",
        "export type GeneratedTypesCompatibility =",
        "  | CurrentDatabaseCoversGenerated",
        "  | GeneratedDatabaseCoversCurrent",
        "  | CurrentJsonCoversGenerated",
        "  | GeneratedJsonCoversCurrent;",
        "",
      ].join("\n"),
      "utf8",
    );

    const tsc = resolve(
      root,
      "node_modules",
      "typescript",
      "bin",
      "tsc",
    );
    const comparison = spawnSync(
      process.execPath,
      [
        tsc,
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--target",
        "ES2022",
        "--module",
        "ESNext",
        "--moduleResolution",
        "Bundler",
        comparisonPath,
      ],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    if (comparison.status !== 0) {
      const output = [comparison.stdout, comparison.stderr]
        .filter(Boolean)
        .join("\n")
        .trim();
      console.error(
        "database.types.ts está incompatível com o schema real. Execute `npm run gen:types` e versione o resultado oficial.",
      );
      if (output) console.error(output);
      process.exit(comparison.status ?? 1);
    }
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
}

function isLocalSupabaseDbUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url.replace(/^postgresql:/i, "http:"));
    const localHost =
      parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    return localHost && parsed.port === "54322";
  } catch {
    return false;
  }
}

function generateTypesFromSchema({
  databaseUrl,
  projectRef,
  accessToken,
  canUseProjectApi,
}) {
  const preferLocal =
    process.env.SUPABASE_GEN_TYPES_MODE === "local" ||
    isLocalSupabaseDbUrl(databaseUrl);

  const attempts = [];
  if (preferLocal) {
    attempts.push({
      label: "local",
      args: ["gen", "types", "typescript", "--local", "--schema", "public"],
    });
  }
  if (databaseUrl) {
    attempts.push({
      label: "db-url",
      args: [
        "gen",
        "types",
        "typescript",
        "--db-url",
        databaseUrl,
        "--schema",
        "public",
      ],
    });
  }
  if (canUseProjectApi) {
    attempts.push({
      label: "project-id",
      args: [
        "gen",
        "types",
        "typescript",
        "--project-id",
        projectRef,
        "--schema",
        "public",
      ],
    });
  }

  let last = { status: 1, stdout: "", stderr: "" };
  for (const attempt of attempts) {
    last = spawnSync(process.execPath, [supabaseCli, ...attempt.args], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      env: {
        ...process.env,
        ...(accessToken ? { SUPABASE_ACCESS_TOKEN: accessToken } : {}),
      },
    });
    if (last.status === 0) return last;
    const detail = (last.stderr || last.stdout || "").trim();
    if (detail && attempts.indexOf(attempt) < attempts.length - 1) {
      console.warn(
        `Fonte ${attempt.label} indisponível; tentando alternativa.`,
      );
    } else if (detail) {
      console.error(detail.split("\n").slice(0, 12).join("\n"));
    }
  }
  return last;
}

function extractGeneratedTypes(stdout) {
  const marker = "export type Json";
  const idx = stdout.indexOf(marker);
  return idx >= 0 ? stdout.slice(idx) : stdout;
}

function toImportSpecifier(pathValue) {
  const normalized = pathValue.split(sep).join("/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

function normalize(value) {
  return value.replace(/\r\n/g, "\n").trimEnd() + "\n";
}
