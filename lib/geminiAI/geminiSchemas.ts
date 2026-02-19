// Calendar event object
export type CalendarEvent = {
  summary?: string | null;       // optional, can be null
  location?: string | null;      // optional, can be null
  description?: string | null;   // optional, can be null
  start: string;                 // REQUIRED, ISO 8601 string, cannot be null
  end: string;                   // REQUIRED, ISO 8601 string, cannot be null
};

// Existing email analysis result
export type EmailAnalysisResult = {
  emailAnalysis: {
    messageScore: number;
    keywordsFlagged: string[];
    replyMessage: string;
    datelineDate: string;
    calendarEvent: CalendarEvent | null;  // optional, can add if email triggers an event
    categories: CategoriesObject
  };
  usageTokens: any;
};

export type CustomCategoryResult = {
  user_facing_category: string;
  category: string;
  description: string;
}

// Filter configuration
export type FilterConfig = {
  // =========================
  // General Settings
  // =========================
  filter_name: string;
  min_score_for_telegram: number;

  // =========================
  // Financial
  // =========================
  financial_subscription_renewal: number;
  financial_payment_receipt: number;
  financial_refund_notice: number;
  financial_invoice: number;
  financial_failed_payment: number;

  // =========================
  // Marketing
  // =========================
  marketing_newsletter: number;
  marketing_promotion: number;
  marketing_seasonal_campaign: number;
  marketing_discount_offer: number;
  marketing_product_update: number;

  // =========================
  // Security (Expanded)
  // =========================
  security_alert: number;
  security_login_alert: number;
  security_mfa_change: number;
  security_password_change: number;
  security_suspicious_activity: number;
  security_account_locked: number;
  security_data_breach_notice: number;
  security_permission_change: number;
  security_recovery_email_change: number;
  security_billing_fraud_alert: number;

  // =========================
  // Deadline
  // =========================
  deadline_explicit_deadline: number;
  deadline_event_invite: number;
  deadline_subscription_cutoff: number;
  deadline_billing_due_date: number;

  // =========================
  // Work
  // =========================
  work_direct_message: number;
  work_task_assigned: number;
  work_deadline_or_approval: number;
  work_client_communication: number;
  work_meeting_request: number;
  work_document_shared: number;
  work_hr_or_management_notice: number;
  work_system_or_access_issue: number;

  // =========================
  // Personal (Redesigned)
  // =========================
  personal_family_related: number;
  personal_medical_appointment: number;
  personal_travel_booking: number;
  personal_flight_or_trip_update: number;
  personal_delivery_update: number;
  personal_event_invite: number;
  personal_social_notification: number;

  // =========================
  // Legal & Government
  // =========================
  legal_contract_sent: number;
  legal_contract_signed: number;
  legal_terms_update: number;
  legal_regulatory_notice: number;
  legal_government_notice: number;
  legal_tax_notice: number;
  legal_court_notice: number;
  legal_compliance_requirement: number;

  // =========================
  // Boolean Toggles
  // =========================
  toggle_financial: boolean;
  toggle_marketing: boolean;
  toggle_security: boolean;
  toggle_deadline: boolean;
  toggle_work: boolean;
  toggle_personal: boolean;
  toggle_legal: boolean;
  toggle_custom: boolean;

  // =========================
  // Custom Categories
  // =========================
  custom_categories: Record<string, number>;
};


export type CategoriesObject = {
  primary: string[];     // list of subcategory keys contributing most
  secondary: string[];   // list of other relevant subcategory keys
};


export const defaultFilter = {
  filter_name: "Default filter",

  // Financial / Payments
  financial_subscription_renewal: 100,
  financial_payment_receipt: 50,
  financial_refund_notice: 80,
  financial_invoice: 50,
  financial_failed_payment: 100,

  // Marketing / Promotions
  marketing_newsletter: 50,
  marketing_promotion: 50,
  marketing_seasonal_campaign: 50,
  marketing_discount_offer: 50,
  marketing_product_update: 50,

  // Security / Account
  security_alert: 100,
  security_login_alert: 100,
  security_mfa_change: 100,

  // Deadlines / Important Dates
  deadline_explicit_deadline: 100,
  deadline_event_invite: 100,
  deadline_subscription_cutoff: 80,
  deadline_billing_due_date: 80,

  // Operational / Notifications
  operational_system_update: 50,
  operational_service_outage: 100,
  operational_delivery_status: 50,
  operational_support_ticket_update: 50,

  // Personal / Social
  personal_direct_message: 50,
  personal_meeting_request: 50,
  personal_social_media_notification: 50,
  personal_event_reminder: 50,

  // Miscellaneous / Other
  misc_survey_request: 50,
  misc_feedback_request: 50,
  misc_legal_notice: 100,
  misc_internal_communication: 50,

  // Telegram threshold
  min_score_for_telegram: 50,
};
