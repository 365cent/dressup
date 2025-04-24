/**
 * Machine Learning Control Protocol (MCP)
 * Handles communication between the UI and ML models
 */

import { getCachedData, setCachedData } from "./cache-utils"

// Analysis result types
export interface AnalysisResult {
  id: string
  timestamp: number
  imageData: string
  analysisType: "outfit" | "detailed" | "occasion"
  result: any
  status: "success" | "error" | "processing"
  error?: string
  metadata?: Record<string, any>
}

// MCP Operation types
export type MCPOperation =
  | { type: "FETCH_ANALYSES"; filters?: AnalysisFilters }
  | { type: "GET_ANALYSIS"; id: string }
  | { type: "STORE_ANALYSIS"; analysis: AnalysisResult }
  | { type: "DELETE_ANALYSIS"; id: string }
  | { type: "CLEAR_ANALYSES" }
  | { type: "GET_STATS" }

// Filters for analysis results
export interface AnalysisFilters {
  analysisType?: "outfit" | "detailed" | "occasion"
  startDate?: number
  endDate?: number
  status?: "success" | "error" | "processing"
  sortBy?: "timestamp" | "analysisType" | "status"
  sortDirection?: "asc" | "desc"
  limit?: number
  offset?: number
}

// Stats about analysis operations
export interface AnalysisStats {
  totalAnalyses: number
  successfulAnalyses: number
  failedAnalyses: number
  processingAnalyses: number
  byType: Record<string, number>
  averageProcessingTime: number
}

// In-memory storage for analysis results
let analysisResults: AnalysisResult[] = []

// Cache key for persistent storage
const ANALYSIS_CACHE_KEY = "mcp_analysis_results"

// Initialize MCP by loading cached data
export function initMCP(): void {
  const cachedResults = getCachedData(ANALYSIS_CACHE_KEY)
  if (cachedResults && Array.isArray(cachedResults)) {
    analysisResults = cachedResults
    console.log(`MCP initialized with ${analysisResults.length} cached analyses`)
  } else {
    console.log("MCP initialized with empty analysis store")
  }
}

// Save current state to cache
function persistAnalyses(): void {
  setCachedData(ANALYSIS_CACHE_KEY, analysisResults)
}

// Execute an MCP operation
export async function executeMCPOperation(operation: MCPOperation): Promise<any> {
  console.log(`Executing MCP operation: ${operation.type}`)

  try {
    switch (operation.type) {
      case "FETCH_ANALYSES":
        return fetchAnalyses(operation.filters)

      case "GET_ANALYSIS":
        return getAnalysis(operation.id)

      case "STORE_ANALYSIS":
        return storeAnalysis(operation.analysis)

      case "DELETE_ANALYSIS":
        return deleteAnalysis(operation.id)

      case "CLEAR_ANALYSES":
        return clearAnalyses()

      case "GET_STATS":
        return getAnalysisStats()

      default:
        throw new Error(`Unknown MCP operation: ${(operation as any).type}`)
    }
  } catch (error) {
    console.error(`MCP operation error: ${error}`)
    throw error
  }
}

// Fetch analyses with optional filters
function fetchAnalyses(filters?: AnalysisFilters): AnalysisResult[] {
  let results = [...analysisResults]

  if (filters) {
    // Apply type filter
    if (filters.analysisType) {
      results = results.filter((r) => r.analysisType === filters.analysisType)
    }

    // Apply date filters
    if (filters.startDate) {
      results = results.filter((r) => r.timestamp >= filters.startDate!)
    }

    if (filters.endDate) {
      results = results.filter((r) => r.timestamp <= filters.endDate!)
    }

    // Apply status filter
    if (filters.status) {
      results = results.filter((r) => r.status === filters.status)
    }

    // Apply sorting
    if (filters.sortBy) {
      results.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof AnalysisResult]
        const bValue = b[filters.sortBy as keyof AnalysisResult]

        if (aValue < bValue) return filters.sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return filters.sortDirection === "asc" ? 1 : -1
        return 0
      })
    } else {
      // Default sort by timestamp descending
      results.sort((a, b) => b.timestamp - a.timestamp)
    }

    // Apply pagination
    if (filters.offset !== undefined && filters.limit !== undefined) {
      results = results.slice(filters.offset, filters.offset + filters.limit)
    } else if (filters.limit !== undefined) {
      results = results.slice(0, filters.limit)
    }
  } else {
    // Default sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp)
  }

  return results
}

// Get a specific analysis by ID
function getAnalysis(id: string): AnalysisResult | null {
  const analysis = analysisResults.find((r) => r.id === id)
  return analysis || null
}

// Store a new analysis result
function storeAnalysis(analysis: AnalysisResult): AnalysisResult {
  // Check if analysis with this ID already exists
  const existingIndex = analysisResults.findIndex((r) => r.id === analysis.id)

  if (existingIndex >= 0) {
    // Update existing analysis
    analysisResults[existingIndex] = analysis
  } else {
    // Add new analysis
    analysisResults.push(analysis)
  }

  // Persist to cache
  persistAnalyses()

  return analysis
}

// Delete an analysis by ID
function deleteAnalysis(id: string): boolean {
  const initialLength = analysisResults.length
  analysisResults = analysisResults.filter((r) => r.id !== id)

  // Persist to cache if something was deleted
  if (initialLength !== analysisResults.length) {
    persistAnalyses()
    return true
  }

  return false
}

// Clear all analyses
function clearAnalyses(): boolean {
  analysisResults = []
  persistAnalyses()
  return true
}

// Get statistics about analyses
function getAnalysisStats(): AnalysisStats {
  const totalAnalyses = analysisResults.length
  const successfulAnalyses = analysisResults.filter((r) => r.status === "success").length
  const failedAnalyses = analysisResults.filter((r) => r.status === "error").length
  const processingAnalyses = analysisResults.filter((r) => r.status === "processing").length

  // Count by type
  const byType: Record<string, number> = {}
  analysisResults.forEach((r) => {
    byType[r.analysisType] = (byType[r.analysisType] || 0) + 1
  })

  // Calculate average processing time for successful analyses
  const successfulAnalysesWithMetadata = analysisResults.filter(
    (r) => r.status === "success" && r.metadata?.processingTimeMs,
  )

  const averageProcessingTime =
    successfulAnalysesWithMetadata.length > 0
      ? successfulAnalysesWithMetadata.reduce((sum, r) => sum + (r.metadata?.processingTimeMs || 0), 0) /
        successfulAnalysesWithMetadata.length
      : 0

  return {
    totalAnalyses,
    successfulAnalyses,
    failedAnalyses,
    processingAnalyses,
    byType,
    averageProcessingTime,
  }
}

// Helper to generate a unique ID
export function generateAnalysisId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Helper to record an analysis result
export async function recordAnalysisResult(
  imageData: string,
  analysisType: "outfit" | "detailed" | "occasion",
  result: any,
  metadata?: Record<string, any>,
): Promise<AnalysisResult> {
  const startTime = metadata?.startTime || Date.now()
  const endTime = Date.now()

  const analysis: AnalysisResult = {
    id: generateAnalysisId(),
    timestamp: endTime,
    imageData,
    analysisType,
    result,
    status: "success",
    metadata: {
      ...metadata,
      processingTimeMs: endTime - startTime,
    },
  }

  return (await executeMCPOperation({ type: "STORE_ANALYSIS", analysis })) as AnalysisResult
}

// Helper to record an analysis error
export async function recordAnalysisError(
  imageData: string,
  analysisType: "outfit" | "detailed" | "occasion",
  error: Error,
  metadata?: Record<string, any>,
): Promise<AnalysisResult> {
  const startTime = metadata?.startTime || Date.now()
  const endTime = Date.now()

  const analysis: AnalysisResult = {
    id: generateAnalysisId(),
    timestamp: endTime,
    imageData,
    analysisType,
    result: null,
    status: "error",
    error: error.message,
    metadata: {
      ...metadata,
      processingTimeMs: endTime - startTime,
      errorStack: error.stack,
    },
  }

  return (await executeMCPOperation({ type: "STORE_ANALYSIS", analysis })) as AnalysisResult
}
