import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IllustratedPageHero } from "@/shared/ui/components/illustrated-page-hero";
import { FORM_WORKSPACE_HERO_IMAGE } from "@/shared/config/page-assets/form-workspace-hero-image";

type Props = {
  backHref: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
};

export function AdminNewFormHero({
  backHref,
  backLabel = "Voltar para a lista",
  title = "Novo formulário",
  subtitle = "Crie um modelo em rascunho, configure as perguntas e publique quando estiver pronto.",
}: Props) {
  return (
    <IllustratedPageHero
      theme="admin"
      size="create"
      ariaLabel="Novo formulário"
      overline="Gestão de formulários"
      title={title}
      description={subtitle}
      image={FORM_WORKSPACE_HERO_IMAGE}
      priority
      beforeContent={
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand/40"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {backLabel}
        </Link>
      }
    />
  );
}
