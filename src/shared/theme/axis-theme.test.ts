import { describe, expect, it } from "vitest";
import { getAxisTheme, getAxisThemeStrict, axisThemeKeyForName } from "./axis-theme";

describe("getAxisTheme", () => {
  it("resolve Governança, Ambiental e Social pela abstração compartilhada", () => {
    expect(getAxisTheme("Governança").primary).toBe("#0097B2");
    expect(getAxisTheme("Ambiental").primary).toBe("#16A34A");
    expect(getAxisTheme("Social").primary).toBe("#DB2777");
  });

  it("não exige condicionais locais por nome exato com acento", () => {
    expect(axisThemeKeyForName("Governanca")).toBe("governance");
    expect(getAxisThemeStrict("desconhecido")).toBeUndefined();
    expect(getAxisTheme("desconhecido").primary).toBe("#0F766E");
  });

  it("expõe fundos e bordas sólidos (sem rgba nem gradiente)", () => {
    for (const name of ["Governança", "Ambiental", "Social"] as const) {
      const theme = getAxisTheme(name);
      expect(theme.softBackground).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.border).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.softBackground).not.toMatch(/rgba|gradient/i);
      expect(theme.border).not.toMatch(/rgba|gradient/i);
    }
  });
});
