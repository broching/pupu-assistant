import { GeminiAI } from "../geminiAI/geminiAIClient";
import { buildEmailAnalysisPrompt } from "../geminiAI/geminiPrompt";
import { EmailAnalysisResult } from "../geminiAI/geminiSchemas";

export async function analyzeEmailWithAI(params: {
  sender: string;
  subject: string;
  body: string;
  filter: Record<string, unknown>;
}): Promise<EmailAnalysisResult> {
  const ai = new GeminiAI();
  console.log('ai reached')
  const prompt = buildEmailAnalysisPrompt({
    emailSender: params.sender,
    emailSubject: params.subject,
    emailBody: params.body,
    filter: params.filter,
  });

  const res = ai.generateJSON<EmailAnalysisResult>(prompt);
  return res;
}
