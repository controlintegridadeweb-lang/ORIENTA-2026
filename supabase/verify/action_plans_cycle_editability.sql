-- ============================================================================
-- Verificação de integração: autorização, integridade e auditoria de planos.
-- Pré: _seed_minimal.sql. Saída: "ACTION PLANS CYCLE EDITABILITY: OK".
-- ============================================================================

grant usage on schema public to authenticated;
grant select on public.action_plans, public.recommendations, public.cycles to authenticated;

set session_replication_role = replica;

select public._verify_ensure_auth_user(
  '00000000-0000-0000-0000-0000000000a2',
  'respondent-action-plans@orienta.test'
);

insert into public.profiles(user_id, role, organization_id)
values (
  '00000000-0000-0000-0000-0000000000a2',
  'respondent',
  '00000000-0000-0000-0000-0000000000b1'
)
on conflict (user_id) do update
  set role = excluded.role, organization_id = excluded.organization_id;

insert into public.organizations(id, name, acronym)
values ('00000000-0000-0000-0000-0000000000b2', 'Outra organização', 'OUTRA')
on conflict (id) do nothing;

select public._verify_ensure_auth_user(
  '00000000-0000-0000-0000-0000000000a3',
  'respondent-other-org@orienta.test'
);

insert into public.profiles(user_id, role, organization_id)
values (
  '00000000-0000-0000-0000-0000000000a3',
  'respondent',
  '00000000-0000-0000-0000-0000000000b2'
)
on conflict (user_id) do update
  set role = excluded.role, organization_id = excluded.organization_id;

insert into public.form_periods(id, form_version_id, period_code, label, status)
values
  (
    'f0000000-0000-0000-0000-00000000c231',
    '00000000-0000-0000-0000-000000000bb1',
    'AP-validated',
    'AP-validated',
    'open'
  ),
  (
    'f0000000-0000-0000-0000-00000000c232',
    '00000000-0000-0000-0000-000000000bb1',
    'AP-in-validation',
    'AP-in-validation',
    'open'
  )
on conflict (id) do nothing;
insert into public.cycles(id, form_version_id, organization_id, period_id, period_label, state)
values
  (
    '00000000-0000-0000-0000-00000000c231',
    '00000000-0000-0000-0000-000000000bb1',
    '00000000-0000-0000-0000-0000000000b1',
    'f0000000-0000-0000-0000-00000000c231',
    'AP-validated',
    'validated'
  ),
  (
    '00000000-0000-0000-0000-00000000c232',
    '00000000-0000-0000-0000-000000000bb1',
    '00000000-0000-0000-0000-0000000000b1',
    'f0000000-0000-0000-0000-00000000c232',
    'AP-in-validation',
    'in_validation'
  )
on conflict (id) do update set
  period_id = excluded.period_id,
  state = excluded.state;

-- Recomendação oficial exige processamento completed + ciclo validated/completed.
insert into public.cycle_processings(id, cycle_id, processing_version, status, completed_at)
values
  ('00000000-0000-0000-0000-00000000a241', '00000000-0000-0000-0000-00000000c231', 1, 'completed', now()),
  ('00000000-0000-0000-0000-00000000a242', '00000000-0000-0000-0000-00000000c232', 1, 'working', null)
on conflict (id) do update
  set status = excluded.status,
      completed_at = excluded.completed_at;

insert into public.recommendations(id, cycle_id, cycle_processing_id, question_version_id, tipo, text)
values
  ('00000000-0000-0000-0000-00000000b241', '00000000-0000-0000-0000-00000000c231', '00000000-0000-0000-0000-00000000a241', '00000000-0000-0000-0000-0000000000f1', 'nao_implementacao', 'Ação permitida'),
  ('00000000-0000-0000-0000-00000000b242', '00000000-0000-0000-0000-00000000c232', '00000000-0000-0000-0000-00000000a242', '00000000-0000-0000-0000-0000000000f1', 'nao_implementacao', 'Ação bloqueada')
on conflict (id) do nothing;

reset session_replication_role;

-- A Data API é somente leitura para action_plans. Nem respondente nem admin
-- podem contornar a RPC e suas validações.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
do $$
begin
  begin
    insert into public.action_plans(
      recommendation_id, axis_id, action_text, start_date, due_date, responsible_label, status
    )
    select
      '00000000-0000-0000-0000-00000000b241',
      a.id,
      'Contorno indevido do respondente',
      current_date,
      current_date + 30,
      'TI — Responsável',
      'todo'
    from public.axes a
    where a.name = 'Governanca';
    raise exception 'FALHOU(data-api): respondente escreveu diretamente em action_plans';
  exception when insufficient_privilege then
    null;
  end;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
do $$
begin
  begin
    insert into public.action_plans(
      recommendation_id, axis_id, action_text, start_date, due_date, responsible_label, status
    )
    select
      '00000000-0000-0000-0000-00000000b241',
      a.id,
      'Contorno indevido do administrador',
      current_date,
      current_date + 30,
      'TI — Administrador',
      'todo'
    from public.axes a
    where a.name = 'Governanca';
    raise exception 'FALHOU(data-api): administrador escreveu diretamente em action_plans';
  exception when insufficient_privilege then
    null;
  end;
end $$;
rollback;

do $$
declare
  v_plan_id uuid;
  v_mode text;
  v_revision bigint;
  v_stale_revision bigint;
  v_actor uuid;
  v_action_text text;
  v_due date;
  v_member_count integer;
begin
  v_due := current_date + 30;

  select count(*) into v_member_count
  from public.list_organization_respondents('00000000-0000-0000-0000-0000000000b1');
  if v_member_count <> 1 then
    raise exception 'FALHOU(responsáveis): leitura retornou % membros; esperado 1', v_member_count;
  end if;

  if exists (
    select 1
    from public.list_organization_respondents('00000000-0000-0000-0000-0000000000b1')
    where user_id = '00000000-0000-0000-0000-0000000000a3'::uuid
  ) then
    raise exception 'FALHOU(responsáveis): leitura expôs respondente de outro órgão';
  end if;

  -- Mesmo uma escrita interna precisa respeitar a projeção do eixo.
  begin
    insert into public.action_plans(
      recommendation_id, axis_id, action_text, start_date, due_date, responsible_label, status
    )
    select
      '00000000-0000-0000-0000-00000000b241',
      a.id,
      'Ação com eixo inconsistente',
      current_date,
      v_due,
      'TI — Responsável',
      'todo'
    from public.axes a
    where a.name = 'Ambiental';
    raise exception 'FALHOU(axis): plano aceitou eixo divergente da recomendação';
  exception when check_violation then
    null;
  end;

  select result.plan_id, result.mode, result.revision
    into v_plan_id, v_mode, v_revision
  from public.save_respondent_action_plan(
    p_actor_user_id := '00000000-0000-0000-0000-0000000000a2',
    p_organization_id := '00000000-0000-0000-0000-0000000000b1',
    p_plan_id := null,
    p_recommendation_id := '00000000-0000-0000-0000-00000000b241',
    p_action_text := 'Implantar controle institucional',
    p_due_date := v_due,
    p_start_date := current_date,
    p_responsible_sector := 'Tecnologia da Informação',
    p_responsible_user_id := '00000000-0000-0000-0000-0000000000a2',
    p_progress_percentage := 0,
    p_expected_revision := null,
    p_execution_notes := 'Observação operacional'
  ) result;

  if v_plan_id is null or v_mode <> 'created' then
    raise exception 'FALHOU(rpc): criação não retornou plano/modo válidos';
  end if;
  v_stale_revision := v_revision;

  select actor_user_id into v_actor
  from public.audit_logs
  where entity_type = 'action_plans' and record_id = v_plan_id
  order by created_at desc limit 1;

  if v_actor is distinct from '00000000-0000-0000-0000-0000000000a2'::uuid then
    raise exception 'FALHOU(audit): ator = %, esperado respondente', v_actor;
  end if;

  -- Texto e progresso podem mudar na RPC operacional; o prazo vigente não.
  select result.mode, result.revision into v_mode, v_revision
  from public.save_respondent_action_plan(
    p_actor_user_id := '00000000-0000-0000-0000-0000000000a2',
    p_organization_id := '00000000-0000-0000-0000-0000000000b1',
    p_plan_id := v_plan_id,
    p_recommendation_id := '00000000-0000-0000-0000-00000000b241',
    p_action_text := 'Implantar e monitorar controle institucional',
    p_due_date := v_due,
    p_start_date := current_date,
    p_responsible_sector := 'Tecnologia da Informação',
    p_responsible_user_id := '00000000-0000-0000-0000-0000000000a2',
    p_progress_percentage := 50,
    p_expected_revision := v_revision,
    p_execution_notes := 'Execução iniciada'
  ) result;

  select action_text into v_action_text
  from public.action_plans where id = v_plan_id;
  if v_mode <> 'updated' or v_action_text <> 'Implantar e monitorar controle institucional' then
    raise exception 'FALHOU(rpc): atualização não foi persistida';
  end if;

  begin
    perform public.save_respondent_action_plan(
      p_actor_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_organization_id := '00000000-0000-0000-0000-0000000000b1',
      p_plan_id := v_plan_id,
      p_recommendation_id := '00000000-0000-0000-0000-00000000b241',
      p_action_text := 'Implantar e monitorar controle institucional',
      p_due_date := v_due + 15,
      p_start_date := current_date,
      p_responsible_sector := 'Tecnologia da Informação',
      p_responsible_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_progress_percentage := 50,
      p_expected_revision := v_revision,
      p_execution_notes := 'Tentativa de prorrogar prazo sem solicitação'
    );
    raise exception 'FALHOU(prazo): RPC alterou due_date sem aprovação administrativa';
  exception when insufficient_privilege then
    if sqlerrm not like '%action_plan_due_date_change_requires_approval%' then
      raise;
    end if;
  end;

  if exists (
    select 1 from public.action_plans
    where id = v_plan_id and due_date is distinct from v_due
  ) then
    raise exception 'FALHOU(prazo): due_date vigente foi alterado sem o fluxo de aprovação';
  end if;

  begin
    perform public.save_respondent_action_plan(
      p_actor_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_organization_id := '00000000-0000-0000-0000-0000000000b1',
      p_plan_id := v_plan_id,
      p_recommendation_id := '00000000-0000-0000-0000-00000000b241',
      p_action_text := 'Sobrescrita concorrente indevida',
      p_due_date := v_due,
      p_start_date := current_date,
      p_responsible_sector := 'Tecnologia da Informação',
      p_responsible_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_progress_percentage := 50,
      p_expected_revision := v_stale_revision,
      p_execution_notes := 'Esta alteração deve ser rejeitada.'
    );
    raise exception 'FALHOU(concorrência): revisão antiga foi aceita';
  exception when sqlstate '40001' then
    null;
  end;

  select action_text into v_action_text
  from public.action_plans where id = v_plan_id;
  if v_action_text <> 'Implantar e monitorar controle institucional' then
    raise exception 'FALHOU(concorrência): revisão antiga sobrescreveu a ação';
  end if;

  -- O administrador global não pode usar a RPC operacional do respondente.
  begin
    perform public.save_respondent_action_plan(
      p_actor_user_id := '00000000-0000-0000-0000-0000000000a1',
      p_organization_id := '00000000-0000-0000-0000-0000000000b1',
      p_plan_id := null,
      p_recommendation_id := '00000000-0000-0000-0000-00000000b241',
      p_action_text := 'Ação administrativa indevida',
      p_due_date := v_due,
      p_start_date := current_date,
      p_responsible_sector := 'Administração',
      p_responsible_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_progress_percentage := 0,
      p_expected_revision := null,
      p_execution_notes := null
    );
    raise exception 'FALHOU(admin): RPC permitiu escrita administrativa';
  exception when insufficient_privilege then
    null;
  end;

  -- Recomendação fora do processamento oficial editável não aceita plano.
  begin
    perform public.save_respondent_action_plan(
      p_actor_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_organization_id := '00000000-0000-0000-0000-0000000000b1',
      p_plan_id := null,
      p_recommendation_id := '00000000-0000-0000-0000-00000000b242',
      p_action_text := 'Ação antes da consolidação',
      p_due_date := v_due,
      p_start_date := current_date,
      p_responsible_sector := 'Tecnologia da Informação',
      p_responsible_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_progress_percentage := 0,
      p_expected_revision := null,
      p_execution_notes := null
    );
    raise exception 'FALHOU(estado): RPC aceitou recomendação não editável';
  exception when insufficient_privilege then
    null;
  end;

  -- O responsável precisa ser um respondente real da mesma organização.
  begin
    perform public.save_respondent_action_plan(
      p_actor_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_organization_id := '00000000-0000-0000-0000-0000000000b1',
      p_plan_id := null,
      p_recommendation_id := '00000000-0000-0000-0000-00000000b241',
      p_action_text := 'Ação com responsável externo',
      p_due_date := v_due,
      p_start_date := current_date,
      p_responsible_sector := 'Tecnologia da Informação',
      p_responsible_user_id := '00000000-0000-0000-0000-0000000000a3',
      p_progress_percentage := 0,
      p_expected_revision := null,
      p_execution_notes := null
    );
    raise exception 'FALHOU(responsável): RPC aceitou usuário de outro órgão';
  exception when invalid_parameter_value then
    null;
  end;

  -- A RPC também rejeita conteúdo que passaria por uma chamada direta malformada.
  begin
    perform public.save_respondent_action_plan(
      p_actor_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_organization_id := '00000000-0000-0000-0000-0000000000b1',
      p_plan_id := null,
      p_recommendation_id := '00000000-0000-0000-0000-00000000b241',
      p_action_text := '     ',
      p_due_date := v_due,
      p_start_date := current_date,
      p_responsible_sector := 'TI',
      p_responsible_user_id := '00000000-0000-0000-0000-0000000000a2',
      p_progress_percentage := 0,
      p_expected_revision := null,
      p_execution_notes := null
    );
    raise exception 'FALHOU(validation): RPC aceitou ação vazia';
  exception when invalid_parameter_value then
    null;
  end;

  set session_replication_role = replica;
  delete from public.audit_logs where record_id = v_plan_id;
  delete from public.action_plans where id = v_plan_id;
  set session_replication_role = default;
end $$;

set session_replication_role = replica;
delete from public.recommendations where id in (
  '00000000-0000-0000-0000-00000000b241',
  '00000000-0000-0000-0000-00000000b242'
);
delete from public.cycle_processings where id in (
  '00000000-0000-0000-0000-00000000a241',
  '00000000-0000-0000-0000-00000000a242'
);
delete from public.cycles where id in (
  '00000000-0000-0000-0000-00000000c231',
  '00000000-0000-0000-0000-00000000c232'
);
reset session_replication_role;

do $$ begin
  raise notice 'ACTION PLANS CYCLE EDITABILITY: OK';
end $$;
