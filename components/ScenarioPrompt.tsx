"use client"

import type React from "react"

import { useState } from "react"

interface ScenarioPromptProps {
  onSubmit: (scenario: string) => void
  isLoading?: boolean
}

export default function ScenarioPrompt({ onSubmit, isLoading = false }: ScenarioPromptProps) {
  const [scenario, setScenario] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(scenario)
  }

  // Common scenarios for quick selection
  const commonScenarios = ["Job interview", "Date night", "Casual outing", "Wedding", "Workout", "Business meeting"]

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-black">
      <h2 className="text-3xl font-light mb-8 text-white text-center">What's the occasion?</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input
          type="text"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder="E.g., Job interview, Date night, Casual outing"
          className="w-full px-4 py-3 rounded-full bg-white bg-opacity-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white mb-6"
          disabled={isLoading}
        />

        <div className="flex flex-wrap gap-2 mb-6">
          {commonScenarios.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScenario(s)}
              className="px-3 py-1 bg-white bg-opacity-10 rounded-full text-sm text-white hover:bg-opacity-20 transition-all"
              disabled={isLoading}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || !scenario.trim()}
          className={`w-full bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition duration-300 ${
            isLoading || !scenario.trim() ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
              Analyzing...
            </div>
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </div>
  )
}
