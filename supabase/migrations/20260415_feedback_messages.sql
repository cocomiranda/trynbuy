-- Try 'n Buy: feedback messages
-- Run this in the Supabase SQL editor to persist feedback sent from the app.

create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text,
  email text,
  page text,
  message text not null,
  source text not null default 'feedback_widget',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists feedback_messages_user_id_idx
  on public.feedback_messages(user_id);

create index if not exists feedback_messages_created_at_idx
  on public.feedback_messages(created_at desc);

alter table public.feedback_messages enable row level security;

drop policy if exists "Users can view their own feedback messages" on public.feedback_messages;
create policy "Users can view their own feedback messages"
on public.feedback_messages
for select
to authenticated
using (auth.uid() = user_id);

