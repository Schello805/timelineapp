create extension if not exists "pgcrypto";

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  title text not null check (char_length(title) between 2 and 160),
  description text not null check (char_length(description) >= 10),
  image_url text,
  video_url text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_timeline_events_updated_at on public.timeline_events;
create trigger set_timeline_events_updated_at
before update on public.timeline_events
for each row
execute function public.set_updated_at();

alter table public.timeline_events enable row level security;

drop policy if exists "Timeline events are public readable" on public.timeline_events;
create policy "Timeline events are public readable"
on public.timeline_events
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert timeline events" on public.timeline_events;
create policy "Authenticated users can insert timeline events"
on public.timeline_events
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update timeline events" on public.timeline_events;
create policy "Authenticated users can update timeline events"
on public.timeline_events
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete timeline events" on public.timeline_events;
create policy "Authenticated users can delete timeline events"
on public.timeline_events
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('timeline-media', 'timeline-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public timeline media read" on storage.objects;
create policy "Public timeline media read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'timeline-media');

drop policy if exists "Authenticated timeline media upload" on storage.objects;
create policy "Authenticated timeline media upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'timeline-media');

drop policy if exists "Authenticated timeline media update" on storage.objects;
create policy "Authenticated timeline media update"
on storage.objects
for update
to authenticated
using (bucket_id = 'timeline-media')
with check (bucket_id = 'timeline-media');

drop policy if exists "Authenticated timeline media delete" on storage.objects;
create policy "Authenticated timeline media delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'timeline-media');
