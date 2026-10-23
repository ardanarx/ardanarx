-- Ardanarx System Admin: run once in the Supabase SQL Editor.
-- The client only uses the publishable/anon key; never add a service-role key to script.js.

create extension if not exists pgcrypto;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  content text not null default '',
  thumbnail text,
  tech_stack text[] not null default '{}',
  project_url text,
  github_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  subject text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists notes_status_created_at_idx on public.notes (status, created_at desc);
create index if not exists projects_status_sort_order_idx on public.projects (status, sort_order, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

alter table public.notes enable row level security;
alter table public.projects enable row level security;
alter table public.messages enable row level security;

-- Replace these policies with a stricter admin-role check if your project has one.
drop policy if exists "authenticated manage notes" on public.notes;
create policy "authenticated manage notes" on public.notes for all to authenticated using (true) with check (true);
drop policy if exists "authenticated manage projects" on public.projects;
create policy "authenticated manage projects" on public.projects for all to authenticated using (true) with check (true);
drop policy if exists "authenticated manage messages" on public.messages;
create policy "authenticated manage messages" on public.messages for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "authenticated manage media" on storage.objects;
create policy "authenticated manage media" on storage.objects for all to authenticated
using (bucket_id = 'media') with check (bucket_id = 'media');
