create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles readable by authenticated users" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;

create policy "profiles readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles insert own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles update own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  area text,
  jurisdiction text,
  type text,
  original_file_url text,
  original_file_name text,
  current_content text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resources enable row level security;

drop policy if exists "resources read authenticated" on public.resources;
drop policy if exists "resources insert authenticated" on public.resources;
drop policy if exists "resources update admins" on public.resources;

create policy "resources read authenticated"
on public.resources
for select
to authenticated
using (true);

create policy "resources insert authenticated"
on public.resources
for insert
to authenticated
with check (true);

create policy "resources update admins"
on public.resources
for update
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id) on delete set null,
  author_label text,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "comments read authenticated" on public.comments;
drop policy if exists "comments insert authenticated" on public.comments;

create policy "comments read authenticated"
on public.comments
for select
to authenticated
using (true);

create policy "comments insert authenticated"
on public.comments
for insert
to authenticated
with check (true);

create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  author_label text,
  created_at timestamptz not null default now()
);

alter table public.revisions enable row level security;

drop policy if exists "revisions read authenticated" on public.revisions;
drop policy if exists "revisions insert authenticated" on public.revisions;
drop policy if exists "revisions update admins" on public.revisions;

create policy "revisions read authenticated"
on public.revisions
for select
to authenticated
using (true);

create policy "revisions insert authenticated"
on public.revisions
for insert
to authenticated
with check (true);

create policy "revisions update admins"
on public.revisions
for update
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.admin_decisions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  revision_id uuid references public.revisions(id) on delete set null,
  decision text not null check (decision in ('accepted', 'rejected')),
  reason text,
  decided_by uuid references auth.users(id) on delete set null,
  decider_label text,
  created_at timestamptz not null default now()
);

alter table public.admin_decisions enable row level security;

drop policy if exists "admin decisions read authenticated" on public.admin_decisions;
drop policy if exists "admin decisions insert admins" on public.admin_decisions;

create policy "admin decisions read authenticated"
on public.admin_decisions
for select
to authenticated
using (true);

create policy "admin decisions insert admins"
on public.admin_decisions
for insert
to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Storage policies for a bucket named `resources`
drop policy if exists "resources bucket upload authenticated" on storage.objects;
drop policy if exists "resources bucket read authenticated" on storage.objects;
drop policy if exists "resources bucket update authenticated" on storage.objects;
drop policy if exists "resources bucket delete authenticated" on storage.objects;

create policy "resources bucket upload authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'resources');

create policy "resources bucket read authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'resources');

create policy "resources bucket update authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'resources')
with check (bucket_id = 'resources');

create policy "resources bucket delete authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'resources');
