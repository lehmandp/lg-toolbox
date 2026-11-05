-- Professional profile for shared Toolbox identity.
create table if not exists public.toolbox_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 company text not null default '',
 nmls text not null default '',
 company_nmls text not null default '',
 phone text not null default '',
 website text not null default '',
 updated_at timestamptz not null default now()
);
alter table public.toolbox_profiles enable row level security;
drop policy if exists toolbox_profiles_own on public.toolbox_profiles;
create policy toolbox_profiles_own on public.toolbox_profiles
 for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
grant select,insert,update,delete on public.toolbox_profiles to authenticated;
