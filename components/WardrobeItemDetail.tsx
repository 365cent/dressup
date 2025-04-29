"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, ChevronRight, ChevronLeft, User, Shirt, ShoppingBag, Watch, Lightbulb } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

interface WearingItem {
  item: string
  category: string
  color: string
  pattern?: string
  material?: string
  brand?: string
  luxury: boolean
  clean?: boolean
  comfortable?: boolean
  fit_style?: string
  season?: string
  opacity?: string
  color_match?: string
  trendiness?: string
  formalness?: string
  user_rating: number
  length?: string
  stretchable?: boolean
  waist_fit?: string
  shining?: boolean
}

interface PersonData {
  type: string
  gender: string
  age: string
  skin: string
  pose: string
  expression: string
  fit: string
  wearing: WearingItem[]
}

interface Metric {
  name: string
  value: number
}

interface WardrobeItemDetailProps {
  image: string
  scenario: string
  score: number
  details: PersonData
  onBack: () => void
  onViewDetailedAnalysis?: (imageData: string) => void
}

export default function WardrobeItemDetail({
  image,
  scenario,
  score,
  details,
  onBack,
  onViewDetailedAnalysis,
}: WardrobeItemDetailProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const router = useRouter()

  // Use the provided details
  const personData = details

  const metrics: Metric[] = [
    { name: "Occasion Match", value: score },
    { name: "Comfort", value: Math.round(score * 0.95) },
    { name: "Fit Confidence", value: Math.round(score * 1.02) },
    { name: "Color Harmony", value: Math.round(score * 0.98) },
  ]

  // Load AI suggestions using API route when component mounts
  useEffect(() => {
    const loadSuggestions = async () => {
      setLoadingSuggestions(true)
      try {
        const response = await fetch('/api/style-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData: image, occasion: scenario }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          // Use fallback suggestions from API if available
          if (data.fallbackSuggestions) {
            setSuggestions(data.fallbackSuggestions);
          } else {
            throw new Error(data.error || 'Failed to get style suggestions');
          }
        } else {
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error("Error loading suggestions:", error);
        // Fallback suggestions if API fails completely
        setSuggestions([
          "Consider adding accessories to enhance your outfit",
          "Try layering for more visual interest",
          "Ensure your colors complement each other well",
          "Pay attention to fit - it's key to looking polished",
        ]);
      } finally {
        setLoadingSuggestions(false)
      }
    }

    loadSuggestions()
  }, [image, scenario])

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "top":
        return <Shirt className="w-5 h-5" />
      case "bottom":
        return <ShoppingBag className="w-5 h-5" />
      case "footwear":
        return <ShoppingBag className="w-5 h-5" />
      case "accessory":
        return <Watch className="w-5 h-5" />
      default:
        return <ShoppingBag className="w-5 h-5" />
    }
  }

  const getMatchTitle = (matchPercentage: number) => {
    if (matchPercentage >= 90) return "Excellent Match"
    if (matchPercentage >= 75) return "Great Match"
    if (matchPercentage >= 60) return "Good Match"
    if (matchPercentage >= 40) return "Fair Match"
    return "Poor Match"
  }

  // Improved person information display
  const renderPersonInfo = () => {
    // Filter out properties we want to display in a specific order
    const orderedProps = ['type', 'gender', 'age', 'skin', 'pose', 'expression', 'fit'];
    
    // Filter out 'wearing' and any undefined/null values
    const filteredEntries = Object.entries(personData)
      .filter(([key, value]) => key !== 'wearing' && value !== undefined && value !== null);
    
    // Sort entries based on the ordered properties
    const sortedEntries = filteredEntries.sort(([keyA], [keyB]) => {
      const indexA = orderedProps.indexOf(keyA);
      const indexB = orderedProps.indexOf(keyB);
      
      // If both keys are in orderedProps, sort by their index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only keyA is in orderedProps, it comes first
      if (indexA !== -1) return -1;
      
      // If only keyB is in orderedProps, it comes first
      if (indexB !== -1) return 1;
      
      // If neither key is in orderedProps, maintain their original order
      return 0;
    });
    
    return (
      <div className="grid grid-cols-2 gap-3 bg-white bg-opacity-5 p-4 rounded-xl">
        {sortedEntries.map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-xs text-gray-400 capitalize">{key.replace(/_/g, " ")}</span>
            <span className="text-sm capitalize">{value as string}</span>
          </div>
        ))}
      </div>
    );
  };

  // Improved wearing items display
  const renderWearingItems = () => {
    // Check if wearing array exists and has items
    if (!personData.wearing || !Array.isArray(personData.wearing) || personData.wearing.length === 0) {
      return (
        <div className="p-4 bg-white bg-opacity-5 rounded-xl text-center text-gray-400">
          No clothing items detected
        </div>
      );
    }

    return personData.wearing.map((item, index) => (
      <div key={index} className="mb-3">
        <button
          onClick={() => toggleSection(item.item)}
          className="w-full flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition-all duration-300"
        >
          <div className="flex items-center">
            {getCategoryIcon(item.category)}
            <span className="ml-3 capitalize">{item.item}</span>
          </div>
          <ChevronRight
            className={`w-5 h-5 transition-transform duration-300 ${expandedSection === item.item ? "rotate-90" : ""}`}
          />
        </button>

        <AnimatePresence>
          {expandedSection === item.item && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-white bg-opacity-5 mt-1 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(item)
                    .filter(([key]) => key !== "item" && key !== "category")
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-xs text-gray-400 capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-sm capitalize">
                          {typeof value === "boolean" 
                            ? (value ? "Yes" : "No") 
                            : typeof value === "undefined" ? "-" : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ))
  }

  const renderMetrics = () => {
    return metrics.map((metric, index) => (
      <div key={index} className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm">{metric.name}</span>
          <span className="text-sm font-semibold">{metric.value}%</span>
        </div>
        <div className="relative h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-white" style={{ width: `${metric.value}%` }} />
          <svg
            className="absolute top-1/2 transform -translate-y-1/2 text-yellow-400"
            style={{ left: `${metric.value}%`, marginLeft: "-8px" }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
      </div>
    ))
  }

  const renderSuggestions = () => {
    if (loadingSuggestions) {
      return (
        <div className="flex justify-center items-center py-4">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Loading suggestions...</span>
        </div>
      )
    }

    if (!suggestions || suggestions.length === 0) {
      return (
        <div className="p-4 bg-white bg-opacity-5 rounded-xl text-center text-gray-400">
          No style suggestions available
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-start p-2 bg-white bg-opacity-5 rounded-lg">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm">{suggestion}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-black text-white overflow-hidden">
      {/* Full screen image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={image || "/placeholder.svg"} 
          alt={`Outfit for ${scenario}`}
          fill 
          className="object-contain" 
          priority
        />
      </div>

      {/* Score badge */}
      <div className="absolute top-6 left-6 z-10 bg-black bg-opacity-50 backdrop-blur-sm rounded-full px-4 py-2">
        <span className="text-2xl font-semibold">{score}</span>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 right-6 z-20 bg-black bg-opacity-50 backdrop-blur-sm rounded-full p-2 hover:bg-opacity-70 transition-all duration-300"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute bottom-6 right-6 z-20 bg-white text-black rounded-full p-3 shadow-lg hover:bg-opacity-90 transition-all duration-300"
      >
        {sidebarOpen ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
      </button>

      {/* Collapsible sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-0 right-0 z-10 h-full w-full md:w-2/3 lg:w-1/2 bg-black bg-opacity-80 backdrop-blur-md rounded-l-3xl overflow-hidden"
          >
            <div className="h-full flex flex-col p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-light">Outfit Details</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="bg-white bg-opacity-10 rounded-full p-2 hover:bg-opacity-20 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scenario Match */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Scenario: {scenario}</h3>
                <p
                  className="text-3xl font-bold mb-1"
                  style={{
                    color:
                      score >= 90
                        ? "#4ade80"
                        : score >= 75
                          ? "#22d3ee"
                          : score >= 60
                            ? "#facc15"
                            : score >= 40
                              ? "#fb923c"
                              : "#ef4444",
                    textShadow:
                      "-1px -1px 0 rgba(0,0,0,0.3), 1px -1px 0 rgba(0,0,0,0.3), -1px 1px 0 rgba(0,0,0,0.3), 1px 1px 0 rgba(0,0,0,0.3)",
                  }}
                >
                  {getMatchTitle(score)}
                </p>
              </div>

              {/* Metrics */}
              <div className="mb-6">{renderMetrics()}</div>

              {/* AI Suggestions */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                  <h3 className="text-xl font-medium">Style Suggestions</h3>
                </div>
                {renderSuggestions()}
              </div>

              {/* Person details */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 mr-2" />
                  <h3 className="text-xl font-medium">Person</h3>
                </div>
                {renderPersonInfo()}
              </div>

              {/* Wearing items */}
              <div>
                <div className="flex items-center mb-4">
                  <Shirt className="w-5 h-5 mr-2" />
                  <h3 className="text-xl font-medium">Wearing</h3>
                </div>
                {renderWearingItems()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
