create table if not exists user_telegram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  telegram_chat_id bigint not null unique,
  telegram_username text,
  created_at timestamp with time zone default now()
);

alter table user_telegram_connections enable row level security;

-- Users can read their own connection
create policy "Select own telegram connection"
on user_telegram_connections
for select
using (auth.uid() = user_id);

-- Allow users to delete their own row
create policy "Delete own telegram connection"
on user_telegram_connections
for delete
using (auth.uid() = user_id);


-- Service role only for insert/update (recommended)
