"use client"

import { useState } from "react"
import CameraCapture from "../components/CameraCapture"
import ScenarioPrompt from "../components/ScenarioPrompt"
import ClothingScore from "../components/ClothingScore"
import Wardrobe from "../components/Wardrobe"
import AnalyzeDetail from "../components/actions/AnalyzeDetail"
import AnalyzeOccasion from "../components/actions/AnlyzeOccasion"

interface OutfitScores {
    comfort: number;
    fitConfidence: number;
    colorHarmony: number;
}

interface CapturedOutfit {
    image: string;
    scores: OutfitScores;
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
    image: string;
    scenario: string;
    score: number;
    details: PersonData;
}

export default function Home() {
    const [currentStep, setCurrentStep] = useState<"capture" | "prompt" | "score" | "wardrobe">("capture")
    const [capturedOutfits, setCapturedOutfits] = useState<CapturedOutfit[]>([])
    const [scenario, setScenario] = useState<string>("")

    // Store the analysis results so we can reuse them when adding to the wardrobe
    const [analyzedDetails, setAnalyzedDetails] = useState<PersonData | null>(null)
    const [analyzedScore, setAnalyzedScore] = useState<number | null>(null)

    const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([])

    const handleCapture = (imageData: string, scores: OutfitScores) => {
        setCapturedOutfits(prev => [...prev, { image: imageData, scores }])
        setCurrentStep("prompt")
    }

    const handleScenarioSubmit = async (userScenario: string) => {
        setScenario(userScenario)

        const latestOutfit = capturedOutfits[capturedOutfits.length - 1]

        // Perform analyses here
        const details = await AnalyzeDetail(latestOutfit.image, userScenario)
        const occScore = await AnalyzeOccasion(details, userScenario)

        // Store the results of analyses in state
        setAnalyzedDetails(details)
        setAnalyzedScore(occScore)

        setCurrentStep("score")
    }

    const handleAddToWardrobe = () => {
        // Just reuse the existing data stored in analyzedDetails and analyzedScore
        if (capturedOutfits.length > 0 && analyzedDetails && analyzedScore !== null) {
            const latestOutfit = capturedOutfits[capturedOutfits.length - 1]

            setWardrobe([...wardrobe, {
                image: latestOutfit.image,
                scenario,
                score: analyzedScore,
                details: analyzedDetails
            }])

            setCurrentStep("wardrobe")
        }
    }

    const resetToCamera = () => {
        setCurrentStep("capture")
    }

    return (
        <main className="h-screen w-screen bg-black text-white overflow-hidden">
            {currentStep === "capture" && <CameraCapture onCapture={handleCapture} />}
            {currentStep === "prompt" && <ScenarioPrompt onSubmit={handleScenarioSubmit} />}
            {currentStep === "score" && analyzedScore && (
                <ClothingScore
                    score={analyzedScore ?? 0}
                    scenario={scenario}
                    onAddToWardrobe={handleAddToWardrobe}
                    onRetake={resetToCamera}
                />
            )}
            {currentStep === "wardrobe" && (
                <Wardrobe 
                    items={wardrobe} 
                    scenario={scenario} 
                    score={analyzedScore ?? 0} 
                    onBack={resetToCamera} 
                />
            )}
        </main>
    )
}
