import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function migrationSql(): string {
  return fs.readFileSync(
    path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "0036_notify_cycle_lifecycle_proof_requests.sql",
    ),
    "utf8",
  );
}

function compact(sql: string): string {
  return sql.replace(/\s+/g, " ").toLowerCase();
}

describe("migration 0036 notify_cycle_lifecycle — comprovação ausente", () => {
  it("conta proof_requested junto com adjustment_requested na devolutiva", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain("create or replace function public.notify_cycle_lifecycle()");
    expect(sql).toContain("v_proof_request_count");
    expect(sql).toContain("v_total_count");
    expect(sql).toContain("admin_proof_status = 'proof_requested'");
    expect(sql).toContain("'proof_request_count', v_proof_request_count");
    expect(sql).toContain("'total_count', v_total_count");
  });

  it("corrige notificações históricas com contagem zerada", () => {
    const sql = compact(migrationSql());
    expect(sql).toContain("kind = 'evidence_adjustment'");
    expect(sql).toContain("update public.user_notifications");
    expect(sql).toContain("update public.notification_outbox");
    expect(sql).toContain("0 evidências");
    expect(sql).toContain("action_path");
  });
});
