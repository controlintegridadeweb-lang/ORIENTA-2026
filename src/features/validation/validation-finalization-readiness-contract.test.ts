import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const allMigrations = readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort()
  .map((name) => readFileSync(resolve(migrationsDir, name), "utf8"))
  .join("\n");

const baselineMigration = readFileSync(
  resolve(migrationsDir, "0027_validacao_insuficiente_fila.sql"),
  "utf8",
);

describe("contrato de prontidão para conclusão da validação", () => {
  it("usa uma fonte única no painel, na fila e na finalização transacional", () => {
    expect(baselineMigration).toContain(
      "create or replace function public.get_validation_finalization_readiness",
    );
    expect(baselineMigration).toContain(
      "create or replace function public.list_validation_finalization_readiness",
    );
    expect(baselineMigration).toContain(
      "'finalization', public.get_validation_finalization_readiness(p_cycle_id)",
    );

    const finalizeFunction = baselineMigration.slice(
      baselineMigration.indexOf("create or replace function public.finalize_validation_cycle"),
    );
    expect(finalizeFunction).toContain(
      "v_readiness := public.get_validation_finalization_readiness(p_cycle_id)",
    );
  });

  it("considera todos os bloqueadores que impedem materializar o FAMI", () => {
    for (const blocker of [
      "pendingEvidence",
      "pendingNotApplicable",
      "undecidedAbsentProof",
      "incompleteResponses",
      "missingRecommendations",
      "missingWorkingProcessing",
    ]) {
      expect(baselineMigration).toContain(`'${blocker}'`);
    }
  });

  it("após 0037, proof_requested só bloqueia sem evidência ativa", () => {
    const latestReadiness = allMigrations.slice(
      allMigrations.lastIndexOf(
        "create or replace function public.get_validation_finalization_readiness(",
      ),
    );
    expect(latestReadiness).toContain(
      "resp.admin_proof_status is distinct from 'validated_without_proof'",
    );
    expect(latestReadiness).toContain(
      "resp.admin_proof_status is distinct from 'considered_insufficient'",
    );
  });
});
