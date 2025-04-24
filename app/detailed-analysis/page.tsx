"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DetailedOutfitAnalysis from "@/components/DetailedOutfitAnalysis"

export default function DetailedAnalysisPage() {
  const [imageData, setImageData] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get the image data from sessionStorage
    const storedImage = sessionStorage.getItem("analysisImage")
    if (storedImage) {
      setImageData(storedImage)
    } else {
      // If no image data is found, redirect back to the home page
      router.push("/")
    }
  }, [router])

  const handleBack = () => {
    router.back()
  }

  if (!imageData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    )
  }

  return <DetailedOutfitAnalysis imageData={imageData} onBack={handleBack} />
}
