-- ===============================
-- Table: pending_custom_reminders
-- ===============================
-- One row per chat while user is choosing a custom date.
create table if not exists pending_custom_reminders (
    chat_id bigint primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    gmail_message_id text not null,
    created_at timestamptz default now()
);

create index pending_custom_reminders_created_at_idx on pending_custom_reminders (created_at);

alter table pending_custom_reminders enable row level security;

create policy "pending_custom_reminders_service_role"
on pending_custom_reminders
for all
using (true)
with check (true);
