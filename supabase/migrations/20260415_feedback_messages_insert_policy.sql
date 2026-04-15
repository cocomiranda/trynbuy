-- Try 'n Buy: allow authenticated users to create their own feedback messages

drop policy if exists "Users can insert their own feedback messages" on public.feedback_messages;
create policy "Users can insert their own feedback messages"
on public.feedback_messages
for insert
to authenticated
with check (auth.uid() = user_id);

