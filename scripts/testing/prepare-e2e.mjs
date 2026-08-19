#!/usr/bin/env node
/**
 * Prepara dados mínimos e determinísticos para a suíte E2E local.
 *
 * Não é usado em produção. Requer uma stack Supabase local recém-resetada e
 * variáveis NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "../shared/create-service-role-supabase-client.mjs";
import { loadEnv, resolveDbUrl } from "../shared/load-env.mjs";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin.e2e@orienta.local";
const respondentEmail = process.env.E2E_RESPONDENT_EMAIL ?? "respondente.e2e@orienta.local";
const outsiderEmail = process.env.E2E_OUTSIDER_EMAIL ?? "respondente.externo.e2e@orienta.local";
const password = process.env.E2E_PASSWORD ?? "OrientaE2E!2026";
const organizationName = process.env.E2E_ORGANIZATION_NAME ?? "Órgão de Teste E2E";
const organizationAcronym = process.env.E2E_ORGANIZATION_ACRONYM ?? "E2E";
const outsiderOrganizationName =
  process.env.E2E_OUTSIDER_ORGANIZATION_NAME ?? "Órgão Externo E2E";
const outsiderOrganizationAcronym = process.env.E2E_OUTSIDER_ORGANIZATION_ACRONYM ?? "E2X";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const supabase = createServiceRoleSupabaseClient();

function formatThrown(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const parts = [error.message, error.details, error.hint, error.code].filter(Boolean);
    if (parts.length > 0) return parts.join(" | ");
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

function applyTestingFixtures() {
  const databaseUrl = resolveDbUrl();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL/DB_URL/SUPABASE_DB_URL é obrigatório para aplicar os fixtures de teste do E2E.",
    );
  }
  const fixturesDir = join(root, "supabase", "testing", "fixtures");
  const files = readdirSync(fixturesDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  if (files.length === 0) {
    throw new Error(`Nenhum fixture SQL encontrado em ${fixturesDir}.`);
  }
  for (const file of files) {
    const result = spawnSync(
      "psql",
      [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", join(fixturesDir, file)],
      { encoding: "utf8" },
    );
    if (result.status !== 0) {
      throw new Error(
        `Falha ao aplicar fixture ${file}: ${(result.stderr || result.stdout || "").trim()}`,
      );
    }
  }
}

function isMissingRpcError(error) {
  const text = `${error?.message ?? ""} ${error?.code ?? ""} ${error?.details ?? ""}`;
  return /PGRST202|Could not find the function/i.test(text);
}

async function rpcOrThrow(name, args) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const { data, error } = await supabase.rpc(name, args);
    if (!error) return data;
    if (!isMissingRpcError(error) || attempt === 8) throw error;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250 * attempt));
  }
  throw new Error(`RPC ${name} não ficou visível no PostgREST.`);
}

async function findUserByEmail(email) {
  const needle = email.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users ?? [];
    const found = users.find((user) => user.email?.toLowerCase() === needle);
    if (found) return found;
    if (users.length < 200) return null;
  }
  return null;
}

async function ensureUser({ email, fullName }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    return existing;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw error ?? new Error(`Falha ao criar ${email}.`);
  return data.user;
}

async function ensureRespondentProfile({ adminId, user, fullName, organizationId }) {
  const { data: existingProfile, error: profileReadError } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileReadError) throw profileReadError;

  if (!existingProfile) {
    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      role: "respondent",
      organization_id: organizationId,
      full_name: fullName,
    });
    if (error) throw error;
    return;
  }

  if (existingProfile.role !== "respondent") {
    throw new Error(`A conta E2E ${user.email ?? user.id} já existe com papel incompatível.`);
  }

  const { error } = await supabase.rpc("update_respondent_profile", {
    p_target_user_id: user.id,
    p_full_name: fullName,
    p_organization_id: organizationId,
    p_actor_user_id: adminId,
  });
  if (error) throw error;
}

async function ensureOrganization(name, acronym) {
  const { data, error } = await supabase
    .from("organizations")
    .upsert({ name, acronym }, { onConflict: "name" })
    .select("id,name")
    .single();
  if (error || !data) throw error ?? new Error(`Falha ao preparar organização ${name}.`);
  return data;
}

async function main() {
  applyTestingFixtures();

  const admin = await ensureUser({ email: adminEmail, fullName: "Administração E2E" });
  const respondent = await ensureUser({ email: respondentEmail, fullName: "Respondente E2E" });
  const outsider = await ensureUser({ email: outsiderEmail, fullName: "Respondente Externo E2E" });

  const { error: adminError } = await supabase.rpc("bootstrap_global_admin", {
    p_user_id: admin.id,
    p_full_name: "Administração E2E",
  });
  if (adminError) throw adminError;

  const organization = await ensureOrganization(organizationName, organizationAcronym);
  const outsiderOrganization = await ensureOrganization(
    outsiderOrganizationName,
    outsiderOrganizationAcronym,
  );

  await ensureRespondentProfile({
    adminId: admin.id,
    user: respondent,
    fullName: "Respondente E2E",
    organizationId: organization.id,
  });
  await ensureRespondentProfile({
    adminId: admin.id,
    user: outsider,
    fullName: "Respondente Externo E2E",
    organizationId: outsiderOrganization.id,
  });

  // O catálogo oficial fornece eixos e seções para o wizard de criação de formulário.
  // A RPC existe só no fixture de teste, aplicado acima — nunca na baseline de produção.
  await rpcOrThrow("bootstrap_diagnostico_integridade_2026", {
    p_actor_user_id: admin.id,
  });

  // Garante que o provider de e-mail aceita password grant com a anon key
  // (falha cedo se [auth.email].enable_signup desligar o provider no CLI).
  loadEnv();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!anonKey || !url) {
    throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY para validar o login E2E.");
  }
  const anonClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: loginProbeError } = await anonClient.auth.signInWithPassword({
    email: adminEmail,
    password,
  });
  if (loginProbeError) {
    throw new Error(
      `Login E2E (anon) rejeitado para ${adminEmail}: ${loginProbeError.message}` +
        (loginProbeError.code ? ` [${loginProbeError.code}]` : ""),
    );
  }
  await anonClient.auth.signOut();

  console.log(
    JSON.stringify(
      {
        adminEmail,
        respondentEmail,
        outsiderEmail,
        organizationName,
        outsiderOrganizationName,
        loginProbe: "ok",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(formatThrown(error));
  process.exit(1);
});
