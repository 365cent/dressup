"use client"

import { useState } from "react"

interface ScenarioPromptProps {
  onSubmit: (scenario: string) => void
}

export default function ScenarioPrompt({ onSubmit }: ScenarioPromptProps) {
  const [scenario, setScenario] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(scenario)
  }

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
        />
        <button
          type="submit"
          className="w-full bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition duration-300"
        >
          Submit
        </button>
      </form>
    </div>
  )
}

