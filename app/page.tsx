"use client"

import { useState, useEffect } from "react"
import CameraCapture from "@/components/CameraCapture"
import ScenarioPrompt from "@/components/ScenarioPrompt"
import ClothingScore from "@/components/ClothingScore"
import Wardrobe from "@/components/Wardrobe"
import { analyzeOutfit, matchOutfitToOccasion } from "@/lib/ml-service"
import DetailedOutfitAnalysis from "@/components/DetailedOutfitAnalysis"
import { initVisibilityTracking } from "@/lib/visibility-utils"

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

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"capture" | "prompt" | "score" | "wardrobe">("capture")
  const [capturedOutfits, setCapturedOutfits] = useState<CapturedOutfit[]>([])
  const [scenario, setScenario] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Store the analysis results so we can reuse them when adding to the wardrobe
  const [analyzedDetails, setAnalyzedDetails] = useState<PersonData | null>(null)
  const [analyzedScore, setAnalyzedScore] = useState<number | null>(null)

  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([])

  // Add a new state for detailed analysis
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [analysisImage, setAnalysisImage] = useState<string | null>(null)

  // Initialize visibility tracking
  useEffect(() => {
    initVisibilityTracking()
  }, [])

  const handleCapture = async (imageData: string, scores: OutfitScores) => {
    setCapturedOutfits((prev) => [...prev, { image: imageData, scores }])
    setCurrentStep("prompt")
  }

  const handleScenarioSubmit = async (userScenario: string) => {
    setScenario(userScenario)
    setIsLoading(true)

    const latestOutfit = capturedOutfits[capturedOutfits.length - 1]

    try {
      // Use the ML model to analyze the outfit
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
          .filter(([_, confidence]) => confidence > 0.5)
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

      // Calculate occasion score using the ML model
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
  }

  return (
    <main className="h-screen w-screen bg-black text-white overflow-hidden">
      {currentStep === "capture" && <CameraCapture onCapture={handleCapture} />}
      {currentStep === "prompt" && <ScenarioPrompt onSubmit={handleScenarioSubmit} isLoading={isLoading} />}
      {currentStep === "score" && analyzedScore && (
        <ClothingScore
          score={analyzedScore ?? 0}
          scenario={scenario}
          onAddToWardrobe={handleAddToWardrobe}
          onRetake={resetToCamera}
        />
      )}
      {currentStep === "wardrobe" && (
        <Wardrobe items={wardrobe} scenario={scenario} score={analyzedScore ?? 0} onBack={resetToCamera} />
      )}
      {showDetailedAnalysis && analysisImage && (
        <DetailedOutfitAnalysis imageData={analysisImage} onBack={() => setShowDetailedAnalysis(false)} />
      )}
    </main>
  )
}
