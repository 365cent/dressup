import { getCachedData, setCachedData, generateCacheKey } from "./cache-utils"
import { isDocumentVisible } from "./visibility-utils"
import { initMCP, recordAnalysisResult, recordAnalysisError } from "./mcp-protocol"

// Load environment variables
const XAI_API_KEY =
  process.env.xai_key || "xai-5KCWiybVRlYYEfY8PU89Yt1VLETdVfDfBsFLaav3QM2sKZtrxkP0zpfhsMu2FtCyLZ442ljw1zldRt8o"

// Queue for pending analysis requests
interface AnalysisRequest {
  imageData: string
  resolve: (result: OutfitAnalysis) => void
  reject: (error: Error) => void
  timestamp: number
}

const analysisQueue: AnalysisRequest[] = []
let isProcessingQueue = false

// Initialize MCP when this module is loaded
initMCP()

export interface ClothingItem {
  type: string
  category: string
  color: string
  pattern: string
  material?: string
  style?: string
  fit?: string
  confidence: number
  position?: string // e.g., "upper body", "lower body"
}

export interface AccessoryItem {
  type: string
  color?: string
  material?: string
  position?: string
  confidence: number
}

export interface OutfitAnalysis {
  clothingItems: ClothingItem[]
  accessories: AccessoryItem[]
  dominantColors: string[]
  patterns: string[]
  style: {
    formal: number
    casual: number
    sporty: number
    business: number
    vintage: number
    trendy: number
  }
  season: string
  occasions: string[]
  hasBottomGarment: boolean // Flag to indicate if bottom garment is detected
}

// Process the analysis queue when the tab is in focus
export function processAnalysisQueue() {
  if (!isDocumentVisible() || isProcessingQueue || analysisQueue.length === 0) {
    return
  }

  isProcessingQueue = true

  // Sort by timestamp (oldest first)
  analysisQueue.sort((a, b) => a.timestamp - b.timestamp)

  // Take the oldest request
  const request = analysisQueue.shift()

  if (request) {
    // Process the request
    performOutfitAnalysis(request.imageData)
      .then((result) => {
        request.resolve(result)
      })
      .catch((error) => {
        request.reject(error)
      })
      .finally(() => {
        isProcessingQueue = false
        // Continue processing the queue
        setTimeout(processAnalysisQueue, 100)
      })
  } else {
    isProcessingQueue = false
  }
}

/**
 * Analyzes an outfit image to identify clothing items, accessories, patterns, and style
 * This function will queue the analysis if the tab is not in focus
 */
export async function analyzeOutfitDetails(imageData: string): Promise<OutfitAnalysis> {
  // Check cache first
  const cacheKey = generateCacheKey(imageData, "detailed-analysis")
  const cachedResult = getCachedData(cacheKey)

  if (cachedResult) {
    console.log("Using cached detailed analysis result")
    return cachedResult
  }

  // If the document is not visible, queue the analysis
  if (!isDocumentVisible()) {
    return new Promise((resolve, reject) => {
      analysisQueue.push({
        imageData,
        resolve,
        reject,
        timestamp: Date.now(),
      })
    })
  }

  // Otherwise, perform the analysis immediately
  const startTime = Date.now()
  try {
    const result = await performOutfitAnalysis(imageData)

    // Record the successful analysis in MCP
    await recordAnalysisResult(imageData, "detailed", result, { startTime })

    return result
  } catch (error) {
    // Record the error in MCP
    await recordAnalysisError(imageData, "detailed", error instanceof Error ? error : new Error(String(error)), {
      startTime,
    })
    throw error
  }
}

/**
 * Actual implementation of the outfit analysis
 */
async function performOutfitAnalysis(imageData: string): Promise<OutfitAnalysis> {
  try {
    // Prepare the prompt for the vision model
    const prompt = `
      Analyze this outfit image in detail. Provide a structured JSON response with the following:
      
      1. clothingItems: Array of clothing items with properties:
         - type: specific name (e.g., "t-shirt", "jeans", "blazer", "jacket", "dress", "pants", "skirt", "shorts")
         - category: general category (e.g., "top", "bottom", "outerwear", "full-body")
         - color: color name (e.g., "navy blue", "charcoal gray")
         - pattern: pattern description (e.g., "solid", "striped", "floral", "checkered", "plaid", "polka dot")
         - material: fabric if identifiable (e.g., "cotton", "denim", "leather", "silk", "wool")
         - style: style description (e.g., "slim-fit", "oversized", "vintage", "casual", "formal")
         - fit: how it fits (e.g., "loose", "tight", "regular")
         - position: where it's worn (e.g., "upper body", "lower body", "full body")
         - confidence: confidence score from 0-1
      
      2. accessories: Array of accessories with properties:
         - type: specific name (e.g., "watch", "necklace", "earrings", "bracelet", "ring", "hat", "gloves", "scarf", "belt", "tie")
         - color: color if applicable
         - material: material if identifiable
         - position: where it's worn (e.g., "wrist", "neck", "ears", "head", "hands")
         - confidence: confidence score from 0-1
      
      3. dominantColors: Array of hex color codes for the dominant colors
      
      4. patterns: Array of pattern types present (e.g., "striped", "floral", "geometric", "solid", "checkered")
      
      5. style: Object with style scores from 0-1:
         - formal
         - casual
         - sporty
         - business
         - vintage
         - trendy
      
      6. season: Most appropriate season for the outfit (e.g., "summer", "winter", "all-season")
      
      7. occasions: Array of suitable occasions for this outfit
      
      Return ONLY the JSON object with no additional text.
    `

    // Make the API request to Grok-2-Vision
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a fashion analysis assistant that specializes in analyzing outfits and providing detailed feedback.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageData } },
            ],
          },
        ],
        model: "grok-2-vision",
        stream: false,
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    console.log("Detailed clothing analysis API response:", data)

    // Extract the content from the response
    const content = data.choices[0].message.content

    // Parse the JSON response
    let analysisResult: any
    try {
      // Try to parse the entire response as JSON
      analysisResult = JSON.parse(content)
    } catch (e) {
      // If that fails, try to extract JSON from the text
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/{[\s\S]*}/)

      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[1] || jsonMatch[0])
        } catch (e2) {
          console.error("Failed to parse JSON from response:", e2)
          throw new Error("Failed to parse analysis result")
        }
      } else {
        console.error("No JSON found in response")
        throw new Error("Invalid response format")
      }
    }

    // Check if bottom garment is detected
    const hasBottomGarment =
      analysisResult.clothingItems?.some(
        (item: ClothingItem) =>
          item.category === "bottom" ||
          (item.position && item.position.includes("lower")) ||
          ["pants", "jeans", "shorts", "skirt", "trousers", "leggings"].includes(item.type.toLowerCase()),
      ) || false

    // Validate and ensure all required properties exist
    const validatedResult: OutfitAnalysis = {
      clothingItems: analysisResult.clothingItems || [],
      accessories: analysisResult.accessories || [],
      dominantColors: analysisResult.dominantColors || ["#000000"],
      patterns: analysisResult.patterns || ["solid"],
      style: analysisResult.style || {
        formal: 0,
        casual: 0,
        sporty: 0,
        business: 0,
        vintage: 0,
        trendy: 0,
      },
      season: analysisResult.season || "all-season",
      occasions: analysisResult.occasions || ["casual"],
      hasBottomGarment,
    }

    // Cache the result
    const cacheKey = generateCacheKey(imageData, "detailed-analysis")
    setCachedData(cacheKey, validatedResult)

    return validatedResult
  } catch (error) {
    console.error("Error analyzing outfit details with Grok-2-Vision:", error)

    // Fallback to mock data if the API call fails
    const fallbackResult = getFallbackOutfitAnalysis()

    // Cache the fallback result too
    const cacheKey = generateCacheKey(imageData, "detailed-analysis")
    setCachedData(cacheKey, fallbackResult)

    return fallbackResult
  }
}

/**
 * Fallback analysis with mock data in case the API call fails
 */
function getFallbackOutfitAnalysis(): OutfitAnalysis {
  return {
    clothingItems: [
      {
        type: "t-shirt",
        category: "top",
        color: "navy blue",
        pattern: "solid",
        material: "cotton",
        style: "casual",
        fit: "regular",
        position: "upper body",
        confidence: 0.95,
      },
      {
        type: "jeans",
        category: "bottom",
        color: "indigo",
        pattern: "solid",
        material: "denim",
        style: "slim-fit",
        fit: "regular",
        position: "lower body",
        confidence: 0.92,
      },
    ],
    accessories: [
      {
        type: "watch",
        color: "silver",
        material: "metal",
        position: "wrist",
        confidence: 0.85,
      },
    ],
    dominantColors: ["#0a3b6c", "#1e3d59", "#f5f0e1"],
    patterns: ["solid"],
    style: {
      formal: 0.1,
      casual: 0.9,
      sporty: 0.3,
      business: 0.2,
      vintage: 0.1,
      trendy: 0.7,
    },
    season: "all-season",
    occasions: ["casual outing", "everyday wear", "shopping"],
    hasBottomGarment: true,
  }
}
