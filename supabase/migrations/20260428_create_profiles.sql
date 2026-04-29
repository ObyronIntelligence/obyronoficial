create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id bigint generated always as identity unique,
  email text not null unique,
  username text unique,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'Perfil publico sincronizado a partir de auth.users.';
comment on column public.profiles.client_id is 'Identificador sequencial amigavel para uso interno e comercial.';
comment on column public.profiles.email is 'Email atual do usuario autenticado.';
comment on column public.profiles.username is 'Nome de usuario escolhido no cadastro.';
comment on column public.profiles.full_name is 'Nome completo do usuario.';

alter table public.profiles enable row level security;

create or replace function public.normalize_profile_username(raw_value text, fallback_email text)
returns text
language plpgsql
immutable
as $$
declare
  candidate text;
begin
  candidate := lower(trim(coalesce(raw_value, '')));

  if candidate = '' then
    candidate := split_part(lower(coalesce(fallback_email, '')), '@', 1);
  end if;

  candidate := regexp_replace(candidate, '[^a-z0-9_]+', '_', 'g');
  candidate := regexp_replace(candidate, '_{2,}', '_', 'g');
  candidate := trim(both '_' from candidate);

  if candidate = '' then
    return null;
  end if;

  return candidate;
end;
$$;

create or replace function public.ensure_unique_profile_username(base_username text, profile_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base_root text;
  candidate text;
  suffix int := 0;
begin
  base_root := coalesce(nullif(trim(base_username), ''), 'cliente');
  candidate := base_root;

  loop
    exit when not exists (
      select 1
      from public.profiles
      where username = candidate
        and id <> profile_user_id
    );

    suffix := suffix + 1;
    candidate := base_root || '_' || suffix::text;
  end loop;

  return candidate;
end;
$$;

create or replace function public.sync_profile_timestamps()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.sync_profile_timestamps();

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_username text;
begin
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
after update of email, raw_user_meta_data on auth.users
for each row
execute procedure public.sync_profile_from_auth_user();

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

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
