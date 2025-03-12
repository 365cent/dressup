"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Aperture, SwitchCamera } from "lucide-react"
import RealtimeScore from "./RealtimeScore"
import AnalyzeOutfit from "./actions/AnalyzeOutfit"

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
  const [realtimeScores, setRealtimeScores] = useState<ScoreData>({
    comfort: 0,
    fitConfidence: 0,
    colorHarmony: 0,
  })
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
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
    }
  }, [startCapture])

  const captureFrame = useCallback(() => {
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
        onCapture(imageData, realtimeScores)
        // Reset the canvas transform after capturing
        if (facingMode === "user") {
          context.setTransform(1, 0, 0, 1, 0, 0) // Reset to default
        }
      }
    }
  }, [onCapture, facingMode, realtimeScores])

  const Flip = useCallback(() => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"))
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isCapturing) {
      intervalId = setInterval(async () => {
        const captureFrameForAnalysis = () => {
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
              const imageData = canvasRef.current.toDataURL("image/jpeg").split(',')[1]
              // Reset the canvas transform after capturing
              if (facingMode === "user") {
                context.setTransform(1, 0, 0, 1, 0, 0) // Reset to default
              }
              return imageData
            }
          }
          return null
        }

        const addVariation = (score: number) => {
          const variation = Math.random() * 5 - 2.5
          return Math.max(0, Math.min(100, Math.round(score + variation)))
        }

        const imageData = captureFrameForAnalysis()

        try {
          if (imageData) {
            const scores = await AnalyzeOutfit(imageData)
            setRealtimeScores({
              comfort: addVariation(scores.comfort),
              fitConfidence: addVariation(scores.fitConfidence),
              colorHarmony: addVariation(scores.colorHarmony),
            })
          }
        } catch (error) {
          console.error("Error analyzing outfit:", error)
          setRealtimeScores((prev) => ({
            comfort: addVariation(prev.comfort || Math.floor(Math.random() * 100)),
            fitConfidence: addVariation(prev.fitConfidence || Math.floor(Math.random() * 100)),
            colorHarmony: addVariation(prev.colorHarmony || Math.floor(Math.random() * 100)),
          }))
        }
      }, 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isCapturing, facingMode])

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`h-full w-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`} // Flip video horizontally for front camera
      />
      <RealtimeScore scores={realtimeScores} />
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-8">
        <button
          onClick={captureFrame}
          className="bg-white bg-opacity-20 p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30"
        >
          <Aperture className="w-8 h-8 text-white" />
        </button>
        <button
          onClick={Flip}
          className="bg-white bg-opacity-20 p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30"
        >
          <SwitchCamera className="w-8 h-8 text-white" />
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  )
}