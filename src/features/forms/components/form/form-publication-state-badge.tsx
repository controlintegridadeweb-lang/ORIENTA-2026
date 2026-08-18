import type { FormPublicationState } from "@/features/forms/form-publication-state";
import { formPublicationStateLabel } from "@/features/forms/form-publication-labels";
import { formSurface } from "@/shared/layout/form-surface";

const BADGE_VARIANT: Record<
  FormPublicationState,
  keyof typeof formSurface.badge
> = {
  draft: "neutral",
  published: "success",
  superseded: "muted",
  archived: "neutral",
};

type Props = {
  state: FormPublicationState;
  size?: "sm" | "md";
};

/** Selo de publicação do formulário; não deve ser usado para estado do diagnóstico. */
export function FormPublicationStateBadge({ state, size = "md" }: Props) {
  const variant = BADGE_VARIANT[state] ?? "neutral";
  const label = formPublicationStateLabel(state);

  return (
    <span
      className={`${formSurface.badge.base} ${formSurface.badge[variant]} ${
        size === "md" ? "px-2.5 py-1 text-xs" : ""
      }`}
      aria-label={`Situação da publicação: ${label}`}
    >
      {label}
    </span>
  );
}
