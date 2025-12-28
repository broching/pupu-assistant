-- 1. Create table
create table number_preferences (
  id UUID primary key default gen_random_uuid(),
  user_id UUID not null,
  mode text check (mode in ('block', 'allow')) not null,
  phone_number text not null,
  created_at timestamptz default now()
);

-- 2. Prevent duplicate entries per user/mode/number
alter table number_preferences 
  add constraint unique_user_mode_number unique(user_id, mode, phone_number);

-- 3. Enable Row-Level Security
alter table number_preferences enable row level security;

-- 4. RLS Policies

-- Users can only see their own preferences
create policy "Users can view their own number preferences"
on number_preferences
for select
using (auth.uid() = user_id);

-- Users can only insert their own preferences
create policy "Users can insert their own number preferences"
on number_preferences
for insert
with check (auth.uid() = user_id);

-- Users can update only their own preferences
create policy "Users can update their own number preferences"
on number_preferences
for update
using (auth.uid() = user_id);

-- Users can delete only their own preferences
create policy "Users can delete their own number preferences"
on number_preferences
for delete
using (auth.uid() = user_id);
