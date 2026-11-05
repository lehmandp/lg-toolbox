-- Optional review landing-page link for per-user email/document templates.
alter table public.toolbox_profiles
  add column if not exists review_url text not null default '';
