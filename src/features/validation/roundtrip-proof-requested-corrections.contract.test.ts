import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function migrationSql(): string {
  return fs.readFileSync(
    path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "0037_roundtrip_proof_requested.sql",
    ),
    "utf8",
  );
}

function compact(sql: string): string {
  return sql.replace(/\s+/g, " ").toLowerCase();
}

describe("migration 0037 roundtrip proof_requested", () => {
  it("remove o clear antecipado de proof_requested no upload", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain("create or replace function public.apply_workbench_response(");
    expect(sql).not.toContain(
      "and jsonb_array_length(v_items) > 0 then update public.responses set admin_proof_status = null",
    );
    expect(sql).toContain("proof_requested só é limpo no reenvio do ciclo");
  });

  it("permite remover evidência pendente em comprovação ausente", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain("create or replace function public.remove_workbench_evidence_item(");
    expect(sql).toContain("or v_response.admin_proof_status = 'proof_requested'");
  });

  it("só bloqueia consolidação por comprovação ausente sem evidência ativa", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain(
      "and resp.admin_proof_status is distinct from 'validated_without_proof'",
    );
    expect(sql).toContain(
      "and resp.admin_proof_status is distinct from 'considered_insufficient'",
    );
    expect(sql).toContain("and not exists ( select 1 from public.evidences e");
  });

  it("marca rascunho absent_proof ao limpar admin_proof_status", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain(
      "create or replace function public.trg_apply_validation_analysis_draft_on_response()",
    );
    expect(sql).toContain("or old.admin_proof_status is not null");
  });
});
