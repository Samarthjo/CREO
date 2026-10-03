-- Founding Creator Cohort applications, written by POST /api/apply (src/lib/apply.ts is the source of the options).
create table public.cohort_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  handle text not null check (handle ~ '^@[A-Za-z0-9._-]{1,30}$'),
  contact text not null check (char_length(contact) between 5 and 120),
  followers text not null check (followers in ('Under 2K', '2K to 10K', '10K to 25K', '25K to 40K', 'Over 40K')),
  niche text check (char_length(niche) <= 60),
  platform text check (platform in ('Instagram', 'YouTube', 'LinkedIn', 'X', 'Other')),
  posts_per_week text check (posts_per_week in ('Less than 1', '1 to 2', '3 to 4', '5 or more')),
  goal text check (goal in ('Growth', 'Brand deals', 'Authority', 'Community', 'Sales')),
  brand_inquiries text check (brand_inquiries in ('Yes, regularly', 'Sometimes', 'Not yet')),
  problem text check (char_length(problem) <= 400),
  agreed boolean not null check (agreed),
  status text not null default 'new' check (status in ('new', 'contacted', 'accepted', 'declined'))
);

comment on table public.cohort_applications is 'Founding Creator Cohort applications from the landing page. Readable only from the dashboard or with the secret key.';

create index cohort_applications_created_at_idx on public.cohort_applications (created_at desc);

-- The site writes with the publishable key (anon role): insert only. No read, update or delete for anon or authenticated.
alter table public.cohort_applications enable row level security;
revoke all on table public.cohort_applications from anon, authenticated;
grant insert on table public.cohort_applications to anon;
create policy "Landing page can submit new applications"
  on public.cohort_applications
  for insert
  to anon
  with check (agreed and status = 'new');

-- A trivial query for the daily keep-alive cron, so a free-plan project is not paused for inactivity.
create function public.keep_alive()
returns integer
language sql
stable
set search_path = ''
as $$ select 1 $$;
revoke all on function public.keep_alive() from public, anon, authenticated;
grant execute on function public.keep_alive() to anon;
