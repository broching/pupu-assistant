-- ==================================================
--  Table: filters
--  Purpose: Store per-email-connection AI notification rules and user preferences
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

    -- 5️⃣ Category & subcategory weights (0-100)
    -- Financial / Payments
    financial_subscription_renewal INT NOT NULL DEFAULT 100,
    financial_payment_receipt INT NOT NULL DEFAULT 50,
    financial_refund_notice INT NOT NULL DEFAULT 80,
    financial_invoice INT NOT NULL DEFAULT 50,
    financial_failed_payment INT NOT NULL DEFAULT 100,

    -- Marketing / Promotions
    marketing_newsletter INT NOT NULL DEFAULT 50,
    marketing_promotion INT NOT NULL DEFAULT 50,
    marketing_seasonal_campaign INT NOT NULL DEFAULT 50,
    marketing_discount_offer INT NOT NULL DEFAULT 50,
    marketing_product_update INT NOT NULL DEFAULT 50,

    -- Security / Account
    security_alert INT NOT NULL DEFAULT 100,
    security_login_alert INT NOT NULL DEFAULT 100,
    security_mfa_change INT NOT NULL DEFAULT 100,

    -- Deadlines / Important Dates
    deadline_explicit_deadline INT NOT NULL DEFAULT 100,
    deadline_event_invite INT NOT NULL DEFAULT 100,
    deadline_subscription_cutoff INT NOT NULL DEFAULT 80,
    deadline_billing_due_date INT NOT NULL DEFAULT 80,

    -- Operational / Notifications
    operational_system_update INT NOT NULL DEFAULT 50,
    operational_service_outage INT NOT NULL DEFAULT 100,
    operational_delivery_status INT NOT NULL DEFAULT 50,
    operational_support_ticket_update INT NOT NULL DEFAULT 50,

    -- Personal / Social
    personal_direct_message INT NOT NULL DEFAULT 50,
    personal_meeting_request INT NOT NULL DEFAULT 50,
    personal_social_media_notification INT NOT NULL DEFAULT 50,
    personal_event_reminder INT NOT NULL DEFAULT 50,

    -- Miscellaneous / Other
    misc_survey_request INT NOT NULL DEFAULT 50,
    misc_feedback_request INT NOT NULL DEFAULT 50,
    misc_legal_notice INT NOT NULL DEFAULT 100,
    misc_internal_communication INT NOT NULL DEFAULT 50,

    -- 6️⃣ User-defined minimum score threshold (0-100) for sending to Telegram
    min_score_for_telegram INT NOT NULL DEFAULT 50
        CHECK (min_score_for_telegram >= 0 AND min_score_for_telegram <= 100),

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
