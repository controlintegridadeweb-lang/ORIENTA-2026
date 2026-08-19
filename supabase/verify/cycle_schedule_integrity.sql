-- ============================================================================
-- Verificação de integração: cronograma completo, revisão e invalidação de jobs.
-- Pré: _seed_minimal.sql. Saída esperada: "CYCLE SCHEDULE INTEGRITY: OK".
-- ============================================================================
select public._verify_set_replication_replica();
insert into public.form_periods(id, form_version_id, period_code, label, status)
values (
  'f0000000-0000-0000-0000-00000000ca26',
  '00000000-0000-0000-0000-000000000bb1',
  'schedule-integrity',
  'schedule-integrity',
  'open'
)
on conflict (id) do nothing;
insert into public.cycles(
  id, form_version_id, organization_id, period_id, period_label, state, reopen_count
) values (
  '00000000-0000-0000-0000-00000000ca26',
  '00000000-0000-0000-0000-000000000bb1',
  '00000000-0000-0000-0000-0000000000b1',
  'f0000000-0000-0000-0000-00000000ca26',
  'schedule-integrity',
  'draft',
  0
)
on conflict (id) do update set
  period_id = excluded.period_id,
  state = 'draft',
  starts_at = null,
  response_deadline_at = null,
  validation_deadline_at = null,
  cycle_close_at = null,
  schedule_revision = 0;
select public._verify_set_replication_origin();

do $$
declare
  v_cycle uuid := '00000000-0000-0000-0000-00000000ca26';
  v_actor uuid := '00000000-0000-0000-0000-0000000000a1';
  v_revision bigint;
  v_pending integer;
  v_stale integer;
  v_action jsonb;
begin
  perform public.update_cycle_schedule(
    v_cycle,
    now() + interval '10 days',
    now() + interval '20 days',
    now() + interval '30 days',
    now() + interval '40 days',
    v_actor
  );

  select schedule_revision into v_revision from public.cycles where id = v_cycle;
  if v_revision <> 1 then
    raise exception 'FALHOU(revisão inicial): %', v_revision;
  end if;

  select count(*) into v_pending
  from public.automation_job_items item
  join public.automation_jobs job on job.id = item.job_id
  where item.entity_type = 'cycle'
    and item.entity_id = v_cycle::text
    and item.status = 'pending'
    and job.status = 'pending'
    and (item.input ->> 'schedule_revision')::bigint = 1;
  if v_pending <> 7 then
    raise exception 'FALHOU(jobs revisão 1): esperado 7, encontrado %', v_pending;
  end if;

  perform public.update_cycle_schedule(
    v_cycle,
    now() + interval '11 days',
    now() + interval '21 days',
    now() + interval '31 days',
    now() + interval '41 days',
    v_actor
  );

  select schedule_revision into v_revision from public.cycles where id = v_cycle;
  if v_revision <> 2 then
    raise exception 'FALHOU(revisão substituída): %', v_revision;
  end if;

  select count(*) into v_pending
  from public.automation_job_items item
  join public.automation_jobs job on job.id = item.job_id
  where item.entity_type = 'cycle'
    and item.entity_id = v_cycle::text
    and item.status = 'pending'
    and job.status = 'pending'
    and (item.input ->> 'schedule_revision')::bigint = 2;
  if v_pending <> 7 then
    raise exception 'FALHOU(jobs revisão 2): esperado 7, encontrado %', v_pending;
  end if;

  select count(*) into v_stale
  from public.automation_job_items item
  where item.entity_type = 'cycle'
    and item.entity_id = v_cycle::text
    and item.status = 'skipped'
    and (item.input ->> 'schedule_revision')::bigint = 1;
  if v_stale <> 7 then
    raise exception 'FALHOU(invalidação revisão 1): esperado 7, encontrado %', v_stale;
  end if;

  v_action := public.execute_scheduled_cycle_action(
    v_cycle, v_actor, 'open_cycle', 1
  );
  if v_action ->> 'status' <> 'skipped' then
    raise exception 'FALHOU(job obsoleto): %', v_action;
  end if;

  perform public._verify_set_replication_replica();
  delete from public.automation_jobs job
  where exists (
    select 1 from public.automation_job_items item
    where item.job_id = job.id
      and item.entity_type = 'cycle'
      and item.entity_id = v_cycle::text
  );
  delete from public.audit_logs where record_id = v_cycle;
  delete from public.cycles where id = v_cycle;
  perform public._verify_set_replication_origin();

  raise notice 'CYCLE SCHEDULE INTEGRITY: OK';
end $$;
