/**
 * Model Context Protocol (MCP)
 * Handles communication between the UI and backend logic (API calls, FS operations).
 */

import {
  saveImage as fsSaveImage, // Renamed to avoid conflict
  saveAnalysisData,
  getAnalysisData,
  listAnalysisData,
  deleteAnalysis as fsDeleteAnalysis,
  clearAnalysisData,
  initDataDirectories, // Added for init
  saveFeedbackData as fsSaveFeedbackData, // Renamed
  listFeedbackData,
  clearFeedbackData as fsClearFeedbackData, // Renamed
  removeFeedback as fsRemoveFeedback, // Renamed
} from './fs-utils';
import { v4 as uuidv4 } from 'uuid';
import { 
  analyzeOutfit as serverAnalyzeOutfit, 
  matchOutfitToOccasion as serverMatchOutfitToOccasion,
  getStyleSuggestions as serverGetStyleSuggestions
} from './ml-service'; // Import server-side analysis functions
import { analyzeOutfitDetails as serverAnalyzeOutfitDetails } from './clothing-analysis-service'; // Import server-side analysis function

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Analysis result types
export interface AnalysisResult {
  id: string
  timestamp: number
  imageId: string
  imageData?: string // Included when sending to store, removed before saving JSON
  analysisType: "outfit" | "detailed" | "occasion" | "suggestion" // Added suggestion type
  result: any
  status: "success" | "error" | "processing"
  error?: string
  metadata?: Record<string, any>
  queryTags?: string[]
}

// MCP Operation types
export type MCPOperation =
  // Core Data Operations
  | { type: "FETCH_ANALYSES"; filters?: AnalysisFilters }
  | { type: "GET_ANALYSIS"; id: string }
  | { type: "STORE_ANALYSIS"; analysis: AnalysisResult }
  | { type: "DELETE_ANALYSIS"; id: string }
  | { type: "CLEAR_ANALYSES" }
  | { type: "GET_STATS" }
  | { type: "SEARCH_ANALYSES"; query: string }
  // Initialization
  | { type: "INIT_STORAGE" }
  // Image Handling (Saving only, getting is via direct URL)
  | { type: "SAVE_IMAGE"; imageData: string; imageId?: string }
  // Feedback Handling
  | { type: "SAVE_FEEDBACK"; imageId: string; analysisId: string; feedback: "upvote" | "downvote" }
  | { type: "REMOVE_FEEDBACK"; analysisId: string }
  | { type: "GET_FEEDBACK" }
  | { type: "CLEAR_FEEDBACK" }
  // Analysis Triggers
  | { type: "ANALYZE_OUTFIT"; imageData: string }
  | { type: "ANALYZE_DETAILS"; imageData: string }
  | { type: "MATCH_OCCASION"; imageData: string; occasion: string }
  | { type: "GET_SUGGESTIONS"; imageData: string; occasion: string }


// Filters for analysis results
export interface AnalysisFilters {
  analysisType?: "outfit" | "detailed" | "occasion" | "suggestion"
  startDate?: number
  endDate?: number
  status?: "success" | "error" | "processing"
  sortBy?: "timestamp" | "analysisType" | "status"
  sortDirection?: "asc" | "desc"
  limit?: number
  offset?: number
  tags?: string[]
  query?: string
}

// Stats about analysis operations
export interface AnalysisStats {
  totalAnalyses: number
  successfulAnalyses: number
  failedAnalyses: number
  processingAnalyses: number // Note: Processing status might be short-lived on serverless
  byType: Record<string, number>
  averageProcessingTime: number
  lastUpdated: number
}

// No longer needed - logic moved into executeMCPOperation
// async function clientExecuteMCPOperation(operation: MCPOperation): Promise<any> { ... }

// Initialize MCP - No FS operations here, done via INIT_STORAGE
export function initMCP(): void {
  console.log("MCP initialized");
}

// Execute an MCP operation - handles both client and server
export async function executeMCPOperation(operation: MCPOperation): Promise<any> {
  const startTime = Date.now(); // For timing analysis operations

  // Client-side: Send operation to the API endpoint
  if (!isServer) {
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MCP API request failed with status ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error executing client MCP operation ${operation.type}:`, error);
      throw error; // Re-throw for handling by caller (e.g., UI)
    }
  }

  // Server-side: Execute the operation directly
  try {
    switch (operation.type) {
      // Core Data
      case "FETCH_ANALYSES":
        return await fetchAnalyses(operation.filters);
      case "GET_ANALYSIS":
        return await getAnalysis(operation.id);
      case "STORE_ANALYSIS":
        return await storeAnalysis(operation.analysis);
      case "DELETE_ANALYSIS":
        return await deleteAnalysis(operation.id);
      case "CLEAR_ANALYSES":
        return await clearAnalyses();
      case "GET_STATS":
        return await getAnalysisStats();
      case "SEARCH_ANALYSES":
        return await searchAnalyses(operation.query);

      // Initialization
      case "INIT_STORAGE":
        return await initDataDirectories();

      // Image
      case "SAVE_IMAGE":
        return { imageId: await fsSaveImage(operation.imageData, operation.imageId) };

      // Feedback
      case "SAVE_FEEDBACK":
        await fsSaveFeedbackData(operation.imageId, operation.analysisId, {
          feedback: operation.feedback,
          timestamp: Date.now()
        });
        return { success: true };
      case "REMOVE_FEEDBACK":
        return { success: await fsRemoveFeedback(operation.analysisId) };
      case "GET_FEEDBACK":
        return await listFeedbackData(); // Use listFeedbackData which gets all
      case "CLEAR_FEEDBACK":
        return { success: await fsClearFeedbackData() };


      // Analysis Triggers (Server-side performs analysis and records result)
      case "ANALYZE_OUTFIT":
        try {
          const result = await serverAnalyzeOutfit(operation.imageData);
          // recordAnalysisResult returns the full AnalysisResult object
          return await recordAnalysisResult(operation.imageData, "outfit", result, { startTime });
        } catch (error) {
          // recordAnalysisError returns the full AnalysisResult object with error status
          return await recordAnalysisError(operation.imageData, "outfit", error instanceof Error ? error : new Error(String(error)), { startTime });
          // No need to re-throw here if the caller expects the AnalysisResult object
        }
      case "ANALYZE_DETAILS":
         try {
           const result = await serverAnalyzeOutfitDetails(operation.imageData);
           // recordAnalysisResult returns the full AnalysisResult object
           return await recordAnalysisResult(operation.imageData, "detailed", result, { startTime });
         } catch (error) {
           // recordAnalysisError returns the full AnalysisResult object with error status
           return await recordAnalysisError(operation.imageData, "detailed", error instanceof Error ? error : new Error(String(error)), { startTime });
           // No need to re-throw here if the caller expects the AnalysisResult object
         }
      case "MATCH_OCCASION":
        try {
          const score = await serverMatchOutfitToOccasion(operation.imageData, operation.occasion);
          // recordAnalysisResult returns the full AnalysisResult object
          return await recordAnalysisResult(operation.imageData, "occasion", { occasion: operation.occasion, score }, { startTime });
        } catch (error) {
          // recordAnalysisError returns the full AnalysisResult object with error status
          return await recordAnalysisError(operation.imageData, "occasion", error instanceof Error ? error : new Error(String(error)), { startTime, occasion: operation.occasion });
          // No need to re-throw here if the caller expects the AnalysisResult object
        }
      case "GET_SUGGESTIONS":
         try {
           const suggestions = await serverGetStyleSuggestions(operation.imageData, operation.occasion);
           // recordAnalysisResult returns the full AnalysisResult object
           return await recordAnalysisResult(operation.imageData, "suggestion", { occasion: operation.occasion, suggestions }, { startTime });
         } catch (error) {
           // recordAnalysisError returns the full AnalysisResult object with error status
           return await recordAnalysisError(operation.imageData, "suggestion", error instanceof Error ? error : new Error(String(error)), { startTime, occasion: operation.occasion });
           // No need to re-throw here if the caller expects the AnalysisResult object
         }

      default:
        // Ensure exhaustive type checking
        const _: never = operation;
        throw new Error(`Unknown server-side operation type: ${(_ as any).type}`);

    }
  } catch (error) {
    console.error(`Error executing server MCP operation ${(operation as any).type}:`, error);
    // If an error occurs outside the specific analysis try/catch blocks,
    // return a generic error structure or re-throw depending on desired API behavior.
    // Returning a structured error might be better for the client.
    return {
       id: generateAnalysisId(),
       timestamp: Date.now(),
       imageId: 'unknown', // Or try to get from operation if possible
       analysisType: (operation as any).type, // Indicate the operation type
       result: null,
       status: "error",
       error: `Server error during MCP operation: ${error instanceof Error ? error.message : String(error)}`,
    } as AnalysisResult;
  }
}


// Helper to record an analysis result
export async function recordAnalysisResult(
  imageData: string,
  analysisType: "outfit" | "detailed" | "occasion" | "suggestion",
  result: any,
  metadata?: Record<string, any>,
): Promise<AnalysisResult> {
  // This function should ONLY be called on the server side now
  if (!isServer) {
     throw new Error("recordAnalysisResult can only be called on the server.");
  }
  try {
    const startTime = metadata?.startTime || Date.now(); // Use provided start time or now
    const endTime = Date.now();
    const imageId = uuidv4(); // Generate a new imageId for this analysis instance

    const analysis: AnalysisResult = {
      id: generateAnalysisId(),
      timestamp: endTime,
      imageId,
      // imageData: imageData, // Keep imageData temporarily for saving
      analysisType,
      result,
      status: "success",
      metadata: {
        ...metadata,
        processingTimeMs: endTime - startTime,
      },
    };

    // Store analysis, passing imageData separately for saving
    return await storeAnalysis(analysis, imageData);
  } catch (error) {
    console.error("Error recording analysis result:", error);
    throw error;
  }
}

// Helper to record an analysis error
export async function recordAnalysisError(
  imageData: string,
  analysisType: "outfit" | "detailed" | "occasion" | "suggestion",
  error: Error,
  metadata?: Record<string, any>,
): Promise<AnalysisResult> {
   // This function should ONLY be called on the server side now
   if (!isServer) {
      throw new Error("recordAnalysisError can only be called on the server.");
   }
  try {
    const startTime = metadata?.startTime || Date.now();
    const endTime = Date.now();
    const imageId = uuidv4(); // Generate a new imageId for this error instance

    const analysis: AnalysisResult = {
      id: generateAnalysisId(),
      timestamp: endTime,
      imageId,
      // imageData: imageData, // Keep imageData temporarily for saving
      analysisType,
      result: null,
      status: "error",
      error: error.message,
      metadata: {
        ...metadata,
        processingTimeMs: endTime - startTime,
        errorStack: error.stack, // Include stack trace if available
      },
    };

    // Store analysis, passing imageData separately for saving
    return await storeAnalysis(analysis, imageData);
  } catch (error) {
    console.error("Error recording analysis error:", error);
    // Avoid infinite loops if storing the error itself fails
    throw new Error(`Failed to record analysis error: ${error instanceof Error ? error.message : String(error)}`);
  }
}


// --- Server-Side Implementations of MCP Operations ---

// Fetch analyses with optional filters
async function fetchAnalyses(filters?: AnalysisFilters): Promise<AnalysisResult[]> {
  // Ensure this runs only on the server
  if (!isServer) throw new Error("fetchAnalyses can only run on the server.");
  try {
    let analyses = await listAnalysisData(); // Gets all analysis JSON files

    // Apply filters (ensure AnalysisResult type is used for filtering)
    if (filters) {
       if (filters.analysisType) {
         analyses = analyses.filter((a: AnalysisResult) => a.analysisType === filters.analysisType);
       }
       if (filters.startDate !== undefined) {
         analyses = analyses.filter((a: AnalysisResult) => a.timestamp >= filters.startDate!);
       }
       if (filters.endDate !== undefined) {
         analyses = analyses.filter((a: AnalysisResult) => a.timestamp <= filters.endDate!);
       }
       if (filters.status) {
         analyses = analyses.filter((a: AnalysisResult) => a.status === filters.status);
       }
       if (filters.tags && filters.tags.length > 0) {
         analyses = analyses.filter((a: AnalysisResult) =>
           a.queryTags && filters.tags!.some(tag => a.queryTags!.includes(tag))
         );
       }
       if (filters.query) {
         const query = filters.query.toLowerCase();
         analyses = analyses.filter((a: AnalysisResult) => {
           const resultStr = JSON.stringify(a.result || {}).toLowerCase();
           const metadataStr = JSON.stringify(a.metadata || {}).toLowerCase();
           const typeMatch = a.analysisType.toLowerCase().includes(query);
           const errorMatch = (a.error || '').toLowerCase().includes(query);
           return resultStr.includes(query) || metadataStr.includes(query) || typeMatch || errorMatch;
         });
       }

      // Sort
      const sortBy = filters.sortBy || 'timestamp';
      const sortDirection = filters.sortDirection || 'desc';
      analyses.sort((a: AnalysisResult, b: AnalysisResult) => {
        const aValue = a[sortBy as keyof AnalysisResult];
        const bValue = b[sortBy as keyof AnalysisResult];
        // Basic comparison, needs refinement for complex types if necessary
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Apply limit and offset
      if (filters.offset !== undefined) {
        analyses = analyses.slice(filters.offset);
      }
      if (filters.limit !== undefined) {
        analyses = analyses.slice(0, filters.limit);
      }
    }

    return analyses;
  } catch (error) {
    console.error("Error fetching analyses:", error);
    return []; // Return empty array on error
  }
}

// Get a specific analysis by ID
async function getAnalysis(id: string): Promise<AnalysisResult | null> {
  if (!isServer) throw new Error("getAnalysis can only run on the server.");
  try {
    // Assuming getAnalysisData returns the correct AnalysisResult structure
    return await getAnalysisData(id);
  } catch (error) {
    // fs-utils getAnalysisData already logs the error
    // console.error(`Error getting analysis ${id}:`, error);
    return null; // Return null if not found or error occurs
  }
}

// Store a new analysis result (including saving image)
async function storeAnalysis(analysis: AnalysisResult, imageData?: string): Promise<AnalysisResult> {
  if (!isServer) throw new Error("storeAnalysis can only run on the server.");
  try {
    // 1. Save the image if imageData is provided
    if (imageData) {
      // Use the imageId already present in the analysis object
      await fsSaveImage(imageData, analysis.imageId);
    } else if (!analysis.imageId) {
       // This case should ideally not happen if imageId is always generated
       console.warn(`Storing analysis ${analysis.id} without imageData or imageId.`);
       analysis.imageId = 'missing-image-' + analysis.id; // Assign a placeholder
    }

    // 2. Generate query tags
    analysis.queryTags = generateQueryTags(analysis);

    // 3. Save the analysis JSON data (without imageData)
    const analysisToSave = { ...analysis, imageData: undefined };
    await saveAnalysisData(analysis.id, analysisToSave); // Use analysis.id as the filename

    // Return the original analysis object (or the modified one without imageData)
    return analysisToSave;
  } catch (error) {
    console.error("Error storing analysis:", error);
    throw error; // Re-throw to be caught by the caller
  }
}


// Helper function to generate search tags from analysis data
function generateQueryTags(analysis: AnalysisResult): string[] {
  const tags: string[] = [analysis.analysisType];
  tags.push(analysis.status);

  if (analysis.result) {
    try {
      if (analysis.analysisType === 'outfit' && typeof analysis.result === 'object') {
        // Add clothing categories with high confidence
        const categories = analysis.result.categories;
        if (categories) {
          Object.entries(categories).forEach(([category, confidence]) => {
            if ((confidence as number) > 0.7) tags.push(category);
          });
        }
        // Add style attributes with high confidence
        const styles = analysis.result.styleAttributes;
        if (styles) {
          Object.entries(styles).forEach(([style, confidence]) => {
            if ((confidence as number) > 0.7) tags.push(style);
          });
        }
      } else if (analysis.analysisType === 'detailed' && typeof analysis.result === 'object') {
         // Add clothing item types
         if (Array.isArray(analysis.result.clothingItems)) {
           analysis.result.clothingItems.forEach((item: any) => item.type && tags.push(item.type));
         }
         // Add accessory types
         if (Array.isArray(analysis.result.accessories)) {
           analysis.result.accessories.forEach((item: any) => item.type && tags.push(item.type));
         }
         // Add patterns
         if (Array.isArray(analysis.result.patterns)) {
           analysis.result.patterns.forEach((pattern: string) => tags.push(pattern));
         }
         // Add season
         if (analysis.result.season) tags.push(analysis.result.season);
      } else if (analysis.analysisType === 'occasion' && typeof analysis.result === 'object') {
        if (analysis.result.occasion) tags.push(analysis.result.occasion);
      } else if (analysis.analysisType === 'suggestion' && typeof analysis.result === 'object') {
         if (analysis.result.occasion) tags.push(analysis.result.occasion);
         // Maybe add keywords from suggestions? (Could get noisy)
      }
    } catch (e) {
      console.warn(`Error generating query tags for analysis ${analysis.id}:`, e);
    }
  }

  // Add error message words as tags? (Could be useful but also noisy)
  // if (analysis.status === 'error' && analysis.error) {
  //   analysis.error.toLowerCase().split(/\s+/).forEach(word => tags.push(word));
  // }

  // Return unique, non-empty tags
  return [...new Set(tags.filter(Boolean))];
}


// Delete an analysis by ID
async function deleteAnalysis(id: string): Promise<boolean> {
  if (!isServer) throw new Error("deleteAnalysis can only run on the server.");
  try {
    // We might also want to delete the associated image, but that requires care
    // if multiple analyses could potentially share an imageId (currently they don't).
    // For now, just delete the analysis JSON.
    return await fsDeleteAnalysis(id);
  } catch (error) {
    console.error(`Error deleting analysis ${id}:`, error);
    return false;
  }
}

// Clear all analyses
async function clearAnalyses(): Promise<boolean> {
  if (!isServer) throw new Error("clearAnalyses can only run on the server.");
  try {
    // Similarly, consider if images should be cleared. For now, only analysis JSON.
    return await clearAnalysisData();
  } catch (error) {
    console.error("Error clearing analyses:", error);
    return false;
  }
}

// Search analyses by text query
async function searchAnalyses(query: string): Promise<AnalysisResult[]> {
  if (!isServer) throw new Error("searchAnalyses can only run on the server.");
  // Use fetchAnalyses with the query filter
  return await fetchAnalyses({ query });
}

// Get statistics about analyses
async function getAnalysisStats(): Promise<AnalysisStats> {
  if (!isServer) throw new Error("getAnalysisStats can only run on the server.");
  try {
    const analyses = await listAnalysisData(); // Gets all analysis data

    const totalAnalyses = analyses.length;
    const successfulAnalyses = analyses.filter((r: AnalysisResult) => r.status === "success").length;
    const failedAnalyses = analyses.filter((r: AnalysisResult) => r.status === "error").length;
    // Processing status is unlikely to persist in files unless explicitly saved that way
    const processingAnalyses = analyses.filter((r: AnalysisResult) => r.status === "processing").length;

    const byType: Record<string, number> = {};
    analyses.forEach((r: AnalysisResult) => {
      byType[r.analysisType] = (byType[r.analysisType] || 0) + 1;
    });

    const successfulAnalysesWithMetadata = analyses.filter(
      (r: AnalysisResult) => r.status === "success" && r.metadata?.processingTimeMs
    );

    const averageProcessingTime =
      successfulAnalysesWithMetadata.length > 0
        ? successfulAnalysesWithMetadata.reduce((sum: number, r: AnalysisResult) => sum + (r.metadata?.processingTimeMs || 0), 0) /
          successfulAnalysesWithMetadata.length
        : 0;

    return {
      totalAnalyses,
      successfulAnalyses,
      failedAnalyses,
      processingAnalyses,
      byType,
      averageProcessingTime: Math.round(averageProcessingTime), // Round to integer
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error("Error getting analysis stats:", error);
    // Return default stats on error
    return {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      processingAnalyses: 0,
      byType: {},
      averageProcessingTime: 0,
      lastUpdated: Date.now()
    };
  }
}

// Helper to generate a unique ID for analysis records
export function generateAnalysisId(): string {
  return uuidv4();
}
