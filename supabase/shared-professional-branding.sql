-- Shared branding fields for all native Toolbox forms and exports.
alter table public.toolbox_profiles
 add column if not exists email text not null default '',
 add column if not exists business_address text not null default '',
 add column if not exists license_state text not null default '',
 add column if not exists license_number text not null default '',
 add column if not exists tagline text not null default '',
 add column if not exists disclosure text not null default '',
 add column if not exists logo_url text not null default '',
 add column if not exists headshot_url text not null default '',
 add column if not exists branding_default text not null default 'logo';
alter table public.toolbox_profiles drop constraint if exists toolbox_profiles_branding_default_check;
alter table public.toolbox_profiles add constraint toolbox_profiles_branding_default_check check (branding_default in ('logo','headshot','both','none'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('toolbox-branding','toolbox-branding',true,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/png','image/jpeg','image/webp'];
drop policy if exists "toolbox branding upload own" on storage.objects;
create policy "toolbox branding upload own" on storage.objects for insert to authenticated with check
(bucket_id='toolbox-branding' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "toolbox branding update own" on storage.objects;
create policy "toolbox branding update own" on storage.objects for update to authenticated using
(bucket_id='toolbox-branding' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id='toolbox-branding' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "toolbox branding delete own" on storage.objects;
create policy "toolbox branding delete own" on storage.objects for delete to authenticated using
(bucket_id='toolbox-branding' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "toolbox branding select own" on storage.objects;
create policy "toolbox branding select own" on storage.objects for select to authenticated using
(bucket_id='toolbox-branding' and (storage.foldername(name))[1] = (select auth.uid())::text);
