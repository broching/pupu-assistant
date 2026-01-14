// src/lib/ai/openai.client.ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const DEFAULT_MODEL = "gpt-4.1-nano"; // GPT-4 nano
