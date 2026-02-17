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

// Filter configuration
export type FilterConfig = {
  // General settings
  filter_name: string;
  notification_mode: "minimal" | "balanced" | "aggressive";
  watch_tags: string[];
  ignore_tags: string[];
  min_score_for_telegram: number;

  // AI category weights (0-100)
  // Financial / Payments
  financial_subscription_renewal: number;
  financial_payment_receipt: number;
  financial_refund_notice: number;
  financial_invoice: number;
  financial_failed_payment: number;

  // Marketing / Promotions
  marketing_newsletter: number;
  marketing_promotion: number;
  marketing_seasonal_campaign: number;
  marketing_discount_offer: number;
  marketing_product_update: number;

  // Security / Account
  security_alert: number;
  security_login_alert: number;
  security_mfa_change: number;

  // Deadlines / Important Dates
  deadline_explicit_deadline: number;
  deadline_event_invite: number;
  deadline_subscription_cutoff: number;
  deadline_billing_due_date: number;

  // Operational / Notifications
  operational_system_update: number;
  operational_service_outage: number;
  operational_delivery_status: number;
  operational_support_ticket_update: number;

  // Personal / Social
  personal_direct_message: number;
  personal_meeting_request: number;
  personal_social_media_notification: number;
  personal_event_reminder: number;

  // Miscellaneous / Other
  misc_survey_request: number;
  misc_feedback_request: number;
  misc_legal_notice: number;
  misc_internal_communication: number;
};


export type CategoriesObject = {
  primary: {
    category: string;            // top-level category, e.g., "financial"
    subcategory: string[];       // subcategories contributing the most
  };
  secondary: Array<{
    category: string;
    subcategory: string[];
  }>;
};

export const defaultFilter = {
  filter_name: "Default filter",
  notification_mode: "balanced",
  watch_tags: [
    "invoice",
    "payment",
    "subscription",
    "receipt",
    "approval",
    "deadline",
    "contract",
    "meeting",
    "security",
    "verification",
    "promotion",
    "deal",
  ],
  ignore_tags: [],

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
