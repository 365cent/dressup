"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronRight, ChevronLeft, User, Shirt, ShoppingBag, Watch } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
}

export default function WardrobeItemDetail({ image, scenario, score, details, onBack }: WardrobeItemDetailProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Use the provided details
  const personData = details;

  const metrics: Metric[] = [
    { name: "Occasion Match", value: score },
    { name: "Comfort", value: Math.round(score * 0.95) },
    { name: "Fit Confidence", value: Math.round(score * 1.02) },
    { name: "Color Harmony", value: Math.round(score * 0.98) },
  ]

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

  const renderWearingItems = () => {
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
                  {Object.entries(item).map(([key, value]) => {
                    if (key === "item" || key === "category") return null
                    return (
                      <div key={key} className="flex flex-col">
                        <span className="text-xs text-gray-400 capitalize">{key.replace("_", " ")}</span>
                        <span className="text-sm capitalize">
                          {typeof value === "boolean" ? (value ? "Yes" : "No") : value.toString()}
                        </span>
                      </div>
                    )
                  })}
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

  return (
    <div className="relative h-full w-full bg-black text-white overflow-hidden">
      {/* Full screen image */}
      <div className="absolute inset-0 z-0">
        <Image src={image || "/placeholder.svg"} alt="Outfit detail" fill className="object-contain" />
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
            className="absolute top-0 right-0 z-10 h-full w-2/3 bg-black bg-opacity-80 backdrop-blur-md rounded-l-3xl overflow-hidden"
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
                <p className="text-3xl font-bold mb-1" 
                   style={{ 
                     color: score >= 90 ? '#4ade80' : 
                            score >= 75 ? '#22d3ee' : 
                            score >= 60 ? '#facc15' : 
                            score >= 40 ? '#fb923c' : 
                            '#ef4444',
                     textShadow: "-1px -1px 0 rgba(0,0,0,0.3), 1px -1px 0 rgba(0,0,0,0.3), -1px 1px 0 rgba(0,0,0,0.3), 1px 1px 0 rgba(0,0,0,0.3)" 
                   }}>
                  {getMatchTitle(score)}
                </p>
              </div>

              {/* Metrics */}
              <div className="mb-6">{renderMetrics()}</div>

              {/* Person details */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 mr-2" />
                  <h3 className="text-xl font-medium">Person</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-white bg-opacity-5 p-4 rounded-xl">
                  {Object.entries(personData).map(([key, value]) => {
                    if (key === "wearing") return null
                    return (
                      <div key={key} className="flex flex-col">
                        <span className="text-xs text-gray-400 capitalize">{key}</span>
                        <span className="text-sm capitalize">{value}</span>
                      </div>
                    )
                  })}
                </div>
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
