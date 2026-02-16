-- ================================
-- Users table
-- ================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    email TEXT UNIQUE,
    name TEXT,
    phone_number TEXT,
    subscription TEXT,
    tour BOOLEAN
);

-- ================================
-- Enable Row Level Security
-- ================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ================================
-- RLS Policies
-- ================================

-- Users can read their own profile
CREATE POLICY "Users can select own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own profile (used after OAuth signup)
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);