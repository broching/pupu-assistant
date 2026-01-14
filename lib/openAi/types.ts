// src/lib/ai/types.ts

export type EmailAnalysisResult = {
  score: number; // 0–100 importance
  keywords: string[];
  reply_message: string;
};

export type FilterPreferences = {
  notificationMode: "minimal" | "balanced" | "aggressive";
  watchTags: string[];
  ignoreTags: string[];
  firstTimeSender: boolean;
  threadReply: boolean;
  deadlineAlert: boolean;
  subscriptionAlert: boolean;
};
