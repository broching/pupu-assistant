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
    };
    usageTokens: any;
};

// Filter configuration
export type FilterConfig = {
    notification_mode: "minimal" | "balanced" | "aggressive";
    watch_tags: string[];
    ignore_tags: string[];
    enable_first_time_sender_alert: boolean;
    enable_deadline_alert: boolean;
};
