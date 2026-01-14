// src/lib/ai/emailClassifier.ts
import { openai, DEFAULT_MODEL } from "./openai.client";
import { EmailAnalysisResult, FilterPreferences } from "./types";

export class EmailClassifierAI {
  /**
   * Analyze an email and return structured importance + message
   */
  static async analyzeEmail(params: {
    emailFrom: string;
    emailSubject: string;
    emailBody: string;
    filter: FilterPreferences;
  }): Promise<EmailAnalysisResult> {
    const { emailFrom, emailSubject, emailBody, filter } = params;

    const systemPrompt = `
You are an email importance classifier for a productivity assistant.

You must return ONLY valid JSON.
No markdown.
No explanations.
No extra text.
`;

    const userPrompt = `
Filter preferences:
- Notification mode: ${filter.notificationMode}
- Watch keywords: ${filter.watchTags.join(", ") || "none"}
- Ignore keywords: ${filter.ignoreTags.join(", ") || "none"}
- First time sender alert: ${filter.firstTimeSender}
- Thread reply alert: ${filter.threadReply}
- Deadline detection: ${filter.deadlineAlert}
- Subscription detection: ${filter.subscriptionAlert}

Email:
From: ${emailFrom}
Subject: ${emailSubject}
Body:
${emailBody}

Return JSON with this exact shape:
{
  "score": number (0-100),
  "keywords": string[],
  "reply_message": string
}
`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() }
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    return JSON.parse(content) as EmailAnalysisResult;
  }
}
