"use client"

import { useState, useEffect } from "react"
import CameraCapture from "@/components/CameraCapture"
import ScenarioPrompt from "@/components/ScenarioPrompt"
import ClothingScore from "@/components/ClothingScore"
import Wardrobe from "@/components/Wardrobe"
// Import client-side versions of analysis functions
import { analyzeOutfit, matchOutfitToOccasion } from "@/lib/client-data-service"
import { initVisibilityTracking } from "@/lib/visibility-utils"
// Import client-side version of init
import { initializeDataStorage } from "@/lib/client-data-service"

// Keep interfaces here or move to a types file
interface OutfitScores {
  comfort: number
  fitConfidence: number
  colorHarmony: number
}

interface CapturedOutfit {
  image: string
  scores: OutfitScores
}

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

interface WardrobeItem {
  image: string
  scenario: string
  score: number
  details: PersonData
}

export default function AppClient() {
  const [currentStep, setCurrentStep] = useState<"capture" | "prompt" | "score" | "wardrobe">("capture")
  const [capturedOutfits, setCapturedOutfits] = useState<CapturedOutfit[]>([])
  const [scenario, setScenario] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  // Store the analysis results so we can reuse them when adding to the wardrobe
  const [analyzedDetails, setAnalyzedDetails] = useState<PersonData | null>(null)
  const [analyzedScore, setAnalyzedScore] = useState<number | null>(null)

  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([])

  // Initialize data directories and visibility tracking
  useEffect(() => {
    const initialize = async () => {
      try {
        // Use client-side initialization
        await initializeDataStorage()
        console.log("Data directories initialized successfully")
        setIsInitialized(true)
      } catch (error) {
        console.error("Error initializing data directories:", error)
        setInitError(error instanceof Error ? error.message : "Unknown initialization error")
      }

      // Initialize visibility tracking
      initVisibilityTracking()
    }

    initialize()
  }, [])

  // Show initialization error if any
  if (initError) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
        <div className="text-center p-6 bg-red-900 bg-opacity-50 rounded-lg">
          <h1 className="text-2xl mb-4">Initialization Error</h1>
          <p>{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Wait for initialization to complete
  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Initializing app...</p>
        </div>
      </div>
    )
  }

  const handleCapture = async (imageData: string, scores: OutfitScores) => {
    setCapturedOutfits((prev) => [...prev, { image: imageData, scores }])
    setCurrentStep("prompt")
  }

  const handleScenarioSubmit = async (userScenario: string) => {
    setScenario(userScenario)
    setIsLoading(true)

    const latestOutfit = capturedOutfits[capturedOutfits.length - 1]

    try {
      // Use the client-side ML model function to analyze the outfit
      const analysisResult = await analyzeOutfit(latestOutfit.image)

      // Create a PersonData object from the analysis
      const details: PersonData = {
        type: "people",
        gender: "unknown", // This would come from a more advanced model
        age: "unknown",
        skin: "unknown",
        pose: "standing",
        expression: "neutral",
        fit:
          analysisResult.fitConfidence > 80
            ? "excellent"
            : analysisResult.fitConfidence > 70
              ? "good"
              : analysisResult.fitConfidence > 60
                ? "fair"
                : "poor",
        wearing: Object.entries(analysisResult.categories)
          .filter(([_, confidence]) => typeof confidence === "number" && confidence > 0.5)
          .map(([category, confidence]) => ({
            item: category,
            category: category,
            color: analysisResult.colorAnalysis.dominant,
            pattern: "solid",
            material: "unknown",
            brand: "unknown",
            luxury: false,
            clean: true,
            comfortable: analysisResult.comfort > 70,
            fit_style: "regular",
            season: "all-season",
            opacity: "opaque",
            color_match:
              analysisResult.colorHarmony > 80
                ? "excellent"
                : analysisResult.colorHarmony > 70
                  ? "good"
                  : analysisResult.colorHarmony > 60
                    ? "fair"
                    : "poor",
            trendiness: "medium",
            formalness: "casual",
            user_rating: 4.0,
          })),
      }

      // Calculate occasion score using the client-side ML model function
      const occScore = await matchOutfitToOccasion(latestOutfit.image, userScenario)

      // Store the results of analyses in state
      setAnalyzedDetails(details)
      setAnalyzedScore(occScore)

      setCurrentStep("score")
    } catch (error) {
      console.error("Error analyzing outfit:", error)
      // Fallback to placeholder data
      setAnalyzedDetails({
        type: "people",
        gender: "unknown",
        age: "unknown",
        skin: "unknown",
        pose: "standing",
        expression: "neutral",
        fit: "good",
        wearing: [
          {
            item: "shirt",
            category: "top",
            color: "blue",
            luxury: false,
            user_rating: 4.0,
          },
        ],
      })
      setAnalyzedScore(75)
      setCurrentStep("score")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToWardrobe = () => {
    // Just reuse the existing data stored in analyzedDetails and analyzedScore
    if (capturedOutfits.length > 0 && analyzedDetails && analyzedScore !== null) {
      const latestOutfit = capturedOutfits[capturedOutfits.length - 1]

      setWardrobe([
        ...wardrobe,
        {
          image: latestOutfit.image,
          scenario,
          score: analyzedScore,
          details: analyzedDetails,
        },
      ])

      setCurrentStep("wardrobe")
    }
  }

  const resetToCamera = () => {
    setCurrentStep("capture")
    // Reset scenario and analysis results for a clean start
    setScenario("")
    setAnalyzedDetails(null)
    setAnalyzedScore(null)
  }

  return (
    <main className="h-screen w-screen bg-black text-white overflow-hidden">
      {currentStep === "capture" && <CameraCapture onCapture={handleCapture} />}
      {currentStep === "prompt" && <ScenarioPrompt onSubmit={handleScenarioSubmit} isLoading={isLoading} />}
      {currentStep === "score" && analyzedScore !== null && ( // Check analyzedScore is not null
        <ClothingScore
          score={analyzedScore} // Pass the non-null score
          scenario={scenario}
          onAddToWardrobe={handleAddToWardrobe}
          onRetake={resetToCamera}
        />
      )}
      {currentStep === "wardrobe" && analyzedScore !== null && ( // Check analyzedScore is not null
        <Wardrobe items={wardrobe} scenario={scenario} score={analyzedScore} onBack={resetToCamera} />
      )}
    </main>
  )
}
