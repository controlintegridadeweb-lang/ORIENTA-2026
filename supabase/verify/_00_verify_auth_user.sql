-- Helper de fixture: cria auth.users no schema real do GoTrue e no stub de
-- PGlite/CI sem session_replication_role. Não é RPC de produto.
create or replace function public._verify_ensure_auth_user(p_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $verify$
declare
  v_cols text[] := array['id', 'email'];
  v_vals text[] := array[quote_literal(p_id), quote_literal(p_email)];
  v_col text;
  v_password_expr text;
begin
  if p_id is null or nullif(btrim(p_email), '') is null then
    raise exception '_verify_ensure_auth_user_invalid_args';
  end if;
  begin
    if exists (select 1 from auth.users where id = p_id) then
      return;
    end if;
  exception
    when insufficient_privilege then
      null;
  end;

  if to_regprocedure('extensions.crypt(text,text)') is not null then
    v_password_expr := 'extensions.crypt(''orienta-verify'', extensions.gen_salt(''bf''))';
  elsif to_regprocedure('public.crypt(text,text)') is not null then
    v_password_expr := 'crypt(''orienta-verify'', gen_salt(''bf''))';
  else
    v_password_expr := quote_literal('');
  end if;

  foreach v_col in array array[
    'instance_id',
    'aud',
    'role',
    'encrypted_password',
    'email_confirmed_at',
    'confirmation_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token',
    'email_change',
    'email_change_token_current',
    'phone_change',
    'phone_change_token',
    'reauthentication_token',
    'raw_app_meta_data',
    'raw_user_meta_data',
    'created_at',
    'updated_at'
  ]
  loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'auth'
        and table_name = 'users'
        and column_name = v_col
    ) then
      continue;
    end if;
    v_cols := v_cols || v_col;
    v_vals := v_vals || case v_col
      when 'instance_id' then quote_literal('00000000-0000-0000-0000-000000000000')
      when 'aud' then quote_literal('authenticated')
      when 'role' then quote_literal('authenticated')
      when 'encrypted_password' then v_password_expr
      when 'email_confirmed_at' then 'now()'
      when 'confirmation_token' then quote_literal(p_id::text)
      when 'recovery_token' then quote_literal('')
      when 'email_change_token_new' then quote_literal('')
      when 'email_change_token' then quote_literal('')
      when 'email_change' then quote_literal('')
      when 'email_change_token_current' then quote_literal('')
      when 'phone_change' then quote_literal('')
      when 'phone_change_token' then quote_literal('')
      when 'reauthentication_token' then quote_literal('')
      when 'raw_app_meta_data' then quote_literal('{"provider":"email","providers":["email"]}') || '::jsonb'
      when 'raw_user_meta_data' then quote_literal('{}') || '::jsonb'
      when 'created_at' then 'now()'
      when 'updated_at' then 'now()'
    end;
  end loop;

  begin
    execute format(
      'insert into auth.users (%s) values (%s)',
      array_to_string(v_cols, ', '),
      array_to_string(v_vals, ', ')
    );
  exception
    when unique_violation then
      return;
    when insufficient_privilege then
      begin
        execute 'set local role supabase_auth_admin';
        execute format(
          'insert into auth.users (%s) values (%s)',
          array_to_string(v_cols, ', '),
          array_to_string(v_vals, ', ')
        );
        execute 'reset role';
      exception
        when unique_violation then
          execute 'reset role';
          return;
        when undefined_object then
          execute 'reset role';
          raise;
      end;
  end;

  if to_regclass('auth.identities') is null then
    return;
  end if;
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'identities'
      and column_name = 'user_id'
  ) and not exists (
    select 1 from auth.identities where user_id = p_id
  ) then
    begin
      insert into auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        p_id::text,
        p_id,
        jsonb_build_object('sub', p_id::text, 'email', p_email),
        'email',
        now(),
        now(),
        now()
      );
    exception
      when undefined_column or unique_violation or not_null_violation then
        null;
    end;
  end if;
end;
$verify$;

revoke all on function public._verify_ensure_auth_user(uuid, text)
  from public, anon, authenticated;
grant execute on function public._verify_ensure_auth_user(uuid, text)
  to postgres, service_role;

-- No Supabase local recente o papel `postgres` não é superuser. SET replica
-- direto aborta o verify; aqui tentamos supabase_admin e devolvemos o papel.
create or replace function public._verify_set_replication_role(
  p_role text,
  p_is_local boolean default false
)
returns void
language plpgsql
as $verify$
declare
  v_current text := current_user;
  v_try text;
begin
  if p_role not in ('replica', 'origin', 'default') then
    raise exception '_verify_set_replication_role_invalid';
  end if;

  begin
    perform set_config('session_replication_role', p_role, p_is_local);
    return;
  exception
    when insufficient_privilege then
      null;
  end;

  foreach v_try in array array['supabase_admin']
  loop
    if not exists (select 1 from pg_roles where rolname = v_try) then
      continue;
    end if;
    begin
      execute format('set role %I', v_try);
    exception
      when others then
        continue;
    end;
    begin
      perform set_config('session_replication_role', p_role, p_is_local);
    exception
      when others then
        begin
          execute format('set role %I', v_current);
        exception
          when others then
            null;
        end;
        continue;
    end;
    begin
      execute format('set role %I', v_current);
    exception
      when others then
        null;
    end;
    return;
  end loop;

  raise notice 'session_replication_role=% indisponível neste papel', p_role;
end;
$verify$;

drop function if exists public._verify_set_replication_replica();
drop function if exists public._verify_set_replication_replica(boolean);
drop function if exists public._verify_set_replication_origin(boolean);

create or replace function public._verify_set_replication_replica(
  p_is_local boolean default false
)
returns void
language plpgsql
as $verify$
begin
  perform public._verify_set_replication_role('replica', p_is_local);
end;
$verify$;

create or replace function public._verify_set_replication_origin(
  p_is_local boolean default false
)
returns void
language plpgsql
as $verify$
begin
  perform public._verify_set_replication_role('origin', p_is_local);
end;
$verify$;

revoke all on function public._verify_set_replication_role(text, boolean)
  from public, anon, authenticated;
grant execute on function public._verify_set_replication_role(text, boolean)
  to postgres, service_role;

revoke all on function public._verify_set_replication_replica(boolean)
  from public, anon, authenticated;
grant execute on function public._verify_set_replication_replica(boolean)
  to postgres, service_role;

revoke all on function public._verify_set_replication_origin(boolean)
  from public, anon, authenticated;
grant execute on function public._verify_set_replication_origin(boolean)
  to postgres, service_role;
