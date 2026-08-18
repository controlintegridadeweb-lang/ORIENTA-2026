import { describe, expect, it } from "vitest";
import {
  adminReturnLabel,
  adminReturnPathOrFallback,
  currentAdminListPath,
  isSafeAdminListPath,
  withAdminReturnPath,
} from "./admin-navigation-context";

describe("admin navigation context", () => {
  it("aceita apenas listas administrativas internas conhecidas", () => {
    expect(isSafeAdminListPath("/admin/ciclos?state=validated")).toBe(true);
    expect(isSafeAdminListPath("/admin/evidencias?cycleId=cycle-1")).toBe(true);
    expect(isSafeAdminListPath("/admin/formularios?state=published&page=3")).toBe(true);
    expect(isSafeAdminListPath("/admin/recomendacoes?cycleId=cycle-1")).toBe(true);
    expect(isSafeAdminListPath("/admin/plano-acao?cycleId=cycle-1")).toBe(true);
  });

  it("rejeita destinos externos, detalhes e caminhos protocol-relative", () => {
    expect(isSafeAdminListPath("https://example.com/admin/ciclos")).toBe(false);
    expect(isSafeAdminListPath("//example.com/admin/ciclos")).toBe(false);
    expect(isSafeAdminListPath("/admin/ciclos/cycle-1")).toBe(false);
  });

  it("mantém retorno seguro e codifica o contexto ao abrir detalhes", () => {
    const returnTo = "/admin/recomendacoes?cycleId=cycle-1&axisId=axis-1";
    expect(adminReturnPathOrFallback(returnTo, "/admin/recomendacoes")).toBe(returnTo);
    expect(adminReturnPathOrFallback("//example.com/admin/recomendacoes", "/admin/recomendacoes")).toBe(
      "/admin/recomendacoes",
    );
    expect(withAdminReturnPath("/admin/recomendacoes/rec-1", returnTo)).toBe(
      "/admin/recomendacoes/rec-1?returnTo=%2Fadmin%2Frecomendacoes%3FcycleId%3Dcycle-1%26axisId%3Daxis-1",
    );
    expect(currentAdminListPath("/admin/ciclos", "formId=form-1")).toBe(
      "/admin/ciclos?formId=form-1",
    );
    expect(adminReturnLabel("/admin/evidencias?cycleId=cycle-1")).toBe(
      "Voltar às evidências",
    );
    expect(adminReturnLabel("/admin/formularios?state=published&page=3")).toBe(
      "Voltar aos formulários",
    );
  });
});
