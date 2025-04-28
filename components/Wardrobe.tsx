"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import WardrobeItemDetail from "./WardrobeItemDetail"
import DetailedOutfitAnalysis from "./DetailedOutfitAnalysis"
import { BarChart, Search } from "lucide-react"

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

interface WardrobeProps {
  items: Array<{ image: string; scenario: string; score?: number; details: PersonData }>
  scenario: string
  score?: number
  onBack: () => void
}

export default function Wardrobe({ items, scenario, onBack }: WardrobeProps) {
  const [selectedItem, setSelectedItem] = useState<{
    image: string
    scenario: string
    score?: number
    details: PersonData
  } | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [analysisImage, setAnalysisImage] = useState<string | null>(null)
  const router = useRouter()

  if (showDetailedAnalysis && analysisImage) {
    return <DetailedOutfitAnalysis imageData={analysisImage} onBack={() => setShowDetailedAnalysis(false)} />
  }

  if (selectedItem) {
    return (
      <WardrobeItemDetail
        image={selectedItem.image}
        scenario={selectedItem.scenario}
        score={selectedItem.score || 0}
        details={selectedItem.details}
        onBack={() => setSelectedItem(null)}
        onViewDetailedAnalysis={(imageData) => {
          setAnalysisImage(imageData)
          setShowDetailedAnalysis(true)
        }}
      />
    )
  }

  // Get unique scenarios for filtering
  const scenarios = ["all", ...new Set(items.map((item) => item.scenario.toLowerCase()))]

  // Filter items based on selected filter
  const filteredItems = filter === "all" ? items : items.filter((item) => item.scenario.toLowerCase() === filter)

  const navigateToMLDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex flex-col h-full bg-black text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-light">Your Wardrobe</h2>
        <div className="flex gap-2">
          {scenarios.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === s ? "bg-white text-black" : "bg-white bg-opacity-10 text-white hover:bg-opacity-20"
              } transition-all`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400">No outfits found for this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto flex-grow">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className="relative cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => setSelectedItem(item)}
            >
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={`Outfit ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <span className="text-sm truncate">{item.scenario}</span>
                  <div className="bg-black bg-opacity-50 rounded-full px-2 py-1">
                    <span className="text-lg font-semibold">{item.score}</span>
                  </div>
                </div>
                <button
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1.5 hover:bg-opacity-70 transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    setAnalysisImage(item.image)
                    setShowDetailedAnalysis(true)
                  }}
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition duration-300"
        >
          Back to Camera
        </button>

        <button
          onClick={navigateToMLDashboard}
          className="flex items-center bg-white bg-opacity-10 text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-20 transition duration-300"
        >
          <BarChart className="w-5 h-5 mr-2" />
          Dashboard
        </button>
      </div>
    </div>
  )
}
