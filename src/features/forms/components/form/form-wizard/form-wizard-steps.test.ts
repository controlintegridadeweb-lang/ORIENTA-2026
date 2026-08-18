import { describe, expect, it } from "vitest";
import {
  derivePersistedWizardStep,
  parseWizardStep,
  resolveWizardStepAccess,
  wizardStepHref,
} from "./form-wizard-steps";

describe("form wizard steps", () => {
  it("normaliza etapas inválidas", () => {
    expect(parseWizardStep(null)).toBe(1);
    expect(parseWizardStep("3")).toBe(3);
    expect(parseWizardStep("99")).toBe(1);
  });

  it("não permite saltar além do progresso alcançado", () => {
    expect(resolveWizardStepAccess(5, 3)).toEqual({ currentStep: 3, maxReachableStep: 3 });
  });

  it("gera o deep link canônico", () => {
    expect(wizardStepHref("form-1", 4)).toBe("/admin/formularios/form-1/configuracao?etapa=4");
  });

  it("reconstrói o progresso usando dados persistidos", () => {
    expect(derivePersistedWizardStep({ questionCount: 0, bindingsComplete: false, assignmentCount: 0 })).toBe(2);
    expect(derivePersistedWizardStep({ questionCount: 2, bindingsComplete: false, assignmentCount: 1 })).toBe(2);
    expect(derivePersistedWizardStep({ questionCount: 2, bindingsComplete: true, assignmentCount: 0 })).toBe(3);
    expect(derivePersistedWizardStep({ questionCount: 2, bindingsComplete: true, assignmentCount: 1 })).toBe(4);
  });
});
