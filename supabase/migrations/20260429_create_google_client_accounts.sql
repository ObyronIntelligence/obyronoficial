create table if not exists public.google_client_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  client_id bigint not null unique references public.profiles(client_id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  google_subject text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.google_client_accounts is 'Clientes autenticados pelo Google e vinculados ao profile principal.';
comment on column public.google_client_accounts.user_id is 'Mesmo identificador do auth.users e do public.profiles.';
comment on column public.google_client_accounts.client_id is 'Chave estrangeira amigavel apontando para public.profiles(client_id).';
comment on column public.google_client_accounts.google_subject is 'Identificador unico retornado pelo Google para a conta autenticada.';

alter table public.google_client_accounts enable row level security;

drop trigger if exists set_google_client_accounts_updated_at on public.google_client_accounts;
create trigger set_google_client_accounts_updated_at
before update on public.google_client_accounts
for each row
execute procedure public.sync_profile_timestamps();

create or replace function public.auth_user_uses_google(user_app_meta jsonb)
returns boolean
language sql
immutable
as $$
  select
    coalesce(user_app_meta ->> 'provider', '') = 'google'
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(user_app_meta -> 'providers', '[]'::jsonb)) as provider(name)
      where provider.name = 'google'
    );
$$;

create or replace function public.sync_google_client_account_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_record public.profiles%rowtype;
  resolved_full_name text;
  resolved_avatar_url text;
  resolved_google_subject text;
begin
  if new.deleted_at is not null
    or new.email_confirmed_at is null
    or not public.auth_user_uses_google(coalesce(new.raw_app_meta_data, '{}'::jsonb)) then
    delete from public.google_client_accounts
    where user_id = new.id;

    return new;
  end if;

  select *
  into profile_record
  from public.profiles
  where id = new.id;

  if profile_record.id is null then
    return new;
  end if;

  resolved_full_name := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), ''),
    profile_record.full_name
  );
  resolved_avatar_url := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data ->> 'avatar_url',
        new.raw_user_meta_data ->> 'picture',
        ''
      )
    ),
    ''
  );
  resolved_google_subject := nullif(trim(coalesce(new.raw_user_meta_data ->> 'sub', '')), '');

  insert into public.google_client_accounts (
    user_id,
    client_id,
    email,
    full_name,
    avatar_url,
    google_subject
  )
  values (
    profile_record.id,
    profile_record.client_id,
    profile_record.email,
    resolved_full_name,
    resolved_avatar_url,
    resolved_google_subject
  )
  on conflict (user_id) do update
  set
    client_id = excluded.client_id,
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.google_client_accounts.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.google_client_accounts.avatar_url),
    google_subject = coalesce(excluded.google_subject, public.google_client_accounts.google_subject),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_google_client_created on auth.users;
create trigger on_auth_user_google_client_created
after insert on auth.users
for each row
execute procedure public.sync_google_client_account_from_auth_user();

drop trigger if exists on_auth_user_google_client_updated on auth.users;
create trigger on_auth_user_google_client_updated
after update of email, raw_user_meta_data, raw_app_meta_data, email_confirmed_at, deleted_at on auth.users
for each row
execute procedure public.sync_google_client_account_from_auth_user();

delete from public.google_client_accounts
where user_id in (
  select users.id
  from auth.users as users
  where users.deleted_at is not null
     or users.email_confirmed_at is null
     or not public.auth_user_uses_google(coalesce(users.raw_app_meta_data, '{}'::jsonb))
);

insert into public.google_client_accounts (
  user_id,
  client_id,
  email,
  full_name,
  avatar_url,
  google_subject,
  created_at,
  updated_at
)
select
  profiles.id,
  profiles.client_id,
  profiles.email,
  coalesce(
    nullif(trim(coalesce(users.raw_user_meta_data ->> 'name', '')), ''),
    profiles.full_name
  ) as full_name,
  nullif(
    trim(
      coalesce(
        users.raw_user_meta_data ->> 'avatar_url',
        users.raw_user_meta_data ->> 'picture',
        ''
      )
    ),
    ''
  ) as avatar_url,
  nullif(trim(coalesce(users.raw_user_meta_data ->> 'sub', '')), '') as google_subject,
  profiles.created_at,
  profiles.updated_at
from public.profiles as profiles
join auth.users as users
  on users.id = profiles.id
where users.deleted_at is null
  and users.email_confirmed_at is not null
  and public.auth_user_uses_google(coalesce(users.raw_app_meta_data, '{}'::jsonb))
on conflict (user_id) do update
set
  client_id = excluded.client_id,
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.google_client_accounts.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.google_client_accounts.avatar_url),
  google_subject = coalesce(excluded.google_subject, public.google_client_accounts.google_subject),
  updated_at = timezone('utc', now());

drop policy if exists "Users can view own google client account" on public.google_client_accounts;
create policy "Users can view own google client account"
on public.google_client_accounts
for select
to authenticated
using (auth.uid() = user_id);
