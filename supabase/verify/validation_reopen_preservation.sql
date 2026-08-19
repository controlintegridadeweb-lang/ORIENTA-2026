-- ============================================================================
-- Verificação de integração: reabertura de validação preserva FAMI.
-- (validated → in_validation via reopen_validation_cycle), contra o SCHEMA REAL.
--
-- Garante: estado volta a in_validation com validated_at nulo; processing
-- completed anterior permanece com FAMI; novo processing working vN+1; evento
-- auditável em cycle_validation_reopen_events. Pré: _seed_minimal.sql.
-- Cenário com ids dedicados para não colidir com o ciclo seed (que tem
-- processing working e bloquearia validation_reopen_working_processing_exists).
-- Saída esperada: "VALIDATION REOPEN PRESERVATION: OK".
-- ============================================================================
select public._verify_set_replication_replica();

insert into public.form_periods(id, form_version_id, period_code, label, status)
  values (
    'f0000000-0000-0000-0000-00000000c0df',
    '00000000-0000-0000-0000-000000000bb1',
    '2025-val-reopen',
    '2025-val-reopen',
    'open'
  )
  on conflict (id) do nothing;

insert into public.cycles(
  id, form_version_id, organization_id, period_id, period_label, state, validated_at
)
  values (
    '00000000-0000-0000-0000-00000000c0df',
    '00000000-0000-0000-0000-000000000bb1',
    '00000000-0000-0000-0000-0000000000b1',
    'f0000000-0000-0000-0000-00000000c0df',
    '2025-val-reopen',
    'validated',
    now()
  )
  on conflict (id) do update set
    period_id = excluded.period_id,
    state = 'validated',
    validated_at = excluded.validated_at;

delete from public.cycle_validation_reopen_events
where cycle_id = '00000000-0000-0000-0000-00000000c0df';
delete from public.fami_results
where cycle_id = '00000000-0000-0000-0000-00000000c0df'
  and cycle_processing_id <> '00000000-0000-0000-0000-00000000d0c2';
delete from public.cycle_processings
where cycle_id = '00000000-0000-0000-0000-00000000c0df'
  and id <> '00000000-0000-0000-0000-00000000d0c2';

insert into public.cycle_processings(id, cycle_id, processing_version, status, completed_at)
  values (
    '00000000-0000-0000-0000-00000000d0c2',
    '00000000-0000-0000-0000-00000000c0df',
    1,
    'completed',
    now()
  )
  on conflict (id) do update set
    status = 'completed',
    completed_at = excluded.completed_at,
    processing_version = 1;

insert into public.fami_results(
  cycle_id, cycle_processing_id, scope_type,
  points_obtained, points_possible, percentage, maturity_level
)
  values (
    '00000000-0000-0000-0000-00000000c0df',
    '00000000-0000-0000-0000-00000000d0c2',
    'global',
    1, 2, 50, 3
  )
  on conflict do nothing;

select public._verify_set_replication_origin();

do $$
declare
  v_cycle uuid := '00000000-0000-0000-0000-00000000c0df';
  v_proc_v1 uuid := '00000000-0000-0000-0000-00000000d0c2';
  v_actor uuid := '00000000-0000-0000-0000-0000000000a1';
  v_reason text := 'Reabertura de validação para preservar o FAMI anterior.';
  v_state public.cycle_state;
  v_validated_at timestamptz;
  v_v2 int;
  v_v1_status text;
  v_event_count int;
  v_fami_proc uuid;
  v_new_processing uuid;
begin
  begin
    perform public.reopen_validation_cycle(v_cycle, v_actor, 'curto');
    raise exception 'validation_reopen_short_reason_was_accepted';
  exception
    when sqlstate '22023' then
      if sqlerrm not like '%validation_reopen_reason_required%' then
        raise;
      end if;
  end;

  perform public.reopen_validation_cycle(v_cycle, v_actor, v_reason);

  select state, validated_at into v_state, v_validated_at
  from public.cycles
  where id = v_cycle;
  if v_state <> 'in_validation' then
    raise exception 'FALHOU(validation reopen): estado=%', v_state;
  end if;
  if v_validated_at is not null then
    raise exception 'FALHOU(validation reopen): validated_at permaneceu %', v_validated_at;
  end if;

  select count(*) into v_v2
  from public.cycle_processings
  where cycle_id = v_cycle
    and processing_version = 2
    and status = 'working';
  if v_v2 <> 1 then
    raise exception 'FALHOU(validation reopen): processing v2 working ausente (%).', v_v2;
  end if;

  select status into v_v1_status
  from public.cycle_processings
  where id = v_proc_v1;
  if v_v1_status <> 'completed' then
    raise exception 'FALHOU(validation reopen): v1 virou %', v_v1_status;
  end if;

  select cycle_processing_id into v_fami_proc
  from public.fami_results
  where cycle_id = v_cycle
    and scope_type = 'global';
  if v_fami_proc <> v_proc_v1 then
    raise exception 'FALHOU(validation reopen): FAMI migrou para %', v_fami_proc;
  end if;

  select id into v_new_processing
  from public.cycle_processings
  where cycle_id = v_cycle
    and processing_version = 2
    and status = 'working';

  select count(*) into v_event_count
  from public.cycle_validation_reopen_events event
  where event.cycle_id = v_cycle
    and event.reopen_number = 1
    and event.actor_user_id = v_actor
    and event.reason = v_reason
    and event.from_state = 'validated'
    and event.to_state = 'in_validation'
    and event.previous_cycle_processing_id = v_proc_v1
    and event.new_cycle_processing_id = v_new_processing;
  if v_event_count <> 1 then
    raise exception 'FALHOU(validation reopen): evento auditável ausente ou divergente (%).', v_event_count;
  end if;

  perform public._verify_set_replication_replica();
  delete from public.cycle_validation_reopen_events where cycle_id = v_cycle;
  delete from public.fami_results where cycle_id = v_cycle;
  delete from public.cycle_processings where cycle_id = v_cycle;
  delete from public.cycles where id = v_cycle;
  delete from public.form_periods where id = 'f0000000-0000-0000-0000-00000000c0df';
  perform public._verify_set_replication_origin();

  raise notice 'VALIDATION REOPEN PRESERVATION: OK';
end $$;
