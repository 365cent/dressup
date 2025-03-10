"use client"

import { useState } from "react"
import CameraCapture from "../components/CameraCapture"
import ScenarioPrompt from "../components/ScenarioPrompt"
import ClothingScore from "../components/ClothingScore"
import Wardrobe from "../components/Wardrobe"

export default function Home() {
  const [currentStep, setCurrentStep] = useState("capture")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [scenario, setScenario] = useState<string>("")
  const [clothingScore, setClothingScore] = useState<number | null>(null)
  const [wardrobe, setWardrobe] = useState<Array<{ image: string; score: number }>>([])

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData)
    setCurrentStep("prompt")
  }

  const handleScenarioSubmit = (userScenario: string) => {
    setScenario(userScenario)
    // Here you would typically send the image to OpenAI API for analysis
    // For now, we'll use a mock score
    setClothingScore(Math.floor(Math.random() * 100))
    setCurrentStep("score")
  }

  const handleAddToWardrobe = () => {
    if (capturedImage && clothingScore !== null) {
      setWardrobe([...wardrobe, { image: capturedImage, score: clothingScore }])
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
      {currentStep === "score" && (
        <ClothingScore
          score={clothingScore}
          scenario={scenario}
          onAddToWardrobe={handleAddToWardrobe}
          onRetake={resetToCamera}
        />
      )}
      {currentStep === "wardrobe" && <Wardrobe items={wardrobe} scenario={scenario} onBack={resetToCamera} />}
    </main>
  )
}

