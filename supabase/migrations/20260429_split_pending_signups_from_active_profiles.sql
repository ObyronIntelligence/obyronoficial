create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_username text;
begin
  if new.email_confirmed_at is null then
    delete from public.profiles
    where id = new.id;

    return new;
  end if;

  normalized_username := public.normalize_profile_username(
    new.raw_user_meta_data ->> 'username',
    new.email
  );

  normalized_username := public.ensure_unique_profile_username(
    coalesce(normalized_username, 'cliente'),
    new.id
  );

  insert into public.profiles (
    id,
    email,
    username,
    full_name
  )
  values (
    new.id,
    new.email,
    normalized_username,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = excluded.username,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.sync_profile_from_auth_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data, email_confirmed_at on auth.users
for each row
execute procedure public.sync_profile_from_auth_user();

delete from public.profiles
where id in (
  select users.id
  from auth.users as users
  where users.email_confirmed_at is null
    and users.deleted_at is null
);

do $$
declare
  auth_user record;
  normalized_username text;
begin
  for auth_user in
    select
      users.id,
      users.email,
      users.raw_user_meta_data,
      users.created_at,
      users.updated_at
    from auth.users as users
    where users.email_confirmed_at is not null
      and users.deleted_at is null
    order by users.created_at nulls first, users.id
  loop
    normalized_username := public.normalize_profile_username(
      auth_user.raw_user_meta_data ->> 'username',
      auth_user.email
    );

    normalized_username := public.ensure_unique_profile_username(
      coalesce(normalized_username, 'cliente'),
      auth_user.id
    );

    insert into public.profiles (
      id,
      email,
      username,
      full_name,
      created_at,
      updated_at
    )
    values (
      auth_user.id,
      auth_user.email,
      normalized_username,
      nullif(trim(coalesce(auth_user.raw_user_meta_data ->> 'name', '')), ''),
      coalesce(auth_user.created_at, timezone('utc', now())),
      coalesce(auth_user.updated_at, timezone('utc', now()))
    )
    on conflict (id) do update
    set
      email = excluded.email,
      username = excluded.username,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = timezone('utc', now());
  end loop;
end;
$$;

create or replace view public.pending_signup_customers as
select
  users.id,
  users.email,
  nullif(trim(coalesce(users.raw_user_meta_data ->> 'username', '')), '') as requested_username,
  nullif(trim(coalesce(users.raw_user_meta_data ->> 'name', '')), '') as full_name,
  users.created_at as signup_started_at,
  users.confirmation_sent_at,
  users.email_confirmed_at,
  users.last_sign_in_at,
  'pending_email_confirmation'::text as signup_stage
from auth.users as users
where users.email_confirmed_at is null
  and users.deleted_at is null
  and coalesce(users.is_anonymous, false) = false;

comment on view public.pending_signup_customers is 'Cadastros iniciados que ainda nao confirmaram o e-mail.';

create or replace view public.active_client_profiles as
select
  profiles.id,
  profiles.client_id,
  profiles.email,
  profiles.username,
  profiles.full_name,
  users.created_at as signup_started_at,
  users.email_confirmed_at,
  users.last_sign_in_at,
  profiles.created_at as profile_created_at,
  profiles.updated_at as profile_updated_at,
  'active_client'::text as signup_stage
from public.profiles as profiles
join auth.users as users
  on users.id = profiles.id
where users.email_confirmed_at is not null
  and users.deleted_at is null;

comment on view public.active_client_profiles is 'Clientes que confirmaram o e-mail e possuem profile ativo.';

create or replace view public.client_signup_segments as
select
  pending.id,
  null::bigint as client_id,
  pending.email,
  pending.requested_username as username,
  pending.full_name,
  pending.signup_started_at,
  pending.confirmation_sent_at,
  pending.email_confirmed_at,
  pending.last_sign_in_at,
  null::timestamptz as profile_created_at,
  null::timestamptz as profile_updated_at,
  pending.signup_stage
from public.pending_signup_customers as pending

union all

select
  active.id,
  active.client_id,
  active.email,
  active.username,
  active.full_name,
  active.signup_started_at,
  null::timestamptz as confirmation_sent_at,
  active.email_confirmed_at,
  active.last_sign_in_at,
  active.profile_created_at,
  active.profile_updated_at,
  active.signup_stage
from public.active_client_profiles as active;

comment on view public.client_signup_segments is 'Visao unificada para separar cadastros pendentes e clientes ativos.';

revoke all on public.pending_signup_customers from anon, authenticated;
revoke all on public.active_client_profiles from anon, authenticated;
revoke all on public.client_signup_segments from anon, authenticated;
