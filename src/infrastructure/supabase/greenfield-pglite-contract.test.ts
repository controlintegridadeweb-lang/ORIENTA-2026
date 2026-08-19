import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reportPath = join(process.cwd(), "var/greenfield-pglite-report.json");
const runLive =
  process.env.RUN_GREENFIELD === "1" ||
  Boolean(process.env.SUPABASE_ACCESS_TOKEN);

function timestampedMigrationCount() {
  return readdirSync(join(process.cwd(), "supabase", "migrations")).filter((name) =>
    /^\d{14}_.+\.sql$/.test(name),
  ).length;
}

describe("baseline greenfield em PGlite", () => {
  it.skipIf(!runLive)(
    "aplica a baseline timestampada em Postgres descartável sem erros",
    () => {
      execFileSync(process.execPath, ["scripts/database/greenfield-pglite.mjs"], {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 180_000,
        env: process.env,
      });
      expect(existsSync(reportPath)).toBe(true);
      const report = JSON.parse(readFileSync(reportPath, "utf8"));
      expect(report.appliedCount).toBe(timestampedMigrationCount());
      expect(report.failures).toEqual([]);
      expect([
        "PASS_BASELINE_APPLIED",
        "PASS_GREENFIELD_DOMAIN_EQUALS_INCREMENTAL",
        "PASS_GREENFIELD_EQUALS_INCREMENTAL",
        "GREENFIELD_APPLIED_WITH_DIFFS",
      ]).toContain(report.verdict);
    },
    180_000,
  );

  it("documenta o script npm run db:greenfield", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    );
    expect(pkg.scripts["db:greenfield"]).toContain("greenfield-pglite.mjs");
    expect(
      existsSync(join(process.cwd(), "scripts/database/greenfield-pglite.mjs")),
    ).toBe(true);
  });
});
