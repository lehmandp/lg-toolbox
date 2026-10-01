-- LG Toolbox + Originator Engine integration migration
-- Safe to run against an existing LG Toolbox Supabase project.

-- ---------------------------------------------------------------------------
-- Tool catalog metadata
-- ---------------------------------------------------------------------------
alter table public.tools
  add column if not exists tool_type text not null default 'native';

alter table public.tools
  add column if not exists display_order integer not null default 100;

alter table public.tools
  add column if not exists featured boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tools_tool_type_check'
  ) then
    alter table public.tools
      add constraint tools_tool_type_check
      check (tool_type in ('native', 'external'));
  end if;
end $$;

create index if not exists tools_display_order_idx
  on public.tools (display_order);

-- ---------------------------------------------------------------------------
-- Originator Engine settings
-- One row per authenticated user. JSONB keeps the planner flexible while the
-- UI is still evolving.
-- ---------------------------------------------------------------------------
create table if not exists public.originator_engine_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.originator_engine_settings enable row level security;

drop policy if exists "Users can view own Originator Engine settings"
  on public.originator_engine_settings;
create policy "Users can view own Originator Engine settings"
  on public.originator_engine_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own Originator Engine settings"
  on public.originator_engine_settings;
create policy "Users can insert own Originator Engine settings"
  on public.originator_engine_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own Originator Engine settings"
  on public.originator_engine_settings;
create policy "Users can update own Originator Engine settings"
  on public.originator_engine_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Originator Engine activity
-- Each interaction/bulk entry is one row; activity counts live in metrics.
-- ---------------------------------------------------------------------------
create table if not exists public.originator_engine_activity_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null default 'individual'
    check (entry_type in ('individual', 'bulk')),
  activity_date date not null default current_date,
  title text,
  category text,
  note text,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists originator_engine_activity_user_date_idx
  on public.originator_engine_activity_entries (user_id, activity_date desc);

alter table public.originator_engine_activity_entries enable row level security;

drop policy if exists "Users can view own Originator Engine activity"
  on public.originator_engine_activity_entries;
create policy "Users can view own Originator Engine activity"
  on public.originator_engine_activity_entries
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own Originator Engine activity"
  on public.originator_engine_activity_entries;
create policy "Users can insert own Originator Engine activity"
  on public.originator_engine_activity_entries
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own Originator Engine activity"
  on public.originator_engine_activity_entries;
create policy "Users can update own Originator Engine activity"
  on public.originator_engine_activity_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own Originator Engine activity"
  on public.originator_engine_activity_entries;
create policy "Users can delete own Originator Engine activity"
  on public.originator_engine_activity_entries
  for delete
  using (auth.uid() = user_id);
