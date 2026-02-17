-- ==================================================
--  Table: filters
--  Purpose: Store per-email-connection AI notification rules and user preferences
-- ==================================================

CREATE TABLE IF NOT EXISTS filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership & scope
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_connection_id UUID NOT NULL,

    -- ==================================================
    -- Main Category Toggles
    -- If FALSE → ignore entire category during scoring
    -- ==================================================
    toggle_financial BOOLEAN NOT NULL DEFAULT TRUE,
    toggle_marketing BOOLEAN NOT NULL DEFAULT TRUE,
    toggle_security BOOLEAN NOT NULL DEFAULT TRUE,
    toggle_deadline BOOLEAN NOT NULL DEFAULT TRUE,
    toggle_operational BOOLEAN NOT NULL DEFAULT TRUE,
    toggle_personal BOOLEAN NOT NULL DEFAULT TRUE,
    toggle_misc BOOLEAN NOT NULL DEFAULT TRUE,
    toggle_custom BOOLEAN NOT NULL DEFAULT TRUE,

    -- ==================================================
    -- Category & subcategory weights (0-100)
    -- ==================================================

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

    -- ==================================================
    -- Custom User Categories (dynamic key-value pairs)
    -- Example:
    -- { "birthday": 80, "message_from_mom": 100 }
    -- ==================================================
    custom_categories JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT custom_categories_values_check CHECK (
        jsonb_typeof(custom_categories) = 'object'
    ),

    -- ==================================================
    -- User-defined minimum score threshold (0-100)
    -- ==================================================
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
