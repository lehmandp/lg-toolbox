-- ============================================================================
-- LG Loan Toolbox Hub — schema, RLS and helper functions
--
-- Idempotent: safe to run against the existing database. It will create
-- anything missing and re-assert the policies the application expects.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------- tables ---

create table if not exists tools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category text,
  monthly_price decimal(10,2) default 0,
  tool_url text,
  repository_url text,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_tools (
  user_id uuid references auth.users(id) on delete cascade,
  tool_id uuid references tools(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (user_id, tool_id)
);

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text check (status in ('active','canceled','past_due','incomplete')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists admin_users (
  user_id uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz default now()
);

-- --------------------------------------------------------------- indexes ---

create index if not exists tools_published_idx on tools (published);
create index if not exists user_tools_user_idx on user_tools (user_id);
create index if not exists subscriptions_customer_idx
  on subscriptions (stripe_customer_id);

-- -------------------------------------------------------------- triggers ---

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tools_set_updated_at on tools;
create trigger tools_set_updated_at
  before update on tools
  for each row execute function set_updated_at();

drop trigger if exists subscriptions_set_updated_at on subscriptions;
create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- ------------------------------------------------------------------ RLS ---

alter table tools          enable row level security;
alter table user_tools     enable row level security;
alter table subscriptions  enable row level security;
alter table admin_users    enable row level security;

-- Helper: is the current JWT an admin? SECURITY DEFINER so that reading
-- admin_users from inside a policy does not itself recurse through RLS.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- tools: anyone may read published tools; admins read and write everything.
drop policy if exists tools_read_published on tools;
create policy tools_read_published on tools
  for select using (published = true or is_admin());

drop policy if exists tools_admin_write on tools;
create policy tools_admin_write on tools
  for all using (is_admin()) with check (is_admin());

-- user_tools: a user sees and edits only their own rows.
drop policy if exists user_tools_own on user_tools;
create policy user_tools_own on user_tools
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- subscriptions: a user may read their own. Writes happen through the
-- service role in the Stripe webhook, which bypasses RLS entirely.
drop policy if exists subscriptions_read_own on subscriptions;
create policy subscriptions_read_own on subscriptions
  for select using (user_id = auth.uid());

-- admin_users: a user may check their own admin row (powers isAdmin()).
drop policy if exists admin_users_read_own on admin_users;
create policy admin_users_read_own on admin_users
  for select using (user_id = auth.uid());

-- ------------------------------------------- SSO subscription validation ---

-- auth.users is not exposed over PostgREST, so Strike Price's
-- /api/validate-subscription check goes through this function.
--
-- SECURITY DEFINER, and EXECUTE is revoked from anon/authenticated below, so
-- only the service role can call it. The API route in front of it additionally
-- requires the HUB_SSO_SECRET bearer token.
create or replace function hub_pro_status(p_email text)
returns table (pro boolean, current_period_end timestamptz)
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    coalesce(
      s.status = 'active'
        and (s.current_period_end is null or s.current_period_end > now()),
      false
    ) as pro,
    s.current_period_end
  from auth.users u
  left join subscriptions s on s.user_id = u.id
  where lower(u.email) = lower(p_email)
  limit 1;
$$;

revoke all on function hub_pro_status(text) from public, anon, authenticated;
grant execute on function hub_pro_status(text) to service_role;

-- ----------------------------------------------------------------- admin ---

-- Promote the admin account. Run AFTER daniel@lehmangrp.com has signed up.
insert into admin_users (user_id)
select id from auth.users where lower(email) = 'daniel@lehmangrp.com'
on conflict (user_id) do nothing;
