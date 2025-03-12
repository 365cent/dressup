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

export interface PersonData {
  type: string
  gender: string
  age: string
  skin: string
  pose: string
  expression: string
  fit: string
  wearing: WearingItem[]
}

// Cache and timing variables
let lastFetchTime = 0;
let lastCallTime = Date.now();
let cachedResponse: PersonData | null = null;

const placeholderData: PersonData = {
  type: "people",
  gender: "female",
  age: "25-34",
  skin: "medium",
  pose: "standing",
  expression: "smiling",
  fit: "excellent",
  wearing: [
    {
      item: "shirt",
      category: "top",
      color: "white",
      pattern: "plain",
      material: "linen",
      brand: "Uniqlo",
      luxury: false,
      clean: true,
      comfortable: true,
      fit_style: "regular",
      season: "summer",
      opacity: "semi-transparent",
      color_match: "excellent",
      trendiness: "high",
      formalness: "casual",
      user_rating: 4.7,
    },
    {
      item: "pants",
      category: "bottom",
      color: "black",
      pattern: "plain",
      material: "denim",
      brand: "Levi's",
      luxury: false,
      clean: true,
      comfortable: true,
      fit_style: "slim",
      length: "full-length",
      stretchable: true,
      waist_fit: "perfect",
      color_match: "excellent",
      trendiness: "high",
      formalness: "casual",
      user_rating: 4.5,
    },
    {
      item: "shoes",
      category: "footwear",
      color: "white",
      brand: "Nike",
      luxury: false,
      clean: true,
      comfortable: true,
      season: "all-season",
      formalness: "casual",
      user_rating: 4.8,
    },
    {
      item: "watch",
      category: "accessory",
      color: "silver",
      material: "metal",
      brand: "Rolex",
      luxury: true,
      shining: true,
      user_rating: 4.9,
    },
  ],
};

export default async function AnalyzeDetail(imageBase64: string, scenario: string): Promise<PersonData> {
  const currentTime = Date.now();

  // Stop requests after 30s of inactivity
  if (currentTime - lastCallTime > 30000) return cachedResponse || placeholderData;

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
          { type: "text", text: `Analyze this outfit for ${scenario}: return detailed JSON with person data including type, gender, age, skin, pose, expression, fit, and an array of wearing items with details like item, category, color, pattern, material, brand, luxury status, cleanliness, comfort, fit style, season, etc. Do not include any other text or comments.` },
        ],
      }] as any,
    });

    const jsonMatch = response.choices[0].message.content?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const personData: PersonData = JSON.parse(jsonMatch[0]);
    console.log("Person data:", personData);
    cachedResponse = personData;
    lastFetchTime = currentTime;
    return cachedResponse;
  } catch (error) {
    console.error("Error in analyzeDetail:", error);
    return placeholderData;
  }
}