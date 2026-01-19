import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { EmailAnalysisResult } from "./geminiSchemas";

export type GeminiGenerateOptions = {
    temperature?: number;
    maxOutputTokens?: number;
};

export class GeminiAI {
    private client: GoogleGenerativeAI;
    private textModel: GenerativeModel;
    private jsonModel: GenerativeModel;

    constructor(
        modelName: string = "gemini-2.0-flash-lite",
        options?: GeminiGenerateOptions
    ) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // 🔹 Free-form text model
        this.textModel = this.client.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: options?.temperature ?? 0.2,
                maxOutputTokens: options?.maxOutputTokens ?? 512,
            },
        });

        // 🔒 Strict JSON + Schema enforced model
        this.jsonModel = this.client.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: options?.temperature ?? 0.2,
                maxOutputTokens: options?.maxOutputTokens ?? 768,
                responseMimeType: "application/json",
            },
        });
    }

    /**
     * Free-form text generation
     */
    async generateText(prompt: string): Promise<string> {
        const result = await this.textModel.generateContent(prompt);
        return result.response.text().trim();
    }

    /**
     * Guaranteed schema-valid JSON generation
     */
    async generateJSON<T>(prompt: string): Promise<EmailAnalysisResult> {
        const result = await this.jsonModel.generateContent(prompt);
        const text = result.response.text().trim();
        console.log('res', result.response.usageMetadata)
        const jsonText = reconstructJson(text);
        const parsedText = JSON.parse(jsonText)
        const returnObj = {
            emailAnalysis: parsedText,
            usageTokens: result.response.usageMetadata
        }

        try {
            return returnObj;
        } catch (err) {
            console.error("❌ Gemini returned invalid JSON (should not happen):", jsonText);
            throw new Error("Invalid JSON returned from Gemini");
        }
    }
}


export function reconstructJson(text: string): string {
    // 1️⃣ Remove markdown fences
    let cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    // 2️⃣ Find JSON start
    const start = cleaned.indexOf("{");
    if (start === -1) {
        throw new Error("No JSON object start found");
    }

    cleaned = cleaned.slice(start);

    let depth = 0;
    let inString = false;
    let escape = false;
    let lastValidIndex = -1;

    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (char === "\\") {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
        }

        if (!inString) {
            if (char === "{") depth++;
            if (char === "}") depth--;

            if (depth === 0) {
                lastValidIndex = i;
                break;
            }
        }
    }

    // 3️⃣ Extract what we have
    let jsonCandidate =
        lastValidIndex !== -1
            ? cleaned.slice(0, lastValidIndex + 1)
            : cleaned;

    // 4️⃣ Repair unclosed string
    if (inString) {
        jsonCandidate += `"`;
    }

    // 5️⃣ Repair missing braces
    if (depth > 0) {
        jsonCandidate += "}".repeat(depth);
    }

    // 6️⃣ Final sanity check
    try {
        JSON.parse(jsonCandidate);
        return jsonCandidate;
    } catch (err) {
        throw new Error("Unable to reconstruct valid JSON");
    }
}
