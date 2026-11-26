-- 14-day free trial sign-ups, written through the function start_trial by POST /api/trial.
-- Nothing here is readable by the site's key: the function returns only the end date of the trial for the email it was given.
-- To extend or unlock someone (for example after they pay), edit access_until in the dashboard. They re-enter their email on /trial.
create table public.trial_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 120),
  handle text not null check (handle ~ '^@[A-Za-z0-9._-]{1,30}$'),
  access_until timestamptz not null default now() + interval '14 days'
);

comment on table public.trial_signups is 'Free trial sign-ups from /trial. Readable only from the dashboard or with the secret key. Edit access_until to extend a trial.';

-- One trial per email, however it is capitalised.
create unique index trial_signups_email_key on public.trial_signups (lower(email));
create index trial_signups_created_at_idx on public.trial_signups (created_at desc);

-- No access for the site's key (anon) or signed-in users: everything goes through start_trial below.
alter table public.trial_signups enable row level security;
revoke all on table public.trial_signups from anon, authenticated;

-- Starts a trial for a new email, or returns the end date of the one that email already has (so clearing cookies never restarts the clock).
create function public.start_trial(p_name text, p_email text, p_handle text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  started timestamptz;
  existing timestamptz;
begin
  insert into public.trial_signups (name, email, handle)
  values (p_name, p_email, p_handle)
  on conflict ((lower(email))) do nothing
  returning access_until into started;

  if started is not null then
    return jsonb_build_object('access_until', started, 'is_new', true);
  end if;

  select t.access_until into existing from public.trial_signups t where lower(t.email) = lower(p_email);
  return jsonb_build_object('access_until', existing, 'is_new', false);
end;
$$;
revoke all on function public.start_trial(text, text, text) from public, anon, authenticated;
grant execute on function public.start_trial(text, text, text) to anon;
