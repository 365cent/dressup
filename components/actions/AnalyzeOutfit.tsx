"use server"

import { OpenAI } from "openai";

interface ScoreData {
    comfort: number;
    fitConfidence: number;
    colorHarmony: number;
}

// Cache and timing variables
let lastFetchTime = 0;
let lastCallTime = Date.now();
let cachedResponse: ScoreData | null = null;

const placeholderScores: ScoreData = {
    comfort: 70,
    fitConfidence: 65,
    colorHarmony: 80,
};

export default async function AnalyzeOutfit(imageBase64: string): Promise<ScoreData> {
    const currentTime = Date.now();

    // Stop requests after 30s of inactivity
    if (currentTime - lastCallTime > 30000) return cachedResponse || placeholderScores;

    lastCallTime = currentTime;

    // Return cached response if within 3s
    if (cachedResponse && currentTime - lastFetchTime < 3000) {
        console.log("Serving stale response");
        return cachedResponse;
    }

    try {
        const client = new OpenAI({
            apiKey: process.env.GROK_API_KEY || "",
            baseURL: "https://api.x.ai/v1",
        });

        const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
        const response = await client.chat.completions.create({
            model: "grok-2-vision-latest",
            messages: [{
                role: "user",
                content: [
                    { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
                    { type: "text", text: "Analyze outfit: return JSON with scores (0-100) for comfort, fitConfidence and colorHarmony. Do not include any other text or comments." },
                ],
            }] as any,
        });

        const jsonMatch = response.choices[0].message.content?.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");

        const scores: ScoreData = JSON.parse(jsonMatch[0]);
        console.log("Scores:", scores);
        cachedResponse = {
            comfort: scores.comfort,
            fitConfidence: scores.fitConfidence,
            colorHarmony: scores.colorHarmony,
        };
        lastFetchTime = currentTime;
        return cachedResponse;
    } catch (error) {
        console.error("Error in AnalyzeOutfit:", error);
        return placeholderScores;
    }
}