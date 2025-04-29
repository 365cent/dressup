"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  ArrowLeft,
  Trash2,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  List,
  Grid,
  X,
} from "lucide-react"
import { executeMCPOperation, type AnalysisResult as OriginalAnalysisResult, type AnalysisFilters, type AnalysisStats } from "@/lib/mcp-protocol"

// Extend AnalysisResult to include optional imagePath property for local usage
type AnalysisResult = OriginalAnalysisResult & {
  imagePath?: string
}
// Removed ml-service imports for feedback
// Removed client-data-service import for getFeedbackData
import { initializeDataStorage } from "@/lib/client-data-service"

// Define FeedbackDataItem type for local usage
type FeedbackDataItem = {
  feedback: "upvote" | "downvote" | null
  analysisId?: string // Use analysisId instead of analysis object
  imageId?: string
  timestamp?: number
}

// Colors for charts - lighter palette
const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#6ee7b7"]

// Define chart data types
interface ChartDataItem {
  name: string;
  value: number;
}

interface MLDashboardClientProps {
  initialAnalyses: AnalysisResult[]
  initialStats: AnalysisStats
}

export default function MLDashboardClient({ initialAnalyses, initialStats }: MLDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [analyses, setAnalyses] = useState<AnalysisResult[]>(initialAnalyses)
  const [stats, setStats] = useState<AnalysisStats>(initialStats)
  const [feedbackCount, setFeedbackCount] = useState({ upvotes: 0, downvotes: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Filters
  const [filters, setFilters] = useState<AnalysisFilters>({
    sortBy: "timestamp",
    sortDirection: "desc",
  })
  const [searchTerm, setSearchTerm] = useState("")

  const router = useRouter()

  // Function to navigate back using Next.js router
  const navigateBack = () => {
    router.back();
  }

  // First, initialize the data storage
  useEffect(() => {
    const initialize = async () => {
      await initializeDataStorage();
      setIsInitialized(true);
    };
    initialize();
  }, []);

  // Then, load feedback data once initialization is complete
  useEffect(() => {
    if (!isInitialized) return;

    const loadFeedbackData = async () => {
      try {
        // Use executeMCPOperation to get feedback
        const data: FeedbackDataItem[] = await executeMCPOperation({ type: "GET_FEEDBACK" });
        const upvotes: number = data.filter((item) => item.feedback === "upvote").length;
        const downvotes: number = data.filter((item) => item.feedback === "downvote").length;
        setFeedbackCount({ upvotes, downvotes });

        // Track which analyses have received feedback using analysisId
        const feedbackMap: Record<string, "upvote" | "downvote" | null> = {};
        data.forEach((item) => {
          if (item.analysisId) {
            feedbackMap[item.analysisId] = item.feedback;
          }
        });
        setFeedbackGiven(feedbackMap);
      } catch (error) {
        console.error("Error loading feedback data via MCP:", error);
        setFeedbackCount({ upvotes: 0, downvotes: 0 });
      }
    };

    loadFeedbackData();
  }, [isInitialized])

  // Status message for operations
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Show a status message with auto-dismiss
  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Refresh data from MCP
  const refreshData = async () => {
    setIsLoading(true)
    try {
      const newAnalyses = await executeMCPOperation({
        type: "FETCH_ANALYSES",
        filters,
      })
      const newStats = await executeMCPOperation({ type: "GET_STATS" })

      setAnalyses(newAnalyses)
      setStats(newStats)
      showStatus("Data refreshed successfully", "success");
    } catch (error) {
      console.error("Error refreshing data:", error)
      showStatus("Failed to refresh data", "error");
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters
  const applyFilters = async () => {
    setIsLoading(true)
    try {
      const filteredAnalyses = await executeMCPOperation({
        type: "FETCH_ANALYSES",
        filters,
      })
      setAnalyses(filteredAnalyses)
    } catch (error) {
      console.error("Error applying filters:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      sortBy: "timestamp",
      sortDirection: "desc",
    })
    setSearchTerm("")
    refreshData()
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof AnalysisFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">{status}</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{status}</Badge>
      case "processing":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">{status}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get analysis type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "outfit":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{type}</Badge>
      case "detailed":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{type}</Badge>
      case "occasion":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">{type}</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  // Add state to track which analyses have received feedback
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "upvote" | "downvote" | null>>({})

  // Update the handleUpvote and handleDownvote functions to handle missing analysis parameter
  // and implement toggle functionality with improved feedback
  const handleUpvote = async (analysis?: AnalysisResult, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }

    // If no analysis is provided, we can't do anything
    if (!analysis || !analysis.id || !analysis.imageId) {
      console.warn("No analysis or required IDs provided for upvote")
      showStatus("Error: Missing analysis details", "error");
      return
    }

    const analysisId = analysis.id;
    const imageId = analysis.imageId;

    try {
      let operation: "SAVE_FEEDBACK" | "REMOVE_FEEDBACK";
      let newFeedbackState: "upvote" | null = "upvote";

      // If this analysis was already upvoted, remove the upvote
      if (feedbackGiven[analysisId] === "upvote") {
        operation = "REMOVE_FEEDBACK";
        newFeedbackState = null;
        showStatus("Feedback removed", "info");
      }
      // If it was previously downvoted, change to upvote
      else if (feedbackGiven[analysisId] === "downvote") {
        operation = "SAVE_FEEDBACK";
        showStatus("Feedback changed to upvote", "success");
      }
      // No previous feedback, just add upvote
      else {
        operation = "SAVE_FEEDBACK";
        showStatus("Upvote recorded", "success");
      }

      // Execute the MCP operation
      if (operation === "REMOVE_FEEDBACK") {
        await executeMCPOperation({ type: "REMOVE_FEEDBACK", analysisId });
      } else {
        await executeMCPOperation({ type: "SAVE_FEEDBACK", imageId, analysisId, feedback: "upvote" });
      }

      // Optimistically update UI state
      setFeedbackGiven(prev => {
        const newState = { ...prev };
        if (newFeedbackState === null) {
          delete newState[analysisId];
        } else {
          newState[analysisId] = newFeedbackState;
        }
        return newState;
      });
      // Recalculate counts based on the new feedbackGiven state
      const updatedFeedbackValues = Object.values(feedbackGiven);
      setFeedbackCount({
         upvotes: updatedFeedbackValues.filter(f => f === "upvote").length,
         downvotes: updatedFeedbackValues.filter(f => f === "downvote").length
      });


    } catch (error) {
      console.error("Error recording feedback via MCP:", error);
      showStatus("Failed to record feedback", "error");
      // TODO: Revert optimistic UI update on error?
    }
  }

  const handleDownvote = async (analysis?: AnalysisResult, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }

    // If no analysis is provided, we can't do anything
    if (!analysis || !analysis.id || !analysis.imageId) {
      console.warn("No analysis or required IDs provided for downvote")
      showStatus("Error: Missing analysis details", "error");
      return
    }

    const analysisId = analysis.id;
    const imageId = analysis.imageId;

    try {
      let operation: "SAVE_FEEDBACK" | "REMOVE_FEEDBACK";
      let newFeedbackState: "downvote" | null = "downvote";

      // If this analysis was already downvoted, remove the downvote
      if (feedbackGiven[analysisId] === "downvote") {
        operation = "REMOVE_FEEDBACK";
        newFeedbackState = null;
        showStatus("Feedback removed", "info");
      }
      // If it was previously upvoted, change to downvote
      else if (feedbackGiven[analysisId] === "upvote") {
        operation = "SAVE_FEEDBACK";
        showStatus("Feedback changed to downvote", "info");
      }
      // No previous feedback, just add downvote
      else {
        operation = "SAVE_FEEDBACK";
        showStatus("Downvote recorded", "info");
      }

      // Execute the MCP operation
      if (operation === "REMOVE_FEEDBACK") {
        await executeMCPOperation({ type: "REMOVE_FEEDBACK", analysisId });
      } else {
        await executeMCPOperation({ type: "SAVE_FEEDBACK", imageId, analysisId, feedback: "downvote" });
      }

      // Optimistically update UI state
      setFeedbackGiven(prev => {
        const newState = { ...prev };
        if (newFeedbackState === null) {
          delete newState[analysisId];
        } else {
          newState[analysisId] = newFeedbackState;
        }
        return newState;
      });
       // Recalculate counts based on the new feedbackGiven state
      const updatedFeedbackValues = Object.values(feedbackGiven);
      setFeedbackCount({
         upvotes: updatedFeedbackValues.filter(f => f === "upvote").length,
         downvotes: updatedFeedbackValues.filter(f => f === "downvote").length
      });

    } catch (error) {
      console.error("Error recording feedback via MCP:", error);
      showStatus("Failed to record feedback", "error");
      // TODO: Revert optimistic UI update on error?
    }
  }

  const handleClearFeedback = async () => {
    try {
      // Use executeMCPOperation to clear feedback
      await executeMCPOperation({ type: "CLEAR_FEEDBACK" });
      setFeedbackCount({ upvotes: 0, downvotes: 0 })
      setFeedbackGiven({})
      showStatus("All feedback cleared successfully", "success");
    } catch (error) {
      console.error("Error clearing feedback via MCP:", error);
      showStatus("Failed to clear feedback", "error");
    }
  }

  const handleDeleteAnalysis = async (id: string, source: 'modal' | 'list' = 'list') => {
    try {
      await executeMCPOperation({ type: "DELETE_ANALYSIS", id });
      
      // Close the modal if deleted from there
      if (source === 'modal') {
        setSelectedAnalysis(null);
      }
      
      // Refresh the analyses list
      const newAnalyses = await executeMCPOperation({
        type: "FETCH_ANALYSES",
        filters,
      });
      setAnalyses(newAnalyses);
      
      // Update stats since we've changed the data
      const newStats = await executeMCPOperation({ type: "GET_STATS" });
      setStats(newStats);
      
      showStatus("Analysis deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting analysis:", error);
      showStatus("Failed to delete analysis", "error");
    }
  };

  const handleClearAllAnalyses = async () => {
    if (confirm("Are you sure you want to clear all analyses? This action cannot be undone.")) {
      try {
        await executeMCPOperation({ type: "CLEAR_ANALYSES" })
        refreshData()
        showStatus("All analyses cleared successfully", "success");
      } catch (error) {
        console.error("Error clearing analyses:", error)
        showStatus("Failed to clear analyses", "error");
      }
    }
  }

  // Prepare data for type chart
  const prepareTypeData = (): ChartDataItem[] => {
    if (!stats.byType) return [];
    
    return Object.entries(stats.byType).map(([type, count]) => ({
      name: type,
      value: count
    }));
  }
  
  // Prepare data for status chart
  const prepareStatusData = (): ChartDataItem[] => {
    return [
      { name: 'Success', value: stats.successfulAnalyses },
      { name: 'Failed', value: stats.failedAnalyses },
      { name: 'Processing', value: stats.processingAnalyses }
    ];
  }

  // Helper function to get the correct image source
  const getImageSrc = (analysis: AnalysisResult): string | null => {
    // Use the imageId to construct the URL to the image serving API route
    if (analysis.imageId) {
      return `/api/images/${analysis.imageId}`;
    }
    
    // Fallback or alternative logic if needed (e.g., if imageData was stored differently)
    // if (analysis.imageData && analysis.imageData.startsWith('data:')) {
    //   return analysis.imageData;
    // }

    console.warn(`No imageId found for analysis ${analysis.id}`);
    return null; // Return null if no imageId is available
  }

  // Render analysis details modal with improved delete confirmation
  const renderAnalysisDetails = () => {
    if (!selectedAnalysis) return null

    const handleDelete = () => {
      if (confirm(`Are you sure you want to delete this analysis (ID: ${selectedAnalysis.id.substring(0, 8)}...)?`)) {
        handleDeleteAnalysis(selectedAnalysis.id, 'modal');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Analysis Details</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedAnalysis(null)} className="text-gray-500 hover:text-gray-800">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-700">Image</h3>
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                  {getImageSrc(selectedAnalysis) ? (
                    <Image
                      src={getImageSrc(selectedAnalysis) ?? "/placeholder.svg"} // Provide fallback
                      alt="Analysis image"
                      fill
                      className="object-contain" // Use contain for the modal view
                      unoptimized // Recommended
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <AlertCircle className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3 text-gray-700">Information</h3>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono text-sm">{selectedAnalysis.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>{getTypeBadge(selectedAnalysis.analysisType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>{getStatusBadge(selectedAnalysis.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timestamp:</span>
                      <span>{formatTimestamp(selectedAnalysis.timestamp)}</span>
                    </div>
                    {selectedAnalysis.metadata?.processingTimeMs && (
                      <div className="flex justify-between">
                        <span>Processing Time:</span>
                        <span>{selectedAnalysis.metadata.processingTimeMs}ms</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAnalysis.error && (
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-red-600">Error</h3>
                    <div className="bg-red-50 p-3 rounded-md border border-red-200">
                      <p className="text-red-600">{selectedAnalysis.error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700">Result</h3>
              <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto shadow-inner">
                <pre className="text-sm text-gray-700">{JSON.stringify(selectedAnalysis.result, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Delete This Analysis
              </Button>
            </div>

            {/* Add feedback buttons */}
            <div className="mt-3">
              <h4 className="font-medium mb-2 text-gray-700">Feedback</h4>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleUpvote(selectedAnalysis)}
                  variant={feedbackGiven[selectedAnalysis.id] === "upvote" ? "default" : "outline"}
                  className={feedbackGiven[selectedAnalysis.id] === "upvote" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Useful
                </Button>
                <Button
                  onClick={() => handleDownvote(selectedAnalysis)}
                  variant={feedbackGiven[selectedAnalysis.id] === "downvote" ? "default" : "outline"}
                  className={feedbackGiven[selectedAnalysis.id] === "downvote" ? "bg-red-500 hover:bg-red-600" : ""}
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Not Useful
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render grid view
  const renderGridView = () => {
    if (analyses.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p className="text-lg">No analysis results found</p>
          <p className="text-sm">Try changing your filters or capturing new outfits</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyses.map((analysis) => (
          <Card
            key={analysis.id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedAnalysis(analysis)}
          >
            <div className="aspect-video relative">
              {getImageSrc(analysis) ? (
                <Image
                  // Use unoptimized={true} if the image serving route doesn't handle optimization
                  // or if you encounter issues with Next.js image optimization.
                  src={getImageSrc(analysis) ?? "/placeholder.svg"} // Provide fallback
                  alt="Analysis image"
                  fill
                  className="object-cover"
                  unoptimized // Recommended when using external/dynamic sources not handled by Next/Image loader
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <AlertCircle className="h-8 w-8 text-gray-300" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex space-x-2">
                {getTypeBadge(analysis.analysisType)}
                {getStatusBadge(analysis.status)}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs truncate text-gray-500">{analysis.id.substring(0, 12)}...</span>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(analysis.timestamp).toLocaleDateString()}
                </span>
              </div>
              {analysis.error ? (
                <div className="text-red-600 text-sm truncate">
                  <XCircle className="w-4 h-4 inline mr-1" />
                  {analysis.error}
                </div>
              ) : (
                <div className="text-sm text-gray-700 truncate">
                  {analysis.analysisType === "outfit" && "Outfit Analysis"}
                  {analysis.analysisType === "detailed" && "Detailed Analysis"}
                  {analysis.analysisType === "occasion" && `Occasion: ${analysis.result?.occasion || "Unknown"}`}
                </div>
              )}

              {/* Add feedback buttons */}
              <div className="mt-2 flex justify-end space-x-2">
                <Button
                  variant={feedbackGiven[analysis.id] === "upvote" ? "default" : "outline"}
                  size="sm"
                  className={feedbackGiven[analysis.id] === "upvote" ? "bg-emerald-500" : "border-gray-200 text-gray-600 hover:bg-gray-50"}
                  onClick={(e) => handleUpvote(analysis, e)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={feedbackGiven[analysis.id] === "downvote" ? "default" : "outline"}
                  size="sm"
                  className={feedbackGiven[analysis.id] === "downvote" ? "bg-red-500" : "border-gray-200 text-gray-600 hover:bg-gray-50"}
                  onClick={(e) => handleDownvote(analysis, e)}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Render list view
  const renderListView = () => {
    if (analyses.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p className="text-lg">No analysis results found</p>
          <p className="text-sm">Try changing your filters or capturing new outfits</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="text-left p-3 font-medium">ID</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Timestamp</th>
              <th className="text-left p-3 font-medium">Processing Time</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((analysis) => (
              <tr
                key={analysis.id}
                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <td className="p-3 font-mono text-xs text-gray-600">{analysis.id.substring(0, 12)}...</td>
                <td className="p-3">{getTypeBadge(analysis.analysisType)}</td>
                <td className="p-3">{getStatusBadge(analysis.status)}</td>
                <td className="p-3 text-sm text-gray-600">{formatTimestamp(analysis.timestamp)}</td>
                <td className="p-3 text-sm text-gray-600">
                  {analysis.metadata?.processingTimeMs ? `${analysis.metadata.processingTimeMs}ms` : "N/A"}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteAnalysis(analysis.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Add status message display
  const renderStatusMessage = () => {
    if (!statusMessage) return null;
    
    const bgColor = 
      statusMessage.type === 'success' ? 'bg-green-100 border-green-300 text-green-800' :
      statusMessage.type === 'error' ? 'bg-red-100 border-red-300 text-red-800' :
      'bg-blue-100 border-blue-300 text-blue-800';
    
    return (
      <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md border ${bgColor} shadow-md z-50 animate-fade-in-up`}>
        {statusMessage.text}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Status message toast */}
      {renderStatusMessage()}
      
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateBack}
              className="mr-4 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Machine Learning Dashboard</h1>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllAnalyses}
              disabled={isLoading || analyses.length === 0}
              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white shadow-sm rounded-md">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analyses" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Analysis Results
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              User Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800">Analysis Summary</CardTitle>
                  <CardDescription>Overview of ML analysis operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Total Analyses:</span>
                      <span className="font-medium">{stats.totalAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful:</span>
                      <span className="font-medium text-emerald-600">{stats.successfulAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{stats.failedAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing:</span>
                      <span className="font-medium text-amber-600">{stats.processingAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Processing Time:</span>
                      <span>{stats.averageProcessingTime.toFixed(0)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800">User Feedback</CardTitle>
                  <CardDescription>Feedback summary from analysis results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Upvotes:</span>
                      <span className="font-medium text-emerald-600">{feedbackCount.upvotes}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Downvotes:</span>
                      <span className="font-medium text-red-600">{feedbackCount.downvotes}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Satisfaction Rate:</span>
                      <span className="font-medium">
                        {feedbackCount.upvotes + feedbackCount.downvotes > 0
                          ? `${Math.round((feedbackCount.upvotes / (feedbackCount.upvotes + feedbackCount.downvotes)) * 100)}%`
                          : "N/A"}
                      </span>
                    </div>

                    <div className="pt-2">
                      <Button onClick={handleClearFeedback} variant="outline" className="w-full text-gray-600 border-gray-200">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Feedback
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800">Analysis Types</CardTitle>
                  <CardDescription>Distribution by analysis type</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center">
                  {stats.totalAnalyses > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareTypeData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {prepareTypeData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-gray-400">No data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-800">Analysis Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                {stats.totalAnalyses > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareStatusData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                      />
                      <Bar dataKey="value" fill="#8884d8">
                        {prepareStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyses" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-gray-800">Analysis Results</CardTitle>
                  <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-600"}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-white shadow-sm" : "text-gray-600"}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{analyses.length} analysis results found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search analyses..."
                        className="pl-10 border-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select
                      value={filters.analysisType || "all"}
                      onValueChange={(value) => handleFilterChange("analysisType", value === "all" ? undefined : value)}
                    >
                      <SelectTrigger className="w-[140px] border-gray-200">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="outfit">Outfit</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="occasion">Occasion</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.status || "all"}
                      onValueChange={(value) => handleFilterChange("status", value === "all" ? undefined : value)}
                    >
                      <SelectTrigger className="w-[140px] border-gray-200">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={applyFilters}
                      disabled={isLoading}
                      className="border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={resetFilters} 
                      disabled={isLoading}
                      className="text-gray-500"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {viewMode === "grid" ? renderGridView() : renderListView()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-800">User Feedback</CardTitle>
                <CardDescription>Manage feedback for model improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                      <h3 className="text-lg font-medium mb-4 text-gray-800">Feedback Summary</h3>
                      <div className="space-y-3 text-gray-700">
                        <div className="flex justify-between">
                          <span>Total Feedback:</span>
                          <span>{feedbackCount.upvotes + feedbackCount.downvotes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Upvotes:</span>
                          <span className="text-emerald-600">{feedbackCount.upvotes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Downvotes:</span>
                          <span className="text-red-600">{feedbackCount.downvotes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Satisfaction Rate:</span>
                          <span>
                            {feedbackCount.upvotes + feedbackCount.downvotes > 0
                              ? `${Math.round((feedbackCount.upvotes / (feedbackCount.upvotes + feedbackCount.downvotes)) * 100)}%`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                      <h3 className="text-lg font-medium mb-4 text-gray-800">Provide Feedback</h3>
                      <p className="text-gray-600 mb-4">
                        Your feedback helps us improve our machine learning models. Please select an analysis result 
                        first, then provide feedback on that specific result.
                      </p>
                      
                      {selectedAnalysis ? (
                        <div className="flex space-x-4">
                          <Button 
                            onClick={() => handleUpvote(selectedAnalysis)} 
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Upvote Selected
                          </Button>
                          <Button 
                            onClick={() => handleDownvote(selectedAnalysis)} 
                            className="flex-1 bg-red-500 hover:bg-red-600"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Downvote Selected
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-50 text-blue-700 rounded border border-blue-200">
                          <p className="flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Please select an analysis from the "Analysis Results" tab to provide feedback
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-4 text-gray-800">Feedback Management</h3>
                    <p className="text-gray-600 mb-4">
                      Manage the collected feedback data for model training and improvement.
                    </p>
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleClearFeedback}
                        variant="outline"
                        className="border-gray-200 text-gray-800 hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Feedback
                      </Button>
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Export Feedback
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Analysis details modal */}
      {selectedAnalysis && renderAnalysisDetails()}
    </div>
  )
}
