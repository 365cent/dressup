"use server"

import { OpenAI } from "openai";

interface WearingItem {
  item: string
  category: string
  color: string
  pattern?: string
  material?: string
  brand?: string
  luxury: boolean
  clean?: boolean
  comfortable?: boolean
  fit_style?: string
  season?: string
  opacity?: string
  color_match?: string
  trendiness?: string
  formalness?: string
  user_rating: number
  length?: string
  stretchable?: boolean
  waist_fit?: string
  shining?: boolean
}

interface PersonData {
  type: string
  gender: string
  age: string
  skin: string
  pose: string
  expression: string
  fit: string
  wearing: WearingItem[]
}

/**
 * Analyzes an outfit for a specific occasion and returns a score
 * @param details - The details of the person and their outfit
 * @param scenario - The occasion/scenario for which the outfit is being evaluated
 * @returns A score from 0-100 representing how suitable the outfit is for the occasion
 */
export default async function AnlyzeOccasion(details: PersonData, scenario: string): Promise<number> {
  try {
    const client = new OpenAI({
      apiKey: process.env.GROK_API_KEY || "",
      baseURL: "https://api.x.ai/v1",
    });

    // Convert details to JSON string for the API
    const detailsJson = JSON.stringify(details);

    const response = await client.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        {
          role: "system",
          content: "You are a fashion expert who evaluates outfits for specific occasions. You will receive outfit details and should return only a numeric score from 0-100."
        },
        {
          role: "user",
          content: `Analyze this outfit for a ${scenario} and provide a single numeric score from 0-100 representing how suitable it is. Higher scores mean better suitability. Only return the number, no other text. Here are the outfit details: ${detailsJson}`
        }
      ],
    });

    const scoreText = response.choices[0].message.content?.trim() || "50";
    // Extract just the number from the response
    const scoreMatch = scoreText.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0], 10) : 50;
    
    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error("Error analyzing occasion:", error);
    return 50; // Return average score in case of error
  }
}


