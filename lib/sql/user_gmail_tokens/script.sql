-- Enable UUID generation if not already
create extension if not exists "pgcrypto";

-- Create table
create table if not exists user_gmail_tokens (
    id uuid primary key default gen_random_uuid(),

    -- ❌ REMOVE unique here
    user_id uuid not null references auth.users(id) on delete cascade,

    -- Gmail account identifier
    email_address text not null,

    access_token text not null,
    refresh_token text not null,
    scope text not null,
    token_type text not null,
    expiry_date bigint not null,

    watch_history_id text,
    watch_expiration bigint,

    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    -- ✅ THIS is the critical fix
    constraint user_gmail_unique unique (user_id, email_address)
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

-- Allow users to delete their own tokens
create policy "Allow users to delete their own Gmail"
    on user_gmail_tokens
    for delete
    using (auth.uid() = user_id)