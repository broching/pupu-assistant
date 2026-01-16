-- ===============================
-- Extensions
-- ===============================
create extension if not exists "pgcrypto";

-- ===============================
-- Table: email_ai_responses
-- ===============================
create table email_ai_responses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    message_id text not null,              -- Gmail message ID
    reply_message text not null,
    message_score int not null check (message_score between 0 and 100),
    flagged_keywords text[],
    usage_tokens jsonb,
    created_at timestamptz default now()
);

-- ===============================
-- Constraints & Indexes
-- ===============================

-- Prevent duplicate processing per user + message
create unique index email_ai_responses_user_message_unique
on email_ai_responses (user_id, message_id);

-- Optional performance index
create index email_ai_responses_user_created_at_idx
on email_ai_responses (user_id, created_at desc);

-- ===============================
-- Row Level Security
-- ===============================
alter table email_ai_responses enable row level security;

-- ===============================
-- RLS Policies (CRUD)
-- ===============================

-- SELECT: users can read their own responses
create policy "email_ai_responses_select_own"
on email_ai_responses
for select
using (auth.uid() = user_id);

-- INSERT: users can insert only their own responses
create policy "email_ai_responses_insert_own"
on email_ai_responses
for insert
with check (auth.uid() = user_id);

-- UPDATE: users can update only their own responses
create policy "email_ai_responses_update_own"
on email_ai_responses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- DELETE: users can delete only their own responses
create policy "email_ai_responses_delete_own"
on email_ai_responses
for delete
using (auth.uid() = user_id);
