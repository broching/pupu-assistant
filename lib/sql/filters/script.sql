create table public.filters (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  email_connection_id uuid not null,

  -- Category Toggles
  toggle_financial boolean not null default true,
  toggle_marketing boolean not null default true,
  toggle_security boolean not null default true,
  toggle_deadline boolean not null default true,
  toggle_work boolean not null default true,
  toggle_personal boolean not null default true,
  toggle_legal boolean not null default true,
  toggle_custom boolean not null default true,

  -- =========================
  -- Financial
  -- =========================
  financial_subscription_renewal integer not null default 100,
  financial_payment_receipt integer not null default 50,
  financial_refund_notice integer not null default 80,
  financial_invoice integer not null default 50,
  financial_failed_payment integer not null default 100,

  -- =========================
  -- Marketing
  -- =========================
  marketing_newsletter integer not null default 50,
  marketing_promotion integer not null default 50,
  marketing_seasonal_campaign integer not null default 50,
  marketing_discount_offer integer not null default 50,
  marketing_product_update integer not null default 50,

  -- =========================
  -- Security (Expanded)
  -- =========================
  security_alert integer not null default 100,
  security_login_alert integer not null default 100,
  security_mfa_change integer not null default 100,
  security_password_change integer not null default 100,
  security_suspicious_activity integer not null default 100,
  security_account_locked integer not null default 100,
  security_data_breach_notice integer not null default 100,
  security_permission_change integer not null default 100,
  security_recovery_email_change integer not null default 100,
  security_billing_fraud_alert integer not null default 100,

  -- =========================
  -- Deadline
  -- =========================
  deadline_explicit_deadline integer not null default 100,
  deadline_event_invite integer not null default 100,
  deadline_subscription_cutoff integer not null default 80,
  deadline_billing_due_date integer not null default 80,

  -- =========================
  -- Work
  -- =========================
  work_direct_message integer not null default 70,
  work_task_assigned integer not null default 90,
  work_deadline_or_approval integer not null default 100,
  work_client_communication integer not null default 90,
  work_meeting_request integer not null default 80,
  work_document_shared integer not null default 60,
  work_hr_or_management_notice integer not null default 80,
  work_system_or_access_issue integer not null default 100,

  -- =========================
  -- Personal
  -- =========================
  personal_family_related integer not null default 80,
  personal_medical_appointment integer not null default 100,
  personal_travel_booking integer not null default 90,
  personal_flight_or_trip_update integer not null default 100,
  personal_delivery_update integer not null default 70,
  personal_event_invite integer not null default 60,
  personal_social_notification integer not null default 40,

  -- =========================
  -- Legal & Government (Replaces Misc)
  -- =========================
  legal_contract_sent integer not null default 100,
  legal_contract_signed integer not null default 100,
  legal_terms_update integer not null default 80,
  legal_regulatory_notice integer not null default 100,
  legal_government_notice integer not null default 100,
  legal_tax_notice integer not null default 100,
  legal_court_notice integer not null default 100,
  legal_compliance_requirement integer not null default 100,

  -- =========================
  -- Custom Categories
  -- =========================
  custom_categories jsonb not null default '{}'::jsonb,

  -- Telegram Threshold
  min_score_for_telegram integer not null default 50,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint filters_pkey primary key (id),

  constraint filters_user_id_fkey 
    foreign key (user_id) 
    references auth.users (id) 
    on delete cascade,

  constraint custom_categories_values_check 
    check (jsonb_typeof(custom_categories) = 'object'),

  constraint filters_min_score_for_telegram_check 
    check (min_score_for_telegram >= 0 and min_score_for_telegram <= 100)
) tablespace pg_default;


create trigger filters_updated_at
before update on filters
for each row
execute function set_filters_updated_at ();

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

