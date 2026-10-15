-- Dr. Muniswaran website CMS — run once in Supabase: SQL Editor > New query > paste > Run.

-- 1) One table holds every edit the clinic makes. No row = the website keeps its built-in text.
create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

create or replace function public.site_content_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch before insert or update on public.site_content
  for each row execute function public.site_content_touch();

-- 2) Security: everyone may READ (the public website needs it); only signed-in admins may CHANGE.
alter table public.site_content enable row level security;

drop policy if exists "site_content read"   on public.site_content;
drop policy if exists "site_content insert" on public.site_content;
drop policy if exists "site_content update" on public.site_content;
drop policy if exists "site_content delete" on public.site_content;

create policy "site_content read"   on public.site_content for select to anon, authenticated using (true);
create policy "site_content insert" on public.site_content for insert to authenticated with check (true);
create policy "site_content update" on public.site_content for update to authenticated using (true) with check (true);
create policy "site_content delete" on public.site_content for delete to authenticated using (true);

-- 3) Public image bucket (for photos added through the editor later).
insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "site-images read"   on storage.objects;
drop policy if exists "site-images write"  on storage.objects;
drop policy if exists "site-images update" on storage.objects;
drop policy if exists "site-images delete" on storage.objects;

create policy "site-images read"   on storage.objects for select to anon, authenticated using (bucket_id = 'site-images');
create policy "site-images write"  on storage.objects for insert to authenticated with check (bucket_id = 'site-images');
create policy "site-images update" on storage.objects for update to authenticated using (bucket_id = 'site-images');
create policy "site-images delete" on storage.objects for delete to authenticated using (bucket_id = 'site-images');
