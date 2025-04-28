"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Aperture, SwitchCamera } from "lucide-react"
import RealtimeScore from "./RealtimeScore"
import RealtimeAnalysisSidebar from "./RealtimeAnalysisSidebar"
import { analyzeOutfit } from "@/lib/ml-service"
import { analyzeOutfitDetails, processAnalysisQueue, type OutfitAnalysis } from "@/lib/clothing-analysis-service"
import { onVisibilityChange, initVisibilityTracking, isDocumentVisible } from "@/lib/visibility-utils"

interface CameraCaptureProps {
  onCapture: (imageData: string, scores: ScoreData) => void
}

interface ScoreData {
  comfort: number
  fitConfidence: number
  colorHarmony: number
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(true)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentImageData, setCurrentImageData] = useState<string | null>(null)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [detailedAnalysis, setDetailedAnalysis] = useState<OutfitAnalysis | null>(null)
  const [isDetailedAnalysisLoading, setIsDetailedAnalysisLoading] = useState(false)
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false) // New state to track camera readiness

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pendingAnalysisRef = useRef<boolean>(false)

  // Initialize visibility tracking
  useEffect(() => {
    initVisibilityTracking()

    // Register for visibility changes
    const unsubscribe = onVisibilityChange((isVisible) => {
      setIsTabVisible(isVisible)

      // Process any pending analyses when tab becomes visible
      if (isVisible && pendingAnalysisRef.current) {
        pendingAnalysisRef.current = false
        processAnalysisQueue()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const startCapture = useCallback(async () => {
    setIsCameraReady(false) // Reset camera ready state when starting capture
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true) // Mark camera as ready once video metadata is loaded
          setIsCapturing(true)
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }, [facingMode])

  useEffect(() => {
    startCapture()
    return () => {
      if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      }
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
    }
  }, [startCapture])

  // Function to capture the current frame from video
  const captureCurrentFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight

        // Flip the canvas horizontally when using front camera
        if (facingMode === "user") {
          context.scale(-1, 1)
          context.translate(-canvasRef.current.width, 0)
        }

        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageData = canvasRef.current.toDataURL("image/jpeg")

        // Reset the canvas transform after capturing
        if (facingMode === "user") {
          context.setTransform(1, 0, 0, 1, 0, 0) // Reset to default
        }

        return imageData
      }
    }
    return null
  }, [facingMode])

  // Function to perform detailed analysis
  const performDetailedAnalysis = useCallback(
    async (imageData: string) => {
      if (!isTabVisible) {
        pendingAnalysisRef.current = true
        return
      }

      setIsDetailedAnalysisLoading(true)
      try {
        const result = await analyzeOutfitDetails(imageData)
        setDetailedAnalysis(result)
        setLastAnalysisTime(new Date())
      } catch (error) {
        console.error("Error performing detailed analysis:", error)
      } finally {
        setIsDetailedAnalysisLoading(false)
      }
    },
    [isTabVisible],
  )

  // Set up interval for capturing frames and updating currentImageData
  useEffect(() => {
    if (isCapturing && isCameraReady && !captureIntervalRef.current) {
      captureIntervalRef.current = setInterval(() => {
        const imageData = captureCurrentFrame()
        if (imageData && isDocumentVisible()) {
          setCurrentImageData(imageData)
        }
      }, 1000) // Update every second for smooth UI
    }

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
        captureIntervalRef.current = null
      }
    }
  }, [isCapturing, captureCurrentFrame, isCameraReady]) // Added isCameraReady dependency

  // Set up interval for detailed analysis with random variation
  useEffect(() => {
    if (isCapturing && isCameraReady && !analysisIntervalRef.current) {
      const scheduleNextAnalysis = () => {
        // Base interval of 3 seconds with random variation of ±0.5 seconds
        const randomVariation = (Math.random() - 0.5) * 1000 // ±0.5 seconds in milliseconds
        const interval = 3000 + randomVariation // 3 seconds ± random variation

        analysisIntervalRef.current = setTimeout(() => {
          if (sidebarOpen) {
            // Only perform analysis if sidebar is open
            const imageData = captureCurrentFrame()
            if (imageData) {
              performDetailedAnalysis(imageData)
            }
          }

          // Clear the current timeout and schedule the next one
          if (analysisIntervalRef.current) {
            clearTimeout(analysisIntervalRef.current)
            analysisIntervalRef.current = null
          }

          scheduleNextAnalysis()
        }, interval)
      }

      scheduleNextAnalysis()
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearTimeout(analysisIntervalRef.current)
        analysisIntervalRef.current = null
      }
    }
  }, [isCapturing, captureCurrentFrame, performDetailedAnalysis, sidebarOpen, isCameraReady]) // Added isCameraReady dependency

  // When sidebar is opened, immediately perform analysis if we don't have data
  useEffect(() => {
    if (sidebarOpen && !detailedAnalysis && !isDetailedAnalysisLoading && currentImageData) {
      performDetailedAnalysis(currentImageData)
    }
  }, [sidebarOpen, detailedAnalysis, isDetailedAnalysisLoading, currentImageData, performDetailedAnalysis])

  const captureFrame = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      setIsAnalyzing(true)

      const imageData = captureCurrentFrame()
      if (!imageData) {
        setIsAnalyzing(false)
        return
      }

      try {
        // Only analyze if the tab is visible, otherwise defer
        if (isDocumentVisible()) {
          // Analyze the outfit using the Grok-2-Vision model
          const analysis = await analyzeOutfit(imageData)

          // Pass the analysis results to the parent component
          onCapture(imageData, {
            comfort: analysis.comfort,
            fitConfidence: analysis.fitConfidence,
            colorHarmony: analysis.colorHarmony,
          })
        } else {
          // Mark that we have a pending analysis
          pendingAnalysisRef.current = true

          // Use fallback scores for now
          onCapture(imageData, {
            comfort: 75,
            fitConfidence: 75,
            colorHarmony: 75,
          })
        }
      } catch (error) {
        console.error("Error analyzing outfit:", error)
        // Fallback to random scores
        onCapture(imageData, {
          comfort: Math.floor(Math.random() * 40) + 60,
          fitConfidence: Math.floor(Math.random() * 40) + 60,
          colorHarmony: Math.floor(Math.random() * 40) + 60,
        })
      } finally {
        setIsAnalyzing(false)
      }
    }
  }, [onCapture, captureCurrentFrame, isDocumentVisible])

  const flipCamera = useCallback(() => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"))
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`h-full w-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
      />
      
      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Waiting for camera permission...</p>
          </div>
        </div>
      )}

      {isCameraReady && (
        <>
          <RealtimeScore imageData={currentImageData ?? undefined} isTabVisible={isTabVisible} />

          {/* Real-time analysis sidebar */}
          <RealtimeAnalysisSidebar
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            analysis={detailedAnalysis}
            isLoading={isDetailedAnalysisLoading}
            isTabVisible={isTabVisible}
            lastUpdated={lastAnalysisTime}
          />

          {!isTabVisible && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
              Analysis paused - tab not in focus
            </div>
          )}

          <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-8">
            <button
              onClick={captureFrame}
              disabled={isAnalyzing || !isCameraReady}
              className={`bg-white bg-opacity-20 p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30 ${
                isAnalyzing || !isCameraReady ? "opacity-50" : ""
              }`}
            >
              {isAnalyzing ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Aperture className="w-8 h-8 text-white" />
              )}
            </button>
            <button
              onClick={flipCamera}
              disabled={isAnalyzing}
              className={`bg-white bg-opacity-20 p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30 ${
                isAnalyzing ? "opacity-50" : ""
              }`}
            >
              <SwitchCamera className="w-8 h-8 text-white" />
            </button>
          </div>
        </>
      )}
      
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  )
}
