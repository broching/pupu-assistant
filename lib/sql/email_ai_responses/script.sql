-- ===============================
-- Extensions
-- ===============================
create extension if not exists "pgcrypto";

-- ===============================
-- Table: email_ai_responses
-- ===============================
create table email_ai_responses (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id) on delete cascade,

    message_id text not null, -- Gmail message ID

    -- NEW: lifecycle status
    message_status text not null
        check (message_status in ('processing', 'completed', 'failed'))
        default 'processing',

    -- Now nullable because we insert BEFORE AI runs
    reply_message text,

    message_score int
        check (message_score between 0 and 100),

    flagged_keywords text[],
    usage_tokens jsonb,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ===============================
-- Constraints & Indexes
-- ===============================

-- CRITICAL: atomic dedupe key
create unique index email_ai_responses_user_message_unique
on email_ai_responses (user_id, message_id);

-- Optional: speed up polling / cleanup
create index email_ai_responses_user_status_idx
on email_ai_responses (user_id, message_status);

create index email_ai_responses_user_created_at_idx
on email_ai_responses (user_id, created_at desc);

-- ===============================
-- Row Level Security
-- ===============================
alter table email_ai_responses enable row level security;

-- ===============================
-- RLS Policies
-- ===============================

create policy "email_ai_responses_select_own"
on email_ai_responses
for select
using (auth.uid() = user_id);

create policy "email_ai_responses_insert_own"
on email_ai_responses
for insert
with check (auth.uid() = user_id);

create policy "email_ai_responses_update_own"
on email_ai_responses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "email_ai_responses_delete_own"
on email_ai_responses
for delete
using (auth.uid() = user_id);
