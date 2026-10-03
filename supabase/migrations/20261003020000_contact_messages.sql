-- Messages from the Contact page, written by POST /api/contact (src/lib/contact.ts is the source of the limits).
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  contact text not null check (char_length(contact) between 5 and 120),
  message text not null check (char_length(message) between 10 and 1000),
  status text not null default 'new' check (status in ('new', 'replied', 'closed'))
);

comment on table public.contact_messages is 'Messages from the Contact page. Readable only from the dashboard or with the secret key.';

create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

-- The site writes with the publishable key (anon role): insert only. No read, update or delete for anon or authenticated.
alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated;
grant insert on table public.contact_messages to anon;
create policy "Contact page can submit messages"
  on public.contact_messages
  for insert
  to anon
  with check (status = 'new');
