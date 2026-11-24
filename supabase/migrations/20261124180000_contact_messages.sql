-- Съобщения от формата „Пиши ни“ на началната страница.
-- Всеки може да пише (anon/authenticated insert), само админ чете и променя.
-- Edge Function contact-notify ги препраща на uniput1000@gmail.com и попълва notified_at.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text check (name is null or char_length(name) <= 80),
  email text not null check (char_length(email) between 5 and 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text not null check (char_length(message) between 10 and 2000),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'new' check (status in ('new','read','answered')),
  notified_at timestamptz
);
alter table public.contact_messages enable row level security;
drop policy if exists "Anyone can send a message" on public.contact_messages;
create policy "Anyone can send a message" on public.contact_messages
  for insert to anon, authenticated
  with check (status = 'new' and notified_at is null and (user_id is null or user_id = auth.uid()));
drop policy if exists "Admins full access" on public.contact_messages;
create policy "Admins full access" on public.contact_messages
  for all to authenticated
  using (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
  with check (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
