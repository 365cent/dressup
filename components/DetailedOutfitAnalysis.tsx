"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { analyzeOutfitDetails, processAnalysisQueue, type OutfitAnalysis } from "@/lib/clothing-analysis-service"
import { onVisibilityChange, initVisibilityTracking } from "@/lib/visibility-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shirt, Watch, Palette, Calendar, Tag, AlertCircle } from "lucide-react"

interface DetailedOutfitAnalysisProps {
  imageData: string
  onBack: () => void
}

export default function DetailedOutfitAnalysis({ imageData, onBack }: DetailedOutfitAnalysisProps) {
  const [analysis, setAnalysis] = useState<OutfitAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("clothing")
  const [isTabVisible, setIsTabVisible] = useState(true)

  // Initialize visibility tracking
  useEffect(() => {
    initVisibilityTracking()

    // Register for visibility changes
    const unsubscribe = onVisibilityChange((isVisible) => {
      setIsTabVisible(isVisible)

      // Process the queue when tab becomes visible
      if (isVisible) {
        processAnalysisQueue()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoading(true)
      try {
        const result = await analyzeOutfitDetails(imageData)
        setAnalysis(result)
      } catch (error) {
        console.error("Error loading detailed analysis:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalysis()
  }, [imageData])

  const renderClothingItems = () => {
    if (!analysis) return null

    // Group clothing items by position/category
    const upperBodyItems = analysis.clothingItems.filter(
      (item) =>
        item.position?.includes("upper") ||
        item.category === "top" ||
        ["shirt", "t-shirt", "blouse", "sweater", "jacket"].includes(item.type.toLowerCase()),
    )

    const lowerBodyItems = analysis.clothingItems.filter(
      (item) =>
        item.position?.includes("lower") ||
        item.category === "bottom" ||
        ["pants", "jeans", "shorts", "skirt", "trousers"].includes(item.type.toLowerCase()),
    )

    const fullBodyItems = analysis.clothingItems.filter(
      (item) =>
        item.position?.includes("full") ||
        item.category === "full-body" ||
        ["dress", "jumpsuit", "romper"].includes(item.type.toLowerCase()),
    )

    const outerwearItems = analysis.clothingItems.filter(
      (item) =>
        item.category === "outerwear" || ["coat", "jacket", "blazer", "cardigan"].includes(item.type.toLowerCase()),
    )

    const otherItems = analysis.clothingItems.filter(
      (item) =>
        !upperBodyItems.includes(item) &&
        !lowerBodyItems.includes(item) &&
        !fullBodyItems.includes(item) &&
        !outerwearItems.includes(item),
    )

    return (
      <div className="space-y-6">
        {upperBodyItems.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Upper Body</h3>
            <div className="space-y-4">{upperBodyItems.map((item, index) => renderClothingItemCard(item, index))}</div>
          </div>
        )}

        {/* Only show lower body section if items are detected */}
        {lowerBodyItems.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Lower Body</h3>
            <div className="space-y-4">{lowerBodyItems.map((item, index) => renderClothingItemCard(item, index))}</div>
          </div>
        )}

        {fullBodyItems.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Full Body</h3>
            <div className="space-y-4">{fullBodyItems.map((item, index) => renderClothingItemCard(item, index))}</div>
          </div>
        )}

        {outerwearItems.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Outerwear</h3>
            <div className="space-y-4">{outerwearItems.map((item, index) => renderClothingItemCard(item, index))}</div>
          </div>
        )}

        {otherItems.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Other Items</h3>
            <div className="space-y-4">{otherItems.map((item, index) => renderClothingItemCard(item, index))}</div>
          </div>
        )}

        {/* Show a message if no bottom garment is detected */}
        {!analysis.hasBottomGarment && (
          <Card className="bg-white bg-opacity-5 border-0 overflow-hidden">
            <CardContent className="p-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-3 text-yellow-400" />
              <p className="text-sm text-yellow-400">No bottom garment detected in this image.</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderClothingItemCard = (item: any, index: number) => (
    <Card key={index} className="bg-white bg-opacity-5 border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg capitalize">{item.type}</CardTitle>
          <Badge variant="outline" className="bg-white bg-opacity-10 text-white border-none">
            {Math.round(item.confidence * 100)}%
          </Badge>
        </div>
        <CardDescription className="text-gray-400 capitalize">{item.category}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Color</span>
            <div className="flex items-center mt-1">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: item.color.startsWith("#") ? item.color : undefined }}
              ></div>
              <span className="text-sm capitalize">{item.color}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Pattern</span>
            <span className="text-sm capitalize">{item.pattern}</span>
          </div>
          {item.material && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Material</span>
              <span className="text-sm capitalize">{item.material}</span>
            </div>
          )}
          {item.style && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Style</span>
              <span className="text-sm capitalize">{item.style}</span>
            </div>
          )}
          {item.fit && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Fit</span>
              <span className="text-sm capitalize">{item.fit}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderAccessories = () => {
    if (!analysis || analysis.accessories.length === 0) {
      return <p className="text-gray-400 text-center py-8">No accessories detected</p>
    }

    // Group accessories by position
    const groupedAccessories: Record<string, typeof analysis.accessories> = {}

    analysis.accessories.forEach((item) => {
      const position = item.position || "other"
      if (!groupedAccessories[position]) {
        groupedAccessories[position] = []
      }
      groupedAccessories[position].push(item)
    })

    return (
      <div className="space-y-6">
        {Object.entries(groupedAccessories).map(([position, items]) => (
          <div key={position}>
            <h3 className="text-lg font-medium mb-3 capitalize">{position}</h3>
            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={index} className="bg-white bg-opacity-5 border-0 overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg capitalize">{item.type}</CardTitle>
                      <Badge variant="outline" className="bg-white bg-opacity-10 text-white border-none">
                        {Math.round(item.confidence * 100)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {item.color && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Color</span>
                          <div className="flex items-center mt-1">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: item.color.startsWith("#") ? item.color : undefined }}
                            ></div>
                            <span className="text-sm capitalize">{item.color}</span>
                          </div>
                        </div>
                      )}
                      {item.material && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Material</span>
                          <span className="text-sm capitalize">{item.material}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderStyleAnalysis = () => {
    if (!analysis) return null

    const styleItems = Object.entries(analysis.style).map(([key, value]) => ({
      name: key,
      value: Math.round(value * 100),
    }))

    return (
      <div className="space-y-6">
        <Card className="bg-white bg-opacity-5 border-0">
          <CardHeader>
            <CardTitle className="text-lg">Style Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {styleItems.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm capitalize">{item.name}</span>
                    <span className="text-sm">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-white bg-opacity-10 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white bg-opacity-5 border-0">
          <CardHeader>
            <CardTitle className="text-lg">Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.dominantColors.map((color, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-md shadow-sm" style={{ backgroundColor: color }}></div>
                  <span className="text-xs mt-1">{color}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white bg-opacity-5 border-0">
          <CardHeader>
            <CardTitle className="text-lg">Patterns & Occasions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-400 mb-2">Patterns</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.patterns.map((pattern, index) => (
                    <Badge key={index} className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-none">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm text-gray-400 mb-2">Season</h4>
                <Badge className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-none">
                  {analysis.season}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm text-gray-400 mb-2">Suitable Occasions</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.occasions.map((occasion, index) => (
                    <Badge key={index} className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-none">
                      {occasion}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light">Detailed Outfit Analysis</h1>
        <button
          onClick={onBack}
          className="bg-white bg-opacity-10 text-white px-4 py-2 rounded-full hover:bg-opacity-20 transition-all"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="aspect-square relative rounded-lg overflow-hidden mb-4">
            <Image src={imageData || "/placeholder.svg"} alt="Outfit" fill className="object-cover" />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="hidden md:block">
              <Card className="bg-white bg-opacity-5 border-0">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-medium">Season</h3>
                        <p className="text-sm text-gray-400">{analysis?.season || "All Season"}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Tag className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-medium">Style</h3>
                        <p className="text-sm text-gray-400">
                          {analysis
                            ? Object.entries(analysis.style)
                                .filter(([_, value]) => value > 0.5)
                                .map(([key]) => key)
                                .join(", ")
                            : "Casual"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Palette className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-medium">Patterns</h3>
                        <p className="text-sm text-gray-400">{analysis?.patterns.join(", ") || "Solid"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">
                {isTabVisible
                  ? "Analyzing your outfit in detail..."
                  : "Analysis will continue when you return to this tab..."}
              </p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white bg-opacity-10 mb-6">
                <TabsTrigger
                  value="clothing"
                  className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  <Shirt className="w-4 h-4 mr-2" />
                  Clothing
                </TabsTrigger>
                <TabsTrigger
                  value="accessories"
                  className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  <Watch className="w-4 h-4 mr-2" />
                  Accessories
                </TabsTrigger>
                <TabsTrigger
                  value="style"
                  className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Style
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clothing" className="mt-0">
                {renderClothingItems()}
              </TabsContent>

              <TabsContent value="accessories" className="mt-0">
                {renderAccessories()}
              </TabsContent>

              <TabsContent value="style" className="mt-0">
                {renderStyleAnalysis()}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
