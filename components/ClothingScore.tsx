"use client"

interface ClothingScoreProps {
  score: number
  scenario: string
  onAddToWardrobe: () => void
  onRetake: () => void
}

export default function ClothingScore({ score, scenario, onAddToWardrobe, onRetake }: ClothingScoreProps) {
  // Function to determine score color
  const getScoreColor = () => {
    if (score >= 90) return "text-green-400"
    if (score >= 75) return "text-blue-400"
    if (score >= 60) return "text-yellow-400"
    if (score >= 40) return "text-orange-400"
    return "text-red-400"
  }

  // Function to get score message
  const getScoreMessage = () => {
    if (score >= 90) return "Excellent match!"
    if (score >= 75) return "Great match!"
    if (score >= 60) return "Good match"
    if (score >= 40) return "Fair match"
    return "Not ideal for this occasion"
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-black text-white">
      <h2 className="text-4xl font-light mb-6">Your Outfit Score</h2>
      <div className={`text-7xl font-bold mb-2 ${getScoreColor()}`}>{score}</div>
      <div className={`text-xl mb-6 ${getScoreColor()}`}>{getScoreMessage()}</div>
      <p className="text-xl mb-8 text-center">
        Your outfit scores {score} out of 100 for a {scenario}.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={onAddToWardrobe}
          className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition duration-300"
        >
          Add to Wardrobe
        </button>
        <button
          onClick={onRetake}
          className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-30 transition duration-300"
        >
          Retake
        </button>
      </div>
    </div>
  )
}
