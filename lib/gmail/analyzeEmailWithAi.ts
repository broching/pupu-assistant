import { GeminiAI } from "../geminiAI/geminiAIClient";
import { buildEmailAnalysisPrompt } from "../geminiAI/geminiPrompt";
import { EmailAnalysisResult } from "../geminiAI/geminiSchemas";

export async function analyzeEmailWithAI(params: {
  sender: string;
  subject: string;
  body: string;
  result: Record<string, string>;
  customCategory: any[]
}): Promise<EmailAnalysisResult> {
  const ai = new GeminiAI();
  const prompt = buildEmailAnalysisPrompt({
    emailSender: params.sender,
    emailSubject: params.subject,
    emailBody: params.body,
    filter: params.result,
    customCategory: params.customCategory
  });
  console.log("prompt",prompt)
  const res = ai.generateJSON<EmailAnalysisResult>(prompt);
  console.log('custom category', params.customCategory)
  return res;
}
