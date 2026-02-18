/* ----------------------- */
/* Categories / Subcategories with explanations */
export const CATEGORIES = [
    {
        name: "Financial / Payments",
        subcategories: [
            {
                key: "financial_subscription_renewal",
                label: "Subscription Renewal",
                explanation:
                    "Notifies when recurring subscriptions are renewed (e.g., Spotify, Netflix, Apple Music)."
            },
            {
                key: "financial_payment_receipt",
                label: "Payment Receipt",
                explanation:
                    "Notifies on payment receipts (e.g., PayNow, GrabPay, supermarket or utility payments)."
            },
            {
                key: "financial_refund_notice",
                label: "Refund Notice",
                explanation:
                    "Notifies if a refund is processed or initiated (e.g., online shopping refunds, app store refunds)."
            },
            {
                key: "financial_invoice",
                label: "Invoice",
                explanation:
                    "Notifies when an invoice or billing statement is sent (e.g., electricity, water, subscription invoices)."
            },
            {
                key: "financial_failed_payment",
                label: "Failed Payment",
                explanation:
                    "Notifies if a payment fails or is rejected (e.g., credit card declined, subscription renewal failed)."
            }
        ]
    },
    {
        name: "Work / Professional",
        subcategories: [
            {
                key: "work_direct_message",
                label: "Direct Message",
                explanation:
                    "Work-related direct messages."
            },
            {
                key: "work_task_assigned",
                label: "Task Assigned",
                explanation:
                    "Notifications when a work task is assigned to you."
            },
            {
                key: "work_deadline_or_approval",
                label: "Deadline / Approval",
                explanation:
                    "Emails regarding deadlines or approvals needed."
            },
            {
                key: "work_client_communication",
                label: "Client Communication",
                explanation:
                    "Work emails from clients or external partners."
            },
            {
                key: "work_meeting_request",
                label: "Meeting Request",
                explanation:
                    "Requests to attend work meetings."
            },
            {
                key: "work_document_shared",
                label: "Document Shared",
                explanation:
                    "Notifications when a document is shared with you."
            },
            {
                key: "work_hr_or_management_notice",
                label: "HR / Management Notice",
                explanation:
                    "Internal communications from HR or management."
            },
            {
                key: "work_system_or_access_issue",
                label: "System / Access Issue",
                explanation:
                    "Alerts regarding system downtime or access problems."
            }
        ]
    },
    {
        name: "Security / Account",
        subcategories: [
            {
                key: "security_alert",
                label: "Security Alert",
                explanation:
                    "Critical security-related alerts (e.g., phishing warnings, account breaches, suspicious activity)."
            },
            {
                key: "security_login_alert",
                label: "Login Alert",
                explanation:
                    "Notifications about new logins or device activity (e.g., login from new device or location)."
            },
            {
                key: "security_mfa_change",
                label: "MFA / Authentication Change",
                explanation:
                    "Changes to two-factor authentication or account security settings."
            },
            {
                key: "security_password_change",
                label: "Password Change",
                explanation:
                    "Password reset confirmations or password change notifications."
            },
            {
                key: "security_suspicious_activity",
                label: "Suspicious Activity",
                explanation:
                    "Notifications for unusual account activity."
            },
            {
                key: "security_account_locked",
                label: "Account Locked",
                explanation:
                    "Alerts when an account is temporarily locked due to failed login attempts or security reasons."
            },
            {
                key: "security_data_breach_notice",
                label: "Data Breach Notice",
                explanation:
                    "Notifies users about data breaches affecting their accounts."
            },
            {
                key: "security_permission_change",
                label: "Permission Change",
                explanation:
                    "Notifies users when account permissions or roles are changed."
            },
            {
                key: "security_recovery_email_change",
                label: "Recovery Email Change",
                explanation:
                    "Alerts when the recovery email for an account is updated."
            },
            {
                key: "security_billing_fraud_alert",
                label: "Billing / Fraud Alert",
                explanation:
                    "Notifies users of potentially fraudulent billing activity."
            }
        ]
    },

    {
        name: "Deadlines / Important Dates",
        subcategories: [
            {
                key: "deadline_explicit_deadline",
                label: "Explicit Deadline",
                explanation:
                    "Emails with clear deadlines or due dates (e.g., submission deadlines, compliance deadlines)."
            },
            {
                key: "deadline_event_invite",
                label: "Event Invite",
                explanation:
                    "Invitations for meetings or events (e.g., calendar invites, webinar invites)."
            },
            {
                key: "deadline_subscription_cutoff",
                label: "Subscription Cutoff",
                explanation:
                    "Subscription expiration or trial ending reminders."
            },
            {
                key: "deadline_billing_due_date",
                label: "Billing Due Date",
                explanation:
                    "Payment due date notifications (e.g., credit card due, utility bill due)."
            }
        ]
    },
        {
        name: "Legal / Compliance",
        subcategories: [
            {
                key: "legal_contract_sent",
                label: "Contract Sent",
                explanation:
                    "Notifications when a contract is sent to you."
            },
            {
                key: "legal_contract_signed",
                label: "Contract Signed",
                explanation:
                    "Notifications when a contract has been signed."
            },
            {
                key: "legal_terms_update",
                label: "Terms Update",
                explanation:
                    "Updates to terms of service, privacy policies, or agreements."
            },
            {
                key: "legal_regulatory_notice",
                label: "Regulatory Notice",
                explanation:
                    "Compliance or regulatory notifications requiring attention."
            },
            {
                key: "legal_government_notice",
                label: "Government Notice",
                explanation:
                    "Official communications from government agencies."
            },
            {
                key: "legal_tax_notice",
                label: "Tax Notice",
                explanation:
                    "Tax-related notifications."
            },
            {
                key: "legal_court_notice",
                label: "Court Notice",
                explanation:
                    "Notifications from courts regarding legal proceedings."
            },
            {
                key: "legal_compliance_requirement",
                label: "Compliance Requirement",
                explanation:
                    "Mandatory compliance or legal requirements to be addressed."
            }
        ]
    },
    {
        name: "Marketing / Promotions",
        subcategories: [
            {
                key: "marketing_newsletter",
                label: "Newsletter",
                explanation:
                    "General newsletters from companies (e.g., company updates, weekly newsletters)."
            },
            {
                key: "marketing_promotion",
                label: "Promotion",
                explanation:
                    "Promotional offers, discounts, and campaigns (e.g., sales, store promotions)."
            },
            {
                key: "marketing_seasonal_campaign",
                label: "Seasonal Campaign",
                explanation:
                    "Seasonal or holiday-specific campaigns (e.g., Christmas sale, New Year offers)."
            },
            {
                key: "marketing_discount_offer",
                label: "Discount Offer",
                explanation:
                    "Special discount or coupon emails (e.g., 10% off voucher codes)."
            },
            {
                key: "marketing_product_update",
                label: "Product Update",
                explanation:
                    "Announcements about new product features (e.g., app version updates, feature launches)."
            }
        ]
    },
    {
        name: "Personal / Social",
        subcategories: [
            {
                key: "personal_family_related",
                label: "Family Related",
                explanation:
                    "Emails related to family matters."
            },
            {
                key: "personal_medical_appointment",
                label: "Medical Appointment",
                explanation:
                    "Reminders or confirmations for medical appointments."
            },
            {
                key: "personal_travel_booking",
                label: "Travel Booking",
                explanation:
                    "Booking confirmations for trips or vacations."
            },
            {
                key: "personal_flight_or_trip_update",
                label: "Flight / Trip Update",
                explanation:
                    "Updates about flights or trips you have booked."
            },
            {
                key: "personal_delivery_update",
                label: "Delivery Update",
                explanation:
                    "Tracking updates for parcels and deliveries."
            },
            {
                key: "personal_event_invite",
                label: "Event Invite",
                explanation:
                    "Invitations for personal events."
            },
            {
                key: "personal_social_notification",
                label: "Social Notification",
                explanation:
                    "Alerts from social media platforms."
            }
        ]
    },

];
