import { getCachedData, setCachedData, generateCacheKey } from "./cache-utils"
import { recordAnalysisResult, recordAnalysisError } from "./mcp-protocol"

// Load environment variables
const XAI_API_KEY =
  process.env.xai_key || "xai-5KCWiybVRlYYEfY8PU89Yt1VLETdVfDfBsFLaav3QM2sKZtrxkP0zpfhsMu2FtCyLZ442ljw1zldRt8o"

// Feedback storage for model training
type FeedbackEntry = {
  imageData: string
  analysis: any
  feedback: "upvote" | "downvote"
  timestamp: number
}

let feedbackData: FeedbackEntry[] = []

export async function initModels() {
  console.log("Initializing models...")
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
 * Analyzes an outfit image using the Grok-2-Vision model with caching
 */
export async function analyzeOutfit(imageData: string): Promise<{
  categories: { [category: string]: number }
  styleAttributes: { [attribute: string]: number }
  colorAnalysis: {
    dominant: string
    palette: string[]
    contrast: number
    harmony: number
  }
  comfort: number
  fitConfidence: number
  colorHarmony: number
}> {
  // Check cache first
  const cacheKey = generateCacheKey(imageData)
  const cachedResult = getCachedData(cacheKey)

  if (cachedResult) {
    console.log("Using cached analysis result")
    return cachedResult
  }

  const startTime = Date.now()
  try {
    // Prepare the prompt for the vision model
    const prompt = `
      Analyze this outfit image in detail. Provide a structured JSON response with the following:
      
      1. Clothing categories present in the image with confidence scores (0-1):
         - top, bottom, dress, outerwear, footwear, accessory, headwear
      
      2. Style attributes with confidence scores (0-1):
         - casual, formal, business, sporty, vintage, trendy, elegant, bohemian
      
      3. Color analysis:
         - dominant: The dominant color in hex code
         - palette: Array of 4 main colors in hex codes
         - contrast: A score from 0-1 indicating color contrast
         - harmony: A score from 0-1 indicating color harmony
      
      4. Comfort score (0-100): How comfortable the outfit appears to be
      
      5. Fit confidence score (0-100): How well the clothes fit the person
      
      6. Color harmony score (0-100): How well the colors work together
      
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
    console.log("Grok API response:", data)

    // Extract the content from the response
    const content = data.choices[0].message.content

    // Parse the JSON response
    let analysisResult
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

    // Prepare the structured result
    const result = {
      categories: analysisResult.categories || {
        top: 0.8,
        bottom: 0.7,
        dress: 0.2,
        outerwear: 0.3,
        footwear: 0.1,
        accessory: 0.4,
        headwear: 0.1,
      },
      styleAttributes: analysisResult.styleAttributes || {
        casual: 0.7,
        formal: 0.3,
        business: 0.2,
        sporty: 0.1,
        vintage: 0.4,
        trendy: 0.6,
        elegant: 0.3,
        bohemian: 0.2,
      },
      colorAnalysis: analysisResult.colorAnalysis || {
        dominant: "#336699",
        palette: ["#336699", "#993366", "#669933", "#663399"],
        contrast: 0.7,
        harmony: 0.8,
      },
      comfort: analysisResult.comfort || 75,
      fitConfidence: analysisResult.fitConfidence || 80,
      colorHarmony: analysisResult.colorHarmony || 85,
    }

    // Cache the result
    setCachedData(cacheKey, result)

    // Record the successful analysis in MCP
    await recordAnalysisResult(imageData, "outfit", result, { startTime })

    return result
  } catch (error) {
    console.error("Error analyzing outfit with Grok-2-Vision:", error)

    // Fallback to mock data if the API call fails
    const fallbackResult = fallbackAnalysis()

    // Cache the fallback result too
    setCachedData(cacheKey, fallbackResult)

    // Record the error in MCP
    await recordAnalysisError(imageData, "outfit", error instanceof Error ? error : new Error(String(error)), {
      startTime,
    })

    return fallbackResult
  }
}

/**
 * Fallback analysis with mock data in case the API call fails
 */
function fallbackAnalysis() {
  // Generate random scores
  const getRandomScore = () => Math.floor(Math.random() * 40) + 60 // 60-100 range

  return {
    categories: {
      top: 0.8,
      bottom: 0.7,
      dress: 0.2,
      outerwear: 0.3,
      footwear: 0.1,
      accessory: 0.4,
      headwear: 0.1,
    },
    styleAttributes: {
      casual: 0.7,
      formal: 0.3,
      business: 0.2,
      sporty: 0.1,
      vintage: 0.4,
      trendy: 0.6,
      elegant: 0.3,
      bohemian: 0.2,
    },
    colorAnalysis: {
      dominant: "#336699",
      palette: ["#336699", "#993366", "#669933", "#663399"],
      contrast: 0.7,
      harmony: 0.8,
    },
    comfort: getRandomScore(),
    fitConfidence: getRandomScore(),
    colorHarmony: getRandomScore(),
  }
}

/**
 * Match an outfit to an occasion based on style attributes
 */
export async function matchOutfitToOccasion(imageData: string, occasion: string): Promise<number> {
  // Check cache first
  const cacheKey = generateCacheKey(imageData, { occasion })
  const cachedResult = getCachedData(cacheKey)

  if (cachedResult !== null) {
    console.log("Using cached occasion match result")
    return cachedResult
  }

  const startTime = Date.now()
  try {
    // Analyze the outfit first
    const analysis = await analyzeOutfit(imageData)

    // Define ideal style attributes for different occasions
    const occasionToAttributes: { [key: string]: { [attr: string]: number } } = {
      "job interview": { formal: 0.8, business: 0.9, elegant: 0.7, casual: 0.1 },
      "date night": { elegant: 0.8, trendy: 0.7, formal: 0.5, casual: 0.3 },
      "casual outing": { casual: 0.9, sporty: 0.7, trendy: 0.6, formal: 0.1 },
      wedding: { formal: 0.9, elegant: 0.8, trendy: 0.5, casual: 0.1 },
      workout: { sporty: 0.9, casual: 0.7, trendy: 0.4, formal: 0.0 },
      "business meeting": { business: 0.9, formal: 0.8, elegant: 0.7, casual: 0.1 },
    }

    // Default mapping for unknown occasions
    const defaultMapping = { casual: 0.5, trendy: 0.5, formal: 0.5, elegant: 0.5 }

    // Get the attribute weights for this occasion
    const attributeWeights = occasionToAttributes[occasion.toLowerCase()] || defaultMapping

    // Calculate a match score (0-100)
    let matchScore = 50 // Base score
    let totalWeight = 0
    let weightedSum = 0

    // Calculate weighted score based on style attributes
    Object.entries(attributeWeights).forEach(([attr, weight]) => {
      const attrScore = analysis.styleAttributes[attr as keyof typeof analysis.styleAttributes] || 0
      weightedSum += attrScore * weight
      totalWeight += weight
    })

    if (totalWeight > 0) {
      matchScore = (weightedSum / totalWeight) * 100
    }

    // Add some influence from comfort and fit
    matchScore = matchScore * 0.6 + analysis.comfort * 0.2 + analysis.fitConfidence * 0.2

    // Ensure score is within 0-100 range
    matchScore = Math.min(100, Math.max(0, matchScore))
    const finalScore = Math.round(matchScore)

    // Cache the result
    setCachedData(cacheKey, finalScore)

    // Record the successful analysis in MCP
    await recordAnalysisResult(imageData, "occasion", { occasion, score: finalScore }, { startTime })

    return finalScore
  } catch (error) {
    console.error("Error matching outfit to occasion:", error)
    // Return a fallback score
    const fallbackScore = 70 + Math.floor(Math.random() * 20)

    // Cache the fallback result too
    setCachedData(cacheKey, fallbackScore)

    // Record the error in MCP
    await recordAnalysisError(imageData, "occasion", error instanceof Error ? error : new Error(String(error)), {
      startTime,
      occasion,
    })

    return fallbackScore
  }
}

/**
 * Get AI-generated style suggestions for an outfit
 */
export async function getStyleSuggestions(imageData: string, occasion: string): Promise<string[]> {
  // Check cache first
  const cacheKey = generateCacheKey(imageData, { suggestion: occasion })
  const cachedResult = getCachedData(cacheKey)

  if (cachedResult !== null) {
    console.log("Using cached style suggestions")
    return cachedResult
  }

  const startTime = Date.now()
  try {
    // Prepare the prompt for the model
    const prompt = `
      I'm wearing an outfit for a "${occasion}". Based on the image of my outfit, please provide 3-5 specific style suggestions to improve it.
      
      Format your response as a JSON array of strings, with each string being a specific suggestion.
      Example: ["Add a belt to define your waist", "Consider a darker shoe to balance the outfit", "A statement necklace would elevate this look"]
      
      Return ONLY the JSON array with no additional text.
    `

    // Make the API request to Grok-3-mini
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
            content: "You are a fashion stylist assistant that provides helpful, specific style suggestions.",
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
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    console.log("Style suggestions API response:", data)

    // Extract the content from the response
    const content = data.choices[0].message.content

    // Parse the JSON response
    let suggestions: string[] = []
    try {
      // Try to parse the entire response as JSON
      suggestions = JSON.parse(content)
    } catch (e) {
      // If that fails, try to extract JSON from the text
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/)

      if (jsonMatch) {
        try {
          suggestions = JSON.parse(jsonMatch[1] || jsonMatch[0])
        } catch (e2) {
          console.error("Failed to parse JSON from response:", e2)
          // Extract suggestions using regex as a last resort
          const suggestionMatches = content.match(/["'](.+?)["']/g)
          if (suggestionMatches) {
            suggestions = suggestionMatches.map((m) => m.replace(/^["']|["']$/g, ""))
          } else {
            throw new Error("Failed to parse suggestions")
          }
        }
      } else {
        // If we can't parse JSON, try to extract bullet points or numbered lists
        const lines = content.split("\n").filter((line) => line.trim().match(/^[-*•]|^\d+\./) && line.length > 10)

        if (lines.length > 0) {
          suggestions = lines.map((line) => line.replace(/^[-*•]|^\d+\.\s*/, "").trim())
        } else {
          throw new Error("No suggestions found in response")
        }
      }
    }

    // Ensure we have valid suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error("Invalid suggestions format")
    }

    // Cache the result
    setCachedData(cacheKey, suggestions)

    // Record the successful analysis in MCP
    await recordAnalysisResult(imageData, "occasion", { occasion, suggestions }, { startTime })

    return suggestions
  } catch (error) {
    console.error("Error getting style suggestions:", error)

    // Fallback suggestions
    const fallbackSuggestions = [
      "Consider adding accessories to enhance your outfit",
      "Try layering for more visual interest",
      "Ensure your colors complement each other well",
      "Pay attention to fit - it's key to looking polished",
    ]

    // Cache the fallback result too
    setCachedData(cacheKey, fallbackSuggestions)

    // Record the error in MCP
    await recordAnalysisError(imageData, "occasion", error instanceof Error ? error : new Error(String(error)), {
      startTime,
      occasion,
    })

    return fallbackSuggestions
  }
}

/**
 * Record user feedback for model training
 */
export function recordFeedback(imageData: string, analysis: any, feedback: "upvote" | "downvote") {
  feedbackData.push({
    imageData,
    analysis,
    feedback,
    timestamp: Date.now(),
  })

  console.log(`Recorded ${feedback} for analysis`)
  return feedbackData.length
}

/**
 * Get all feedback data for model training
 */
export function getFeedbackData() {
  return feedbackData
}

/**
 * Clear all feedback data
 */
export function clearFeedbackData() {
  feedbackData = []
  return true
}
