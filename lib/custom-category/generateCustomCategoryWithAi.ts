import { GeminiAI } from "../geminiAI/geminiAIClient";
import { buildGenerateCustomCatgegoryPrompt } from "../geminiAI/geminiPrompt";
import { CustomCategoryResult } from "../geminiAI/geminiSchemas";

export async function generateCustomCategoryWithAI(params: {
    userInput: string;
}): Promise<CustomCategoryResult> {
    const ai = new GeminiAI();
    const prompt = buildGenerateCustomCatgegoryPrompt({
        userInput: params.userInput,
    });
    const res = ai.generateJSONCustomCategory<CustomCategoryResult>(prompt);
    console.log(await res)
    return res;
}
