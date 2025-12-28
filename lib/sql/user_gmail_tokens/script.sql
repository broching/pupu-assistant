-- Enable UUID generation if not already
create extension if not exists "pgcrypto";

-- Create table
create table if not exists user_gmail_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade unique, -- UNIQUE for upsert
    access_token text not null,
    refresh_token text not null,
    scope text not null,
    token_type text not null,
    expiry_date bigint not null,
    watch_history_id text,          -- store Gmail historyId
    watch_expiration bigint,        -- store Gmail watch expiration timestamp
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table user_gmail_tokens enable row level security;

-- Allow users to select their own tokens
create policy "Select own tokens"
    on user_gmail_tokens
    for select
    using (auth.uid() = user_id);

-- Allow users to insert their own tokens
create policy "Insert own tokens"
    on user_gmail_tokens
    for insert
    with check (auth.uid() = user_id);

-- Allow users to update their own tokens
create policy "Update own tokens"
    on user_gmail_tokens
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Optional: prevent users from deleting tokens
create policy "Prevent delete by users"
    on user_gmail_tokens
    for delete
    using (false);
