import { getCachedData, setCachedData, generateCacheKey } from "./cache-utils";
import { executeMCPOperation, type MCPOperation } from "./mcp-protocol"; // Import the unified function and MCPOperation type

// Initialize data storage by calling the MCP operation
export async function initializeDataStorage() {
  try {
    const result = await executeMCPOperation({ type: "INIT_STORAGE" });
    return result.success; // Assuming the operation returns { success: boolean }
  } catch (error) {
    console.error('Error initializing data storage via MCP:', error);
    return false;
  }
}

// Client-side version of analyzeOutfit that uses the MCP operation
export async function analyzeOutfit(imageData: string) {
  // Check cache first
  const cacheKey = generateCacheKey(imageData, "outfit-analysis"); // More specific key
  const cachedResult = getCachedData(cacheKey);

  if (cachedResult) {
    console.log("Using cached analysis result");
    return cachedResult;
  }

  try {
    // Execute the analysis operation via MCP
    // The result here IS the AnalysisResult object recorded on the server
    const analysisResult = await executeMCPOperation({ type: "ANALYZE_OUTFIT", imageData });

    // Cache the actual analysis content
    setCachedData(cacheKey, analysisResult.result);
    return analysisResult.result; // Return only the 'result' part for consistency
  } catch (error) {
    console.error("Error in client-side analyzeOutfit via MCP:", error);
    // Don't return fallback data, let the error propagate
    throw error;
  }
}

// Client-side version of matchOutfitToOccasion that uses the MCP operation
export async function matchOutfitToOccasion(imageData: string, occasion: string) {
  // Check cache first
  const cacheKey = generateCacheKey(imageData, { occasion });
  const cachedResult = getCachedData(cacheKey);

  if (cachedResult !== null) {
    console.log("Using cached occasion match result");
    return cachedResult;
  }

  try {
     // Execute the match operation via MCP
     // The result here IS the AnalysisResult object recorded on the server
    const analysisResult = await executeMCPOperation({ type: "MATCH_OCCASION", imageData, occasion });

    // Cache the score
    setCachedData(cacheKey, analysisResult.result.score);
    return analysisResult.result.score; // Return only the score
  } catch (error) {
    console.error("Error in client-side matchOutfitToOccasion via MCP:", error);
    // Don't return fallback data, let the error propagate
    throw error;
  }
}

// Client-side version of getStyleSuggestions that uses the MCP operation
export async function getStyleSuggestions(imageData: string, occasion: string): Promise<string[]> {
   // Check cache first
   const cacheKey = generateCacheKey(imageData, { suggestion: occasion });
   const cachedResult = getCachedData(cacheKey);

   if (cachedResult !== null) {
     console.log("Using cached style suggestions");
     return cachedResult;
   }

   try {
     // Execute the suggestion operation via MCP
     // The result here IS the AnalysisResult object recorded on the server
     const analysisResult = await executeMCPOperation({ type: "GET_SUGGESTIONS", imageData, occasion });

     // Cache the suggestions
     setCachedData(cacheKey, analysisResult.result.suggestions);
     return analysisResult.result.suggestions; // Return only the suggestions array
   } catch (error) {
     console.error("Error in client-side getStyleSuggestions via MCP:", error);
     // Don't return fallback data, let the error propagate
     throw error;
   }
}


// Client-side version of getFeedbackData that uses the MCP operation
export async function getFeedbackData() {
  try {
    // Execute the get feedback operation via MCP
    return await executeMCPOperation({ type: "GET_FEEDBACK" });
  } catch (error) {
    console.error("Error in client-side getFeedbackData via MCP:", error);
    return []; // Return empty array on error
  }
}

// Client-side version of recordFeedback that uses the MCP operation
export async function recordFeedback(imageData: string, analysis: any, feedback: "upvote" | "downvote" | null) {
  try {
    if (!analysis || !analysis.id) {
      console.error("Missing analysis or analysis ID for feedback");
      return false;
    }

    const imageId = analysis.imageId || 'unknown'; // Get imageId if available
    const analysisId = analysis.id;

    let operation: MCPOperation; // Use the imported type
    if (feedback === null) {
      // Remove feedback
      operation = { type: "REMOVE_FEEDBACK", analysisId };
    } else {
      // Add/update feedback
      operation = { type: "SAVE_FEEDBACK", imageId, analysisId, feedback };
    }

    const result = await executeMCPOperation(operation);
    return result.success; // Assuming operation returns { success: boolean }
  } catch (error) {
    console.error("Error in client-side recordFeedback via MCP:", error);
    return false;
  }
}

// Client-side version of clearFeedbackData that uses the MCP operation
export async function clearFeedbackData() {
  try {
    const result = await executeMCPOperation({ type: "CLEAR_FEEDBACK" });
    return result.success; // Assuming operation returns { success: boolean }
  } catch (error) {
    console.error("Error in client-side clearFeedbackData via MCP:", error);
    return false;
  }
}

// Client-side function to save an image via MCP
export async function saveImage(imageData: string, imageId?: string): Promise<string> {
   try {
     const result = await executeMCPOperation({ type: "SAVE_IMAGE", imageData, imageId });
     return result.imageId; // Assuming operation returns { imageId: string }
   } catch (error) {
     console.error("Error saving image via MCP:", error);
     throw error;
   }
}