-- Apply in the LG Loan Toolbox Supabase SQL editor before connecting API keys.
-- Keys are encrypted by the application before insertion; users access only their own row.
create table if not exists public.ai_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  api_key_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ai_user_settings enable row level security;
drop policy if exists ai_user_settings_own on public.ai_user_settings;
create policy ai_user_settings_own on public.ai_user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- No anon access, and no cross-user access via RLS.
-- Application routes must never return api_key_encrypted to clients.
