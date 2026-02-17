/* ----------------------- */
/* Categories / Subcategories with explanations */
export const CATEGORIES = [
    {
        name: "Financial / Payments",
        subcategories: [
            {
                key: "financial_subscription_renewal",
                label: "Subscription Renewal",
                explanation: "Notifies when recurring subscriptions are renewed (e.g., Spotify, Netflix, Apple Music)."
            },
            {
                key: "financial_payment_receipt",
                label: "Payment Receipt",
                explanation: "Notifies on payment receipts, e.g., PayNow, GrabPay, supermarket or utility payments."
            },
            {
                key: "financial_refund_notice",
                label: "Refund Notice",
                explanation: "Notifies if a refund is processed or initiated (e.g., online shopping refunds, app store refunds)."
            },
            {
                key: "financial_invoice",
                label: "Invoice",
                explanation: "Notifies when an invoice or billing statement is sent (e.g., electricity, water, subscription invoices)."
            },
            {
                key: "financial_failed_payment",
                label: "Failed Payment",
                explanation: "Notifies if a payment fails or is rejected (e.g., credit card payment failed, subscription renewal failed)."
            }
        ]
    },
    {
        name: "Marketing / Promotions",
        subcategories: [
            {
                key: "marketing_newsletter",
                label: "Newsletter",
                explanation: "General newsletters from companies (e.g., company updates, weekly newsletters)."
            },
            {
                key: "marketing_promotion",
                label: "Promotion",
                explanation: "Promotional offers, discounts, campaigns (e.g., Black Friday sale, online store promotions)."
            },
            {
                key: "marketing_seasonal_campaign",
                label: "Seasonal Campaign",
                explanation: "Seasonal or holiday-specific campaigns (e.g., Christmas sale, New Year offers)."
            },
            {
                key: "marketing_discount_offer",
                label: "Discount Offer",
                explanation: "Special discount or coupon emails (e.g., 10% off coupon, voucher codes)."
            },
            {
                key: "marketing_product_update",
                label: "Product Update",
                explanation: "Announcements about new product features (e.g., app version updates, feature announcements)."
            }
        ]
    },
    {
        name: "Security / Account",
        subcategories: [
            {
                key: "security_alert",
                label: "Security Alert",
                explanation: "Any security-related alerts (e.g., phishing warnings, account breaches, password leaks)."
            },
            {
                key: "security_login_alert",
                label: "Login Alert",
                explanation: "Notifications about new logins or device activity (e.g., login from a new device or location)."
            },
            {
                key: "security_mfa_change",
                label: "MFA / Auth Change",
                explanation: "Changes to 2FA or authentication methods (e.g., enabling/disabling two-factor authentication)."
            }
        ]
    },
    {
        name: "Deadlines / Important Dates",
        subcategories: [
            {
                key: "deadline_explicit_deadline",
                label: "Explicit Deadline",
                explanation: "Emails with clear deadlines or due dates (e.g., assignment due date, project submission reminder)."
            },
            {
                key: "deadline_event_invite",
                label: "Event Invite",
                explanation: "Invitations for meetings or events (e.g., calendar invites, webinar invites)."
            },
            {
                key: "deadline_subscription_cutoff",
                label: "Subscription Cutoff",
                explanation: "Subscription expiration reminders (e.g., trial ending, membership renewal)."
            },
            {
                key: "deadline_billing_due_date",
                label: "Billing Due Date",
                explanation: "Payment due date notifications (e.g., credit card due, utility bill due)."
            }
        ]
    },
    {
        name: "Operational / Notifications",
        subcategories: [
            {
                key: "operational_system_update",
                label: "System Update",
                explanation: "System updates or maintenance notifications (e.g., app or platform downtime notices)."
            },
            {
                key: "operational_service_outage",
                label: "Service Outage",
                explanation: "Downtime alerts or service disruptions (e.g., network outage, server maintenance)."
            },
            {
                key: "operational_delivery_status",
                label: "Delivery Status",
                explanation: "Shipment or delivery tracking emails (e.g., parcel shipped, out-for-delivery updates)."
            },
            {
                key: "operational_support_ticket_update",
                label: "Support Ticket Update",
                explanation: "Updates on support tickets (e.g., ticket resolved, agent reply)."
            }
        ]
    },
    {
        name: "Personal / Social",
        subcategories: [
            {
                key: "personal_direct_message",
                label: "Direct Message",
                explanation: "Personal messages from other users (e.g., messages from friends or colleagues)."
            },
            {
                key: "personal_meeting_request",
                label: "Meeting Request",
                explanation: "Calendar invites or meeting requests (e.g., team meetings, client calls)."
            },
            {
                key: "personal_social_media_notification",
                label: "Social Media Notification",
                explanation: "Updates from social platforms (e.g., likes, comments, mentions)."
            },
            {
                key: "personal_event_reminder",
                label: "Event Reminder",
                explanation: "Reminders for personal events (e.g., birthdays, appointments)."
            }
        ]
    },
    {
        name: "Miscellaneous / Other",
        subcategories: [
            {
                key: "misc_survey_request",
                label: "Survey Request",
                explanation: "Requests to complete surveys (e.g., customer feedback, market research surveys)."
            },
            {
                key: "misc_feedback_request",
                label: "Feedback Request",
                explanation: "Requests for user feedback (e.g., product reviews, service feedback)."
            },
            {
                key: "misc_legal_notice",
                label: "Legal Notice",
                explanation: "Important legal or compliance notifications (e.g., terms of service updates, compliance emails)."
            },
            {
                key: "misc_internal_communication",
                label: "Internal Communication",
                explanation: "Internal emails from your organization (e.g., HR announcements, team updates)."
            }
        ]
    }
];