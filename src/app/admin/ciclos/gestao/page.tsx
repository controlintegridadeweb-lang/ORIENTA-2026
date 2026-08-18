import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/infrastructure/auth/current-user";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/server";
import { firstSearchParam } from "@/features/admin/search-params";
import { loadFormManagementDetails } from "@/features/cycles/form-management/read-service";
import { FormManagementShell } from "@/features/cycles/form-management/components/form-management-shell";
import {
  adminReturnLabel,
  adminReturnPathOrFallback,
} from "@/shared/navigation/admin-navigation-context";
import { layout } from "@/shared/layout/design-system";
import { formSurface } from "@/shared/layout/form-surface";

export default async function AdminFormManagementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const formId = firstSearchParam(params, "formId") ?? "";
  const periodLabel = firstSearchParam(params, "periodLabel") ?? "";
  const returnTo = adminReturnPathOrFallback(
    firstSearchParam(params, "returnTo"),
    formId ? `/admin/ciclos?formId=${encodeURIComponent(formId)}` : "/admin/ciclos",
  );

  if (!formId) {
    return (
      <div className={layout.pageStack}>
        <div className={formSurface.empty.container}>
          <p className={formSurface.empty.title}>Selecione um formulário</p>
          <p className={formSurface.empty.description}>
            Abra a gestão a partir da tela Situação dos órgãos, com um formulário selecionado.
          </p>
          <Link href="/admin/ciclos" className={formSurface.primaryButtonSm}>
            Ir para Situação dos órgãos
          </Link>
        </div>
      </div>
    );
  }

  const details = await loadFormManagementDetails(createSupabaseServiceRoleClient(), {
    formId,
    periodLabel: periodLabel || null,
  });
  if (!details) notFound();

  return (
    <div className={layout.pageStack}>
      <p className="text-sm text-slate-500">
        <Link href={returnTo} className="text-brand-700 hover:underline">
          {adminReturnLabel(returnTo)}
        </Link>
      </p>
      <FormManagementShell details={details} returnTo={returnTo} />
    </div>
  );
}
