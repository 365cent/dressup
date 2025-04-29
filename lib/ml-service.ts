import { getCachedData, setCachedData, generateCacheKey } from "./cache-utils"

// Load environment variables
const XAI_API_KEY =
  process.env.xai_key || "xai-5KCWiybVRlYYEfY8PU89Yt1VLETdVfDfBsFLaav3QM2sKZtrxkP0zpfhsMu2FtCyLZ442ljw1zldRt8o"

// Feedback storage type (remains the same, might be used elsewhere or can be removed if not)
export type FeedbackEntry = {
  imageData: string // May not be needed if imageId is always present
  imageId?: string
  analysis: any // Consider defining a stricter type for analysis context in feedback
  feedback: "upvote" | "downvote"
  timestamp: number
}

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// In-memory feedback cache (server-side only) - simplified, relies on fs-utils now
// let feedbackData: FeedbackEntry[] = []
// const initFeedbackData = async () => { ... } // Removed, fs-utils handles loading

// Model training stubs remain the same
export async function initModels() {
  console.log("Initializing models...")
  // No feedback loading here anymore
  return true
}
export async function trainModel(trainingData: any[]) {
  console.log("Training model with data:", trainingData)
  return true
}
export async function saveModel() {
  console.log("Saving model...")
  return true
}
export async function loadModel() {
  console.log("Loading model...")
  return true
}
export const CLOTHING_CATEGORIES = ["top", "bottom", "dress", "outerwear", "footwear", "accessory", "headwear"]
export const STYLE_ATTRIBUTES = ["casual", "formal", "business", "sporty", "vintage", "trendy", "elegant", "bohemian"]


/**
 * Analyzes an outfit image - Server-side ONLY. Returns analysis result or throws error.
 */
export async function analyzeOutfit(imageData: string) {
  if (!isServer) throw new Error("analyzeOutfit can only run on the server.");

  const cacheKey = generateCacheKey(imageData, "outfit-analysis"); // Use specific key
  const cachedResult = getCachedData(cacheKey);
  if (cachedResult) {
    console.log("Using cached analysis result");
    return cachedResult;
  }

  // const startTime = Date.now(); // Start time captured in mcp-protocol
  try {
    const prompt = `
      Analyze this outfit image in detail. Provide a structured JSON response with the following fields exactly as specified:
      {
        "categories": { ... },
        "styleAttributes": { ... },
        "colorAnalysis": { ... },
        "comfort": (score between 0-100),
        "fitConfidence": (score between 0-100),
        "colorHarmony": (score between 0-100)
      }
      Use EXACTLY these field names in camelCase format. Return ONLY the JSON object with no additional text.
    `; // Keep prompt concise

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${XAI_API_KEY}` },
      body: JSON.stringify({
        messages: [
           { role: "system", content: "You are a fashion analysis assistant." },
           { role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageData } }] }
        ],
        model: "grok-2-vision", stream: false, temperature: 0.2,
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        try { analysisResult = JSON.parse(jsonMatch[1] || jsonMatch[0]); }
        catch (e2) { throw new Error("Failed to parse extracted JSON from API response"); }
      } else { throw new Error("Invalid API response format: No JSON found"); }
    }

    // --- Add Validation for required fields ---
    if (!analysisResult || typeof analysisResult !== 'object' ||
        !analysisResult.categories || typeof analysisResult.categories !== 'object' ||
        !analysisResult.styleAttributes || typeof analysisResult.styleAttributes !== 'object' ||
        !analysisResult.colorAnalysis || typeof analysisResult.colorAnalysis !== 'object' ||
        typeof analysisResult.comfort !== 'number' ||
        typeof analysisResult.fitConfidence !== 'number' ||
        typeof analysisResult.colorHarmony !== 'number') {
       throw new Error("Invalid API response structure for outfit analysis");
    }
    // --- End Validation ---


    // Cache the valid result
    setCachedData(cacheKey, analysisResult);

    // DO NOT record analysis here - done by MCP caller
    // await recordAnalysisResult(imageData, "outfit", analysisResult, { startTime });

    return analysisResult; // Return the raw analysis result object

  } catch (error) {
    console.error("Error analyzing outfit with Grok-2-Vision:", error);
    // DO NOT record error here - done by MCP caller
    // await recordAnalysisError(...)
    throw error; // Re-throw the error
  }
}


/**
 * Match an outfit to an occasion - Server-side ONLY. Returns score or throws error.
 */
export async function matchOutfitToOccasion(imageData: string, occasion: string): Promise<number> {
   if (!isServer) throw new Error("matchOutfitToOccasion can only run on the server.");

  const cacheKey = generateCacheKey(imageData, { occasion });
  const cachedResult = getCachedData(cacheKey);
  if (cachedResult !== null) {
    console.log("Using cached occasion match result");
    return cachedResult;
  }

  // const startTime = Date.now(); // Start time captured in mcp-protocol
  try {
    // Analyze the outfit first (using the server-side function)
    // This is the most likely place for an error if the underlying analysis fails
    console.log(`Analyzing outfit for occasion match: ${occasion}`);
    const analysis = await analyzeOutfit(imageData); // This might throw an error
    console.log(`Outfit analysis successful for occasion: ${occasion}`);

    // Define ideal style attributes (keep this logic)
    const occasionToAttributes: { [key: string]: { [attr: string]: number } } = {
       "job interview": { formal: 0.8, business: 0.9, elegant: 0.7, casual: 0.1 },
       "date night": { elegant: 0.8, trendy: 0.7, formal: 0.5, casual: 0.3 },
       "casual outing": { casual: 0.9, sporty: 0.7, trendy: 0.6, formal: 0.1 },
       wedding: { formal: 0.9, elegant: 0.8, trendy: 0.5, casual: 0.1 },
       workout: { sporty: 0.9, casual: 0.7, trendy: 0.4, formal: 0.0 },
       "business meeting": { business: 0.9, formal: 0.8, elegant: 0.7, casual: 0.1 },
    };
    const defaultMapping = { casual: 0.5, trendy: 0.5, formal: 0.5, elegant: 0.5 };
    const attributeWeights = occasionToAttributes[occasion.toLowerCase()] || defaultMapping;

    // Calculate match score (keep this logic)
    console.log(`Calculating score for occasion: ${occasion}`);
    let matchScore = 50;
    let totalWeight = 0;
    let weightedSum = 0;
    Object.entries(attributeWeights).forEach(([attr, weight]) => {
      // Ensure analysis.styleAttributes exists and the attribute is a key before accessing
      const attrScore = (analysis?.styleAttributes && attr in analysis.styleAttributes)
        ? analysis.styleAttributes[attr as keyof typeof analysis.styleAttributes] || 0
        : 0;
      weightedSum += attrScore * weight;
      totalWeight += weight;
    });
    if (totalWeight > 0) {
      matchScore = (weightedSum / totalWeight) * 100;
    }
    // Ensure analysis.comfort and analysis.fitConfidence exist before using
    const comfortScore = analysis?.comfort ?? 50; // Default to 50 if missing
    const fitConfidenceScore = analysis?.fitConfidence ?? 50; // Default to 50 if missing
    matchScore = matchScore * 0.6 + comfortScore * 0.2 + fitConfidenceScore * 0.2;
    const finalScore = Math.round(Math.min(100, Math.max(0, matchScore)));
    console.log(`Final score calculated for ${occasion}: ${finalScore}`);

    // Cache the result
    setCachedData(cacheKey, finalScore);

    // DO NOT record analysis here - done by MCP caller
    // await recordAnalysisResult(...)

    return finalScore;

  } catch (error) {
    // --- MODIFICATION START: More detailed error logging ---
    console.error(`Error matching outfit to occasion "${occasion}":`, error instanceof Error ? error.message : String(error));
    // Log the stack trace if available
    if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
    }
    // --- MODIFICATION END ---
    // DO NOT record error here - done by MCP caller
    // await recordAnalysisError(...)
    throw error; // Re-throw the error
  }
}


/**
 * Get AI-generated style suggestions - Server-side ONLY. Returns suggestions or throws error.
 */
export async function getStyleSuggestions(imageData: string, occasion: string): Promise<string[]> {
   if (!isServer) throw new Error("getStyleSuggestions can only run on the server.");

  const cacheKey = generateCacheKey(imageData, { suggestion: occasion });
  const cachedResult = getCachedData(cacheKey);
  if (cachedResult !== null) {
    console.log("Using cached style suggestions");
    return cachedResult;
  }

  // const startTime = Date.now(); // Start time captured in mcp-protocol
  try {
    const prompt = `
      I'm wearing an outfit for a "${occasion}". Based on the image, provide 3-5 specific style suggestions to improve it.
      Format response as a JSON array of strings. Example: ["Add a belt", "Consider darker shoes"].
      Return ONLY the JSON array.
    `; // Keep prompt concise

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
       method: "POST",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${XAI_API_KEY}` },
       body: JSON.stringify({
         messages: [
            { role: "system", content: "You are a fashion stylist assistant." },
            { role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageData } }] }
         ],
         model: "grok-2-vision", stream: false, temperature: 0.7,
       }),
       signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try { suggestions = JSON.parse(jsonMatch[1] || jsonMatch[0]); }
        catch (e2) { /* Ignore parsing error, fallback below */ }
      }
      // Fallback: Try extracting bullet points/numbered lists if JSON parsing fails
      if (suggestions.length === 0) {
         const lines = content.split('\n').map((line: string) => line.replace(/^[-*•\d]+\.?\s*/, '').trim()).filter((line: string) => line.length > 5);
         if (lines.length > 0) suggestions = lines;
         else throw new Error("Failed to parse suggestions from API response");
      }
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0 || !suggestions.every(s => typeof s === 'string')) {
       throw new Error("Invalid suggestions format received from API");
    }

    // Cache the result
    setCachedData(cacheKey, suggestions);

    // DO NOT record analysis here - done by MCP caller
    // await recordAnalysisResult(...)

    return suggestions;

  } catch (error) {
    console.error("Error getting style suggestions:", error);
    // DO NOT record error here - done by MCP caller
    // await recordAnalysisError(...)
    throw error; // Re-throw the error
  }
}
