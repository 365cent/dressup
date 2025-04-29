import { analyzeOutfit as analyzeBasicOutfit } from './ml-service'; // Import the basic server-side analyzer
import { getCachedData, setCachedData, generateCacheKey } from "./cache-utils";

// Assume XAI_API_KEY is available via process.env
const XAI_API_KEY = process.env.xai_key || "xai-5KCWiybVRlYYEfY8PU89Yt1VLETdVfDfBsFLaav3QM2sKZtrxkP0zpfhsMu2FtCyLZ442ljw1zldRt8o";
const isServer = typeof window === 'undefined';

// --- Interface Update ---
export interface ClothingItem {
  type: string; // e.g., "t-shirt", "jeans", "dress"
  color: string; // Dominant color name or hex
  pattern: string; // e.g., "solid", "striped", "floral"
  material?: string; // e.g., "cotton", "denim", "silk"
  fit?: string; // e.g., "slim", "regular", "loose"
  confidence: number; // Confidence score (0-1)
}

export interface AccessoryItem {
  type: string; // e.g., "watch", "necklace", "handbag"
  color?: string;
  material?: string;
  position?: string; // e.g., "wrist", "neck", "hand"
  confidence: number;
}

export interface OutfitAnalysis {
  // --- Added Basic Scores ---
  comfort: number; // Score 0-100
  fitConfidence: number; // Score 0-100
  colorHarmony: number; // Score 0-100
  // --- End Added Basic Scores ---

  style: { [key: string]: number }; // e.g., { "casual": 0.8, "formal": 0.1 }
  clothingItems: ClothingItem[];
  accessories: AccessoryItem[];
  dominantColors: string[]; // Array of hex codes or color names
  patterns: string[]; // List of detected patterns
  season: string; // e.g., "Summer", "Winter", "All-Season"
  occasions: string[]; // Suitable occasions, e.g., ["casual outing", "work"]
  hasBottomGarment: boolean; // Flag indicating if a bottom garment was detected
}


/**
 * Performs detailed outfit analysis using Grok-2-Vision.
 * IMPORTANT: This function is designed for SERVER-SIDE EXECUTION ONLY.
 * It makes direct API calls and relies on server environment variables.
 * It should be called via an API route (e.g., through the MCP protocol).
 * Combines basic scores with detailed itemization.
 */
export async function analyzeOutfitDetails(imageData: string): Promise<OutfitAnalysis> {
  // Explicit server-side check
  if (!isServer) {
    throw new Error("analyzeOutfitDetails cannot be called directly from the client-side. Use the MCP API route.");
  }

  const cacheKey = generateCacheKey(imageData, "detailed-analysis");
  const cachedResult = getCachedData(cacheKey);
  if (cachedResult) {
    console.log("Using cached detailed analysis result");
    return cachedResult;
  }

  try {
    // --- Step 1: Get Basic Scores (using server-side basic analyzer) ---
    console.log("Fetching basic scores for detailed analysis...");
    const basicAnalysis = await analyzeBasicOutfit(imageData); // Calls server-side ml-service function
    console.log("Basic scores fetched.");
    // --- End Step 1 ---

    // --- Step 2: Perform Detailed Analysis (Grok-2-Vision API call) ---
    console.log("Performing detailed analysis...");
    const prompt = `
      Analyze the outfit in the image in extreme detail. Identify individual clothing items (type, color, pattern, material, fit) and accessories (type, color, material, position).
      Determine the overall style profile (scores for casual, formal, sporty etc.), dominant colors (hex codes preferred), overall patterns, suitable season, and potential occasions.
      Indicate if a bottom garment (pants, skirt, shorts etc.) is clearly visible.
      Provide a structured JSON response with the following fields EXACTLY as specified:
      {
        "style": { "casual": <score 0-1>, "formal": <score 0-1>, ... },
        "clothingItems": [ { "type": "...", "color": "...", "pattern": "...", "material": "...", "fit": "...", "confidence": <score 0-1> }, ... ],
        "accessories": [ { "type": "...", "color": "...", "material": "...", "position": "...", "confidence": <score 0-1> }, ... ],
        "dominantColors": [ "#hex1", "#hex2", ... ],
        "patterns": [ "pattern1", "pattern2", ... ],
        "season": "...",
        "occasions": [ "occasion1", "occasion2", ... ],
        "hasBottomGarment": <true_or_false>
      }
      Use EXACTLY these field names. Return ONLY the JSON object. Be precise and detailed.
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // Slightly longer timeout

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${XAI_API_KEY}` },
      body: JSON.stringify({
        messages: [
           { role: "system", content: "You are an expert fashion analysis AI providing detailed, structured JSON output." },
           { role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageData } }] }
        ],
        model: "grok-2-vision", stream: false, temperature: 0.1,
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new Error(`Detailed analysis API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let detailedResult: Omit<OutfitAnalysis, 'comfort' | 'fitConfidence' | 'colorHarmony'>;
    try {
      detailedResult = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        try { detailedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]); }
        catch (e2) { throw new Error("Failed to parse extracted JSON from detailed API response"); }
      } else { throw new Error("Invalid detailed API response format: No JSON found"); }
    }
    console.log("Detailed analysis parsed.");
    // --- End Step 2 ---


    // --- Step 3: Combine Results & Validate ---
    const finalResult: OutfitAnalysis = {
      // Basic scores from Step 1
      comfort: basicAnalysis.comfort,
      fitConfidence: basicAnalysis.fitConfidence,
      colorHarmony: basicAnalysis.colorHarmony,
      // Detailed results from Step 2
      style: detailedResult.style || {},
      clothingItems: detailedResult.clothingItems || [],
      accessories: detailedResult.accessories || [],
      dominantColors: detailedResult.dominantColors || [],
      patterns: detailedResult.patterns || [],
      season: detailedResult.season || "Unknown",
      occasions: detailedResult.occasions || [],
      hasBottomGarment: detailedResult.hasBottomGarment === true, // Ensure boolean
    };

    // Basic validation
    if (!Array.isArray(finalResult.clothingItems) || !Array.isArray(finalResult.accessories)) {
        throw new Error("Invalid data structure in combined analysis result.");
    }
    // --- End Step 3 ---

    // Cache the combined result
    setCachedData(cacheKey, finalResult);

    // Return the combined result (will be wrapped in AnalysisResult by MCP)
    return finalResult;

  } catch (error) {
    console.error("Error performing detailed outfit analysis:", error);
    throw error; // Re-throw the error to be handled by MCP
  }
}
