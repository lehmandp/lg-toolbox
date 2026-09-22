-- ============================================================================
-- One-time setup for the admin account (daniel@lehmangrp.com).
--
-- Run this in the Supabase SQL editor AFTER signing up on the site.
-- Safe to run more than once.
-- ============================================================================

-- 1. Confirm the account.
--    Only needed because the confirmation email pointed at localhost. Once
--    the Site URL is fixed in Authentication -> URL Configuration, normal
--    signups confirm themselves and this step is not needed again.
update auth.users
set email_confirmed_at = now()
where lower(email) = 'daniel@lehmangrp.com'
  and email_confirmed_at is null;

-- 2. Let a signed-in user read their own admin row.
--    The app checks this to decide whether to show the Admin page, so
--    without it the page 404s even for a real admin.
alter table admin_users enable row level security;

drop policy if exists admin_users_read_own on admin_users;
create policy admin_users_read_own on admin_users
  for select using (user_id = auth.uid());

-- 3. Grant admin.
insert into admin_users (user_id)
select id from auth.users where lower(email) = 'daniel@lehmangrp.com'
on conflict (user_id) do nothing;

-- 4. Check it worked. Expect one row: confirmed = true, is_admin = true.
select
  u.email,
  (u.email_confirmed_at is not null) as confirmed,
  exists (select 1 from admin_users a where a.user_id = u.id) as is_admin
from auth.users u
where lower(u.email) = 'daniel@lehmangrp.com';
