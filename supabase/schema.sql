create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  area text not null,
  jurisdiction text not null,
  type text not null,
  summary text not null,
  tags text[] not null default '{}',
  author_alias text not null,
  file_url text,
  file_name text,
  created_by uuid default auth.uid()
);

alter table public.resources enable row level security;

create policy "authenticated users can read resources"
  on public.resources
  for select
  to authenticated
  using (true);

create policy "authenticated users can insert resources"
  on public.resources
  for insert
  to authenticated
  with check (auth.uid() = created_by or created_by is null);

create policy "authenticated users can update own resources"
  on public.resources
  for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "authenticated users can delete own resources"
  on public.resources
  for delete
  to authenticated
  using (auth.uid() = created_by);
