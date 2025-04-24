"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { analyzeOutfit } from "@/lib/ml-service"

interface ScoreData {
  comfort: number
  fitConfidence: number
  colorHarmony: number
}

interface RealtimeScoreProps {
  scores?: ScoreData
  imageData?: string
  isTabVisible?: boolean
}

const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => (
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-white w-20">{label}</span>
    <div className="flex items-center flex-1">
      <div className="w-24 bg-white bg-opacity-20 rounded-full h-2 mr-2">
        <div className="bg-white h-2 rounded-full" style={{ width: `${score}%` }}></div>
      </div>
      <span className="text-sm text-white w-12">{score}%</span>
    </div>
  </div>
)

const RealtimeScore: React.FC<RealtimeScoreProps> = ({ scores: initialScores, imageData, isTabVisible = true }) => {
  const [scores, setScores] = useState<ScoreData>(
    initialScores || {
      comfort: 0,
      fitConfidence: 0,
      colorHarmony: 0,
    },
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [shouldAnalyze, setShouldAnalyze] = useState(false)

  useEffect(() => {
    // If we have initial scores, use them
    if (initialScores) {
      setScores(initialScores)
      return
    }

    // If we have image data and tab is visible, analyze it
    if (imageData && !isAnalyzing && isTabVisible) {
      const analyzeImage = async () => {
        setIsAnalyzing(true)
        try {
          const result = await analyzeOutfit(imageData)
          setScores({
            comfort: result.comfort,
            fitConfidence: result.fitConfidence,
            colorHarmony: result.colorHarmony,
          })
          setShouldAnalyze(false)
        } catch (error) {
          console.error("Error analyzing image:", error)
        } finally {
          setIsAnalyzing(false)
        }
      }

      analyzeImage()
    }
    // If tab is not visible, mark for future analysis
    else if (imageData && !isTabVisible) {
      setShouldAnalyze(true)
    }
  }, [imageData, initialScores, isAnalyzing, isTabVisible])

  // When tab becomes visible, analyze if needed
  useEffect(() => {
    if (isTabVisible && shouldAnalyze && imageData && !isAnalyzing) {
      const analyzeImage = async () => {
        setIsAnalyzing(true)
        try {
          const result = await analyzeOutfit(imageData)
          setScores({
            comfort: result.comfort,
            fitConfidence: result.fitConfidence,
            colorHarmony: result.colorHarmony,
          })
          setShouldAnalyze(false)
        } catch (error) {
          console.error("Error analyzing image:", error)
        } finally {
          setIsAnalyzing(false)
        }
      }

      analyzeImage()
    }
  }, [isTabVisible, shouldAnalyze, imageData, isAnalyzing])

  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 max-w-xs">
      {isAnalyzing ? (
        <div className="flex items-center justify-center py-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm text-white">{isTabVisible ? "Analyzing..." : "Analysis paused"}</span>
        </div>
      ) : (
        <>
          <ScoreBar score={scores.comfort} label="Comfort" />
          <ScoreBar score={scores.fitConfidence} label="Fit" />
          <ScoreBar score={scores.colorHarmony} label="Color" />
        </>
      )}
    </div>
  )
}

export default RealtimeScore
