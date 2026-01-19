export type EmailAnalysisResult = {
    emailAnalysis: {
        messageScore: number;
        keywordsFlagged: string[];
        replyMessage: string;
    },
    usageTokens: any

};

export type FilterConfig = {
    notification_mode: "minimal" | "balanced" | "aggressive";
    watch_tags: string[];
    ignore_tags: string[];
    enable_first_time_sender_alert: boolean;
    enable_deadline_alert: boolean;
};
