import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function migrationSql(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "supabase", "migrations", "0035_form_periods.sql"),
    "utf8",
  );
}

function compact(sql: string): string {
  return sql.replace(/\s+/g, " ").toLowerCase();
}

describe("migration 0035 form_periods — contrato", () => {
  it("cria form_periods com identidade por period_code", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain("create table if not exists public.form_periods");
    expect(sql).toContain("constraint form_periods_code_unique unique (form_version_id, period_code)");
    expect(sql).toContain("response_deadline_at timestamptz");
    expect(sql).toContain("status text not null default 'open'");
  });

  it("torna period_id a identidade do ciclo e remove a unique antiga", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain("add column if not exists period_id uuid");
    expect(sql).toContain("alter column period_id set not null");
    expect(sql).toContain("constraint cycles_period_org_unique unique (period_id, organization_id)");
    expect(sql).toContain("drop constraint if exists cycles_identity_unique");
    expect(sql).toContain("cycles_period_id_fkey");
  });

  it("unifica os rótulos candidatos no período canônico 2026.1", () => {
    const sql = migrationSql();
    expect(sql).toContain("4e4dbfd2-c42a-45f2-82b2-32d6d6464c1b");
    expect(sql).toContain("'2026.1'");
    expect(sql).toContain("'Diagnóstico de Integridade 2026'");
    expect(sql).toContain("form_periods_unification_abort");
  });

  it("atualiza create_cycle para period_id via ensure_form_period", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain("create or replace function public.ensure_form_period");
    expect(sql).toContain("create or replace function public.create_cycle");
    expect(sql).toContain("v_period := public.ensure_form_period");
    expect(sql).toContain("cycles_form_period_unique");
    expect(sql).toContain("period_id, period_label");
  });
});
