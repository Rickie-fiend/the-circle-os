-- Public, curated reading material only. Personal evidence stays in its existing stores.
begin;
create table public.circle_quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (length(btrim(text)) between 1 and 320),
  author text not null default '' check (length(author) <= 320),
  created_at timestamptz not null default now()
);
alter table public.circle_quotes enable row level security;
revoke all on public.circle_quotes from public, anon, authenticated, service_role;
grant select on public.circle_quotes to anon, authenticated;
grant select, insert, delete on public.circle_quotes to service_role;
create policy "Public quote reading" on public.circle_quotes for select to anon, authenticated using (true);
-- No user mutation policies. Only the protected server Admin route uses a secret key.
commit;
