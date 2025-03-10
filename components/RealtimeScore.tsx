"use client"

import type React from "react"

interface ScoreData {
  overall: number
  comfort: number
  fitConfidence: number
  colorHarmony: number
}

interface RealtimeScoreProps {
  scores: ScoreData
}

const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => (
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-white mr-2">{label}</span>
    <div className="w-24 bg-white bg-opacity-20 rounded-full h-2">
      <div className="bg-white h-2 rounded-full" style={{ width: `${score}%` }}></div>
    </div>
  </div>
)

const RealtimeScore: React.FC<RealtimeScoreProps> = ({ scores }) => {
  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 max-w-xs">
      <div className="text-2xl font-light text-white mb-2">{scores.overall}</div>
      <ScoreBar score={scores.comfort} label="Comfort" />
      <ScoreBar score={scores.fitConfidence} label="Fit" />
      <ScoreBar score={scores.colorHarmony} label="Color" />
    </div>
  )
}

export default RealtimeScore

