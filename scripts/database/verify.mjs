#!/usr/bin/env node
/**
 * Verificações de INTEGRAÇÃO contra um PostgreSQL real.
 *
 * Por que existe: os testes unitários (Vitest) mockam o Supabase e NÃO detectam
 * consultas a colunas inexistentes nem violação de constraints reais. Este
 * runner aplica TODAS as migrations do zero num banco descartável, roda um seed
 * mínimo válido e executa cada `supabase/verify/*.sql` (exceto os `_*.sql`, que
 * são helpers). Qualquer `raise exception` num verify quebra o processo.
 *
 * Uso:
 *   DATABASE_URL=postgres://user@host:port/db npm run db:verify
 *
 * Em Supabase local, aplique antes `supabase db reset --local` e execute com
 * DB_VERIFY_ONLY=1 para validar o schema que o CLI acabou de criar.
 *
 * Pré-requisito: binário `psql`.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const migrationsDir = join(root, "supabase", "migrations");
const verifyDir = join(root, "supabase", "verify");

const DB = process.env.DATABASE_URL;
const verifyOnly = process.env.DB_VERIFY_ONLY === "1";
if (!DB) {
  console.error(
    "DATABASE_URL não definido. Informe um Postgres de teste descartável, ex.:\n" +
      "  DATABASE_URL=postgres://orienta@localhost:5433/orienta_real npm run db:verify",
  );
  process.exit(2);
}

function psql(args, { input } = {}) {
  const res = spawnSync("psql", [DB, "-v", "ON_ERROR_STOP=1", ...args], {
    input,
    encoding: "utf8",
  });
  return res;
}

function run(label, args, input) {
  const res = psql(args, { input });
  if (res.status !== 0) {
    console.error(`✗ ${label}`);
    const stderr = (res.stderr || "").trim();
    const stdout = (res.stdout || "").trim();
    if (stderr) {
      console.error("--- stderr ---");
      console.error(stderr);
    }
    if (stdout) {
      console.error("--- stdout ---");
      console.error(stdout);
    }
    process.exit(1);
  }
  return res.stdout || "";
}

// 1) Em PostgreSQL externo descartável, criamos stubs mínimos de Auth/Storage
// e aplicamos todas as migrations. Em Supabase local já iniciado por CI, use
// DB_VERIFY_ONLY=1: o CLI aplica o schema real e este runner executa apenas os
// seeds/verificações, sem substituir objetos internos do Supabase.
if (!verifyOnly) {
  const preamble = `
do $$ begin if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if; end $$;
do $$ begin if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$;
do $$ begin if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; end $$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb, created_at timestamptz default now());
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[], created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select case
    when strpos(name, '/') = 0 then array[]::text[]
    else string_to_array(regexp_replace(name, '/[^/]*$', ''), '/')
  end
$$;
`;
  run("preâmbulo (stubs auth/storage)", [], preamble);

  const migrations = readdirSync(migrationsDir)
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort();
  for (const m of migrations) {
    run(`migration ${m}`, ["-f", join(migrationsDir, m)]);
  }
  console.log(`✓ ${migrations.length} migrations aplicadas`);
} else {
  console.log("✓ DB_VERIFY_ONLY=1: usando schema real já aplicado pelo Supabase local");
}

// 2) Seed mínimo (helpers _*.sql aplicados primeiro).
const seeds = readdirSync(verifyDir).filter((f) => f.startsWith("_") && f.endsWith(".sql")).sort();
for (const s of seeds) {
  run(`seed ${s}`, ["-f", join(verifyDir, s)]);
}

// 3) Verificações.
const checks = readdirSync(verifyDir)
  .filter((f) => f.endsWith(".sql") && !f.startsWith("_"))
  .sort();
let ok = 0;
for (const c of checks) {
  const out = run(`verify ${c}`, ["-f", join(verifyDir, c)]);
  const okLine = out.split("\n").find((l) => /:\s*OK/.test(l));
  console.log(`✓ ${c}${okLine ? "  — " + okLine.replace(/^.*NOTICE:\s*/, "").trim() : ""}`);
  ok++;
}
console.log(`\nIntegração: ${ok} verificações passaram.`);
