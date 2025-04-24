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
} from "lucide-react"
import { executeMCPOperation, type AnalysisResult, type AnalysisFilters, type AnalysisStats } from "@/lib/mcp-protocol"
import { recordFeedback, getFeedbackData, clearFeedbackData } from "@/lib/ml-service"

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

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

  // Filters
  const [filters, setFilters] = useState<AnalysisFilters>({
    sortBy: "timestamp",
    sortDirection: "desc",
  })
  const [searchTerm, setSearchTerm] = useState("")

  const router = useRouter()

  useEffect(() => {
    // Get feedback data on component mount
    const data = getFeedbackData()
    const upvotes = data.filter((item) => item.feedback === "upvote").length
    const downvotes = data.filter((item) => item.feedback === "downvote").length
    setFeedbackCount({ upvotes, downvotes })
  }, [])

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
    } catch (error) {
      console.error("Error refreshing data:", error)
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
        return <Badge className="bg-green-500">{status}</Badge>
      case "error":
        return <Badge className="bg-red-500">{status}</Badge>
      case "processing":
        return <Badge className="bg-yellow-500">{status}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get analysis type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "outfit":
        return <Badge className="bg-blue-500">{type}</Badge>
      case "detailed":
        return <Badge className="bg-purple-500">{type}</Badge>
      case "occasion":
        return <Badge className="bg-orange-500">{type}</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  const handleUpvote = () => {
    // Record an upvote for the current analysis
    recordFeedback("placeholder-image", { score: 85 }, "upvote")
    setFeedbackCount((prev) => ({ ...prev, upvotes: prev.upvotes + 1 }))
  }

  const handleDownvote = () => {
    // Record a downvote for the current analysis
    recordFeedback("placeholder-image", { score: 85 }, "downvote")
    setFeedbackCount((prev) => ({ ...prev, downvotes: prev.downvotes + 1 }))
  }

  const handleClearFeedback = () => {
    clearFeedbackData()
    setFeedbackCount({ upvotes: 0, downvotes: 0 })
  }

  const handleDeleteAnalysis = async (id: string) => {
    if (confirm("Are you sure you want to delete this analysis?")) {
      try {
        await executeMCPOperation({ type: "DELETE_ANALYSIS", id })
        refreshData()
      } catch (error) {
        console.error("Error deleting analysis:", error)
      }
    }
  }

  const handleClearAllAnalyses = async () => {
    if (confirm("Are you sure you want to clear all analyses? This action cannot be undone.")) {
      try {
        await executeMCPOperation({ type: "CLEAR_ANALYSES" })
        refreshData()
      } catch (error) {
        console.error("Error clearing analyses:", error)
      }
    }
  }

  const navigateBack = () => {
    router.back()
  }

  // Prepare data for charts
  const prepareTypeData = () => {
    return Object.entries(stats.byType).map(([type, count]) => ({
      name: type,
      value: count,
    }))
  }

  const prepareStatusData = () => {
    return [
      { name: "Success", value: stats.successfulAnalyses },
      { name: "Error", value: stats.failedAnalyses },
      { name: "Processing", value: stats.processingAnalyses },
    ]
  }

  // Render analysis details
  const renderAnalysisDetails = () => {
    if (!selectedAnalysis) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Analysis Details</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedAnalysis(null)}>
              <XCircle className="h-6 w-6" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Image</h3>
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-800">
                  <Image
                    src={selectedAnalysis.imageData || "/placeholder.svg"}
                    alt="Analysis image"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">ID:</span>
                      <span className="font-mono text-sm">{selectedAnalysis.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span>{getTypeBadge(selectedAnalysis.analysisType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span>{getStatusBadge(selectedAnalysis.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Timestamp:</span>
                      <span>{formatTimestamp(selectedAnalysis.timestamp)}</span>
                    </div>
                    {selectedAnalysis.metadata?.processingTimeMs && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Processing Time:</span>
                        <span>{selectedAnalysis.metadata.processingTimeMs}ms</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAnalysis.error && (
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-red-500">Error</h3>
                    <div className="bg-red-900 bg-opacity-20 p-3 rounded-md border border-red-800">
                      <p className="text-red-400">{selectedAnalysis.error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Result</h3>
              <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm text-gray-300">{JSON.stringify(selectedAnalysis.result, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteAnalysis(selectedAnalysis.id)
                  setSelectedAnalysis(null)
                }}
              >
                Delete
              </Button>
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
            className="bg-white bg-opacity-5 border-0 overflow-hidden hover:bg-opacity-10 transition-all cursor-pointer"
            onClick={() => setSelectedAnalysis(analysis)}
          >
            <div className="aspect-video relative">
              <Image
                src={analysis.imageData || "/placeholder.svg"}
                alt="Analysis image"
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                {getTypeBadge(analysis.analysisType)}
                {getStatusBadge(analysis.status)}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs truncate text-gray-400">{analysis.id.substring(0, 12)}...</span>
                <span className="text-xs text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(analysis.timestamp).toLocaleDateString()}
                </span>
              </div>
              {analysis.error ? (
                <div className="text-red-400 text-sm truncate">
                  <XCircle className="w-4 h-4 inline mr-1" />
                  {analysis.error}
                </div>
              ) : (
                <div className="text-sm truncate">
                  {analysis.analysisType === "outfit" && "Outfit Analysis"}
                  {analysis.analysisType === "detailed" && "Detailed Analysis"}
                  {analysis.analysisType === "occasion" && `Occasion: ${analysis.result?.occasion || "Unknown"}`}
                </div>
              )}
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
            <tr className="border-b border-gray-800">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Timestamp</th>
              <th className="text-left p-3">Processing Time</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((analysis) => (
              <tr
                key={analysis.id}
                className="border-b border-gray-800 hover:bg-white hover:bg-opacity-5 cursor-pointer"
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <td className="p-3 font-mono text-xs">{analysis.id.substring(0, 12)}...</td>
                <td className="p-3">{getTypeBadge(analysis.analysisType)}</td>
                <td className="p-3">{getStatusBadge(analysis.status)}</td>
                <td className="p-3 text-sm">{formatTimestamp(analysis.timestamp)}</td>
                <td className="p-3 text-sm">
                  {analysis.metadata?.processingTimeMs ? `${analysis.metadata.processingTimeMs}ms` : "N/A"}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateBack}
              className="mr-4 text-white hover:bg-white hover:bg-opacity-10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-3xl font-bold">Machine Learning Dashboard</h1>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="border-white text-white hover:bg-white hover:bg-opacity-10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllAnalyses}
              disabled={isLoading || analyses.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white bg-opacity-10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analyses" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Analysis Results
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-white data-[state=active]:text-black">
              User Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white bg-opacity-5 border-0 text-white col-span-1">
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                  <CardDescription className="text-gray-400">Overview of ML analysis operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Analyses:</span>
                      <span className="font-medium">{stats.totalAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful:</span>
                      <span className="font-medium text-green-500">{stats.successfulAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="font-medium text-red-500">{stats.failedAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing:</span>
                      <span className="font-medium text-yellow-500">{stats.processingAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Processing Time:</span>
                      <span>{stats.averageProcessingTime.toFixed(0)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white bg-opacity-5 border-0 text-white col-span-1">
                <CardHeader>
                  <CardTitle>User Feedback</CardTitle>
                  <CardDescription className="text-gray-400">Help improve the model with your feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Upvotes:</span>
                      <span className="font-medium text-green-500">{feedbackCount.upvotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downvotes:</span>
                      <span className="font-medium text-red-500">{feedbackCount.downvotes}</span>
                    </div>

                    <div className="flex justify-between mt-4">
                      <div className="space-x-2">
                        <Button onClick={handleUpvote} className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Upvote
                        </Button>
                        <Button onClick={handleDownvote} className="bg-red-600 hover:bg-red-700 text-white">
                          <XCircle className="w-4 h-4 mr-2" />
                          Downvote
                        </Button>
                      </div>

                      <div>
                        <Button
                          onClick={handleClearFeedback}
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:bg-opacity-10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white bg-opacity-5 border-0 text-white col-span-1">
                <CardHeader>
                  <CardTitle>Analysis Types</CardTitle>
                  <CardDescription className="text-gray-400">Distribution by analysis type</CardDescription>
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
                          contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "8px" }}
                          itemStyle={{ color: "white" }}
                          labelStyle={{ color: "white" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-gray-400">No data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white bg-opacity-5 border-0 text-white">
              <CardHeader>
                <CardTitle>Analysis Status</CardTitle>
                <CardDescription className="text-gray-400">Distribution by status</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                {stats.totalAnalyses > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareStatusData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                      <YAxis stroke="rgba(255,255,255,0.7)" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "8px" }}
                        itemStyle={{ color: "white" }}
                        labelStyle={{ color: "white" }}
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
            <Card className="bg-white bg-opacity-5 border-0 text-white">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Analysis Results</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={viewMode === "grid" ? "bg-white bg-opacity-20" : ""}
                    >
                      <Grid className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-white bg-opacity-20" : ""}
                    >
                      <List className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-gray-400">{analyses.length} analysis results found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search analyses..."
                        className="pl-10 bg-white bg-opacity-5 border-gray-700"
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
                      <SelectTrigger className="w-[140px] bg-white bg-opacity-5 border-gray-700">
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
                      <SelectTrigger className="w-[140px] bg-white bg-opacity-5 border-gray-700">
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
                      className="border-white text-white hover:bg-white hover:bg-opacity-10"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={resetFilters} disabled={isLoading}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {viewMode === "grid" ? renderGridView() : renderListView()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card className="bg-white bg-opacity-5 border-0 text-white">
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
                <CardDescription className="text-gray-400">Manage feedback for model improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Feedback Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Feedback:</span>
                          <span>{feedbackCount.upvotes + feedbackCount.downvotes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Upvotes:</span>
                          <span className="text-green-500">{feedbackCount.upvotes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Downvotes:</span>
                          <span className="text-red-500">{feedbackCount.downvotes}</span>
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

                    <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Provide Feedback</h3>
                      <p className="text-gray-400 mb-4">
                        Your feedback helps us improve our machine learning models. Please rate your experience with the
                        analysis results.
                      </p>
                      <div className="flex space-x-4">
                        <Button onClick={handleUpvote} className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Upvote
                        </Button>
                        <Button onClick={handleDownvote} className="flex-1 bg-red-600 hover:bg-red-700">
                          <XCircle className="w-4 h-4 mr-2" />
                          Downvote
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Feedback Management</h3>
                    <p className="text-gray-400 mb-4">
                      Manage the collected feedback data for model training and improvement.
                    </p>
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleClearFeedback}
                        variant="outline"
                        className="border-white text-white hover:bg-white hover:bg-opacity-10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Feedback
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700">
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
