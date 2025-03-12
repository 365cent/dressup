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

    const imageUrl = imageBase64;
    const response = await client.chat.completions.create({
      model: "grok-2-vision-latest",
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
          { type: "text", text: `Analyze this outfit for ${scenario}. Return a JSON object that strictly follows this format:
{
  "type": "people",
  "gender": "female|male|other",
  "age": "age range",
  "skin": "skin tone",
  "pose": "standing|sitting|etc",
  "expression": "smiling|neutral|etc",
  "fit": "excellent|good|etc",
  "wearing": [
    {
      "item": "name of item",
      "category": "top|bottom|footwear|accessory",
      "color": "color",
      "pattern": "plain|etc",
      "material": "material type",
      "brand": "brand name if visible",
      "luxury": true|false,
      "clean": true|false,
      "comfortable": true|false,
      "fit_style": "regular|slim|etc",
      "season": "summer|winter|all-season|etc",
      "opacity": "opaque|semi-transparent|etc",
      "color_match": "excellent|good|etc",
      "trendiness": "high|medium|low",
      "formalness": "formal|casual|etc",
      "user_rating": number between 1-5
    }
  ]
}

Only return the JSON object with no additional text or explanations.` },
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