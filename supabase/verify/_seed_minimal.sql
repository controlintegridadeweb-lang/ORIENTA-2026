-- ============================================================================
-- Seed mínimo VÁLIDO para verificações de integração contra o schema real.
--
-- Documenta as constraints reais que mocks não capturam (descobertas rodando o
-- código contra PostgreSQL 16):
--   • organizations.acronym       NOT NULL
--   • axes.name                   UNIQUE; IDs vêm do catálogo (não inventar UUID)
--   • questions.evidence_parameter CHECK shape: objeto com chave 'required'
--   • forms.created_by / responses.created_by  NOT NULL (→ auth.users)
--   • cycles.period_id          NOT NULL → form_periods (identidade do período)
--   • UNIQUE (period_id, organization_id)
--   • action_plans.start_date   NOT NULL e start_date <= due_date
--   • triggers de imutabilidade em axes/question_versions/snapshots
--     (contornados aqui com session_replication_role=replica, só para seed).
--
-- Uso: psql ... -f supabase/verify/_seed_minimal.sql  (idempotente)
-- Deixa um ciclo 'validated' pronto (ids fixos abaixo) para os testes.
-- ============================================================================
set session_replication_role = replica;  -- ignora triggers de imutabilidade só no seed

insert into auth.users(id, email) values ('00000000-0000-0000-0000-0000000000a1','seed@orienta.test') on conflict do nothing;
insert into public.organizations(id, name, acronym) values ('00000000-0000-0000-0000-0000000000b1','Org Seed','SEED') on conflict do nothing;
insert into public.profiles(user_id, role, organization_id) values ('00000000-0000-0000-0000-0000000000a1','admin', null) on conflict do nothing;
-- Os eixos canônicos vêm de `supabase/seeds/0000_axes.sql` no reset local
-- (UUIDs aleatórios). Não inventamos IDs: reutilizamos o catálogo por nome.
-- session_replication_role=replica mantém o seed isolado dos gatilhos de domínio.
insert into public.axes(name) values
  ('Governanca'),
  ('Ambiental'),
  ('Social')
on conflict (name) do nothing;
insert into public.sections(id, axis_id, code, name, ordem)
select
  '00000000-0000-0000-0000-0000000000d1',
  a.id,
  'SEED-GOV-01',
  'Seção Seed',
  1
from public.axes a
where a.name = 'Governanca'
on conflict (id) do update set axis_id = excluded.axis_id;
insert into public.questions(id, section_id, prompt, evidence_parameter, fami_enabled, applies_to_respondent)
  values ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000d1','Pergunta seed?','{"required": true}'::jsonb,true,true) on conflict do nothing;
insert into public.question_versions(
  id, question_id, version, prompt, evidence_parameter, fami_enabled,
  applies_to_respondent, section_id, section_name, section_order, axis_id,
  axis_name, library_binding_snapshot
)
select
  '00000000-0000-0000-0000-0000000000f1',
  '00000000-0000-0000-0000-0000000000e1',
  1,
  'Pergunta seed?',
  '{"required": true}'::jsonb,
  true,
  true,
  '00000000-0000-0000-0000-0000000000d1',
  'Seção Seed',
  1,
  a.id,
  'Governanca',
  '{"bindings":{"defaultRecommendation":{"title":"Recomendação seed","textoBaseFixo":"Apresentar evidência válida para o critério seed."}}}'::jsonb
from public.axes a
where a.name = 'Governanca'
on conflict (id) do update set
  library_binding_snapshot = excluded.library_binding_snapshot,
  axis_id = excluded.axis_id,
  axis_name = excluded.axis_name;
-- Versão propositalmente fora do formulário: usada para provar a integridade
-- que impede respostas apontando para perguntas de outro formulário.
insert into public.questions(id, section_id, prompt, evidence_parameter, fami_enabled, applies_to_respondent)
  values ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000d1','Pergunta fora do formulário?','{"required": false}'::jsonb,true,true) on conflict do nothing;
insert into public.question_versions(id, question_id, version, prompt, evidence_parameter, fami_enabled, applies_to_respondent, section_id, section_name, section_order, axis_id, axis_name)
select
  '00000000-0000-0000-0000-0000000000f2',
  '00000000-0000-0000-0000-0000000000e2',
  1,
  'Pergunta fora do formulário?',
  '{"required": false}'::jsonb,
  true,
  true,
  '00000000-0000-0000-0000-0000000000d1',
  'Seção Seed',
  1,
  a.id,
  'Governanca'
from public.axes a
where a.name = 'Governanca'
on conflict (id) do update set
  axis_id = excluded.axis_id,
  axis_name = excluded.axis_name;
insert into public.forms(id, name, created_by) values ('00000000-0000-0000-0000-000000000aa1','Form Seed','00000000-0000-0000-0000-0000000000a1') on conflict do nothing;
insert into public.form_versions(id, form_id, version, state) values ('00000000-0000-0000-0000-000000000bb1','00000000-0000-0000-0000-000000000aa1',1,'published') on conflict do nothing;
insert into public.form_questions(form_version_id, question_version_id, order_index)
  values ('00000000-0000-0000-0000-000000000bb1','00000000-0000-0000-0000-0000000000f1',1) on conflict do nothing;
insert into public.form_periods(id, form_version_id, period_code, label, status)
  values (
    'f0000000-0000-0000-0000-000000000cc1',
    '00000000-0000-0000-0000-000000000bb1',
    '2026',
    '2026',
    'open'
  ) on conflict (id) do nothing;
insert into public.cycles(id, form_version_id, organization_id, period_id, period_label, state)
  values (
    '00000000-0000-0000-0000-000000000cc1',
    '00000000-0000-0000-0000-000000000bb1',
    '00000000-0000-0000-0000-0000000000b1',
    'f0000000-0000-0000-0000-000000000cc1',
    '2026',
    'validated'
  ) on conflict (id) do update set
    period_id = excluded.period_id,
    period_label = excluded.period_label,
    state = excluded.state;
insert into public.cycle_processings(id, cycle_id, processing_version, status)
  values ('00000000-0000-0000-0000-000000000ee1','00000000-0000-0000-0000-000000000cc1',1,'working') on conflict do nothing;
insert into public.responses(id, cycle_id, question_version_id, answer, is_not_applicable, created_by)
  values ('00000000-0000-0000-0000-000000000dd1','00000000-0000-0000-0000-000000000cc1','00000000-0000-0000-0000-0000000000f1','yes',false,'00000000-0000-0000-0000-0000000000a1') on conflict do nothing;

reset session_replication_role;
