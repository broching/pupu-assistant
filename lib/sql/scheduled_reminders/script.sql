-- ===============================
-- Table: scheduled_reminders
-- ===============================
-- Required env: QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY
-- Run this script in Supabase SQL editor to create the table.
create table if not exists scheduled_reminders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    chat_id bigint not null,
    gmail_message_id text not null,
    message_content text not null,
    status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled')),
    scheduled_at timestamptz not null,
    qstash_message_id text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ===============================
-- Indexes
-- ===============================
create index scheduled_reminders_user_id_idx on scheduled_reminders (user_id);
create index scheduled_reminders_status_idx on scheduled_reminders (status);
create index scheduled_reminders_scheduled_at_idx on scheduled_reminders (scheduled_at);
create index scheduled_reminders_qstash_message_id_idx on scheduled_reminders (qstash_message_id) where qstash_message_id is not null;

-- ===============================
-- Row Level Security
-- ===============================
alter table scheduled_reminders enable row level security;

-- SELECT: users can read their own reminders
create policy "scheduled_reminders_select_own"
on scheduled_reminders
for select
using (auth.uid() = user_id);

-- INSERT: users can insert their own reminders
create policy "scheduled_reminders_insert_own"
on scheduled_reminders
for insert
with check (auth.uid() = user_id);

-- UPDATE: users can update their own reminders
create policy "scheduled_reminders_update_own"
on scheduled_reminders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- DELETE: users can delete their own reminders
create policy "scheduled_reminders_delete_own"
on scheduled_reminders
for delete
using (auth.uid() = user_id);
