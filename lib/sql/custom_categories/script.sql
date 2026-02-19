-- =========================================
-- 1️⃣ Create custom_categories table
-- =========================================

create table public.custom_categories (
    id uuid primary key default gen_random_uuid(),

    -- Ownership
    user_id uuid not null references auth.users(id) on delete cascade,

    -- Relations
    filter_id uuid not null references public.filters(id) on delete cascade,
    connection_id uuid not null references public.user_gmail_tokens(id) on delete cascade,

    -- AI Generated Fields
    user_facing_category text not null,
    category text not null,
    description text not null,
    weight integer not null default 70,  -- NEW FIELD

    -- Metadata
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- =========================================
-- 2️⃣ Indexes (performance)
-- =========================================

create index idx_custom_categories_user_id
on public.custom_categories(user_id);

create index idx_custom_categories_filter_id
on public.custom_categories(filter_id);

create index idx_custom_categories_connection_id
on public.custom_categories(connection_id);

create index idx_custom_categories_category
on public.custom_categories(category);

-- =========================================
-- 3️⃣ Enable Row Level Security
-- =========================================

alter table public.custom_categories
enable row level security;

-- =========================================
-- 4️⃣ RLS Policies
-- =========================================

-- SELECT: Users can only view their own categories
create policy "Users can view their own custom categories"
on public.custom_categories
for select
using (auth.uid() = user_id);

-- INSERT: Users can only insert for themselves
create policy "Users can insert their own custom categories"
on public.custom_categories
for insert
with check (auth.uid() = user_id);

-- UPDATE: Users can update only their own categories
create policy "Users can update their own custom categories"
on public.custom_categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- DELETE: Users can delete only their own categories
create policy "Users can delete their own custom categories"
on public.custom_categories
for delete
using (auth.uid() = user_id);

-- =========================================
-- 5️⃣ Auto-update updated_at trigger
-- =========================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_custom_categories_updated_at
before update on public.custom_categories
for each row
execute function public.set_updated_at();
