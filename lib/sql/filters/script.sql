-- ==================================================
--  Table: filters
--  Purpose: Store per-email-connection AI notification rules
-- ==================================================

-- 1️⃣ Create table
CREATE TABLE IF NOT EXISTS filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership & scope
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filter_name TEXT NOT NULL,

    -- 2️⃣ Notification frequency
    notification_mode TEXT NOT NULL DEFAULT 'balanced'
        CHECK (notification_mode IN ('minimal', 'balanced', 'aggressive')),

    -- 3️⃣ AI tag signals
    watch_tags TEXT[] NOT NULL DEFAULT '{}',
    ignore_tags TEXT[] NOT NULL DEFAULT '{}',

    -- 4️⃣ Boolean behavior flags
    enable_first_time_sender_alert BOOLEAN NOT NULL DEFAULT TRUE,
    enable_thread_reply_alert BOOLEAN NOT NULL DEFAULT TRUE,
    enable_deadline_alert BOOLEAN NOT NULL DEFAULT TRUE,
    enable_subscription_payment_alert BOOLEAN NOT NULL DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 2️⃣ Enable Row-Level Security (RLS)
-- ==================================================
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;

-- Policy: users can fully manage their own filters
CREATE POLICY "Users manage their own filters"
ON filters
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ==================================================
-- 3️⃣ Trigger: auto-update updated_at on row update
-- ==================================================
CREATE OR REPLACE FUNCTION set_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER filters_updated_at
BEFORE UPDATE ON filters
FOR EACH ROW
EXECUTE FUNCTION set_filters_updated_at();
