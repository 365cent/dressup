"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Aperture, SwitchCamera } from "lucide-react"
import RealtimeScore from "./RealtimeScore"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
}

interface ScoreData {
  overall: number
  comfort: number
  fitConfidence: number
  colorHarmony: number
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(true)
  const [realtimeScores, setRealtimeScores] = useState<ScoreData>({
    overall: 0,
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
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageData = canvasRef.current.toDataURL("image/jpeg")
        onCapture(imageData)
      }
    }
  }, [onCapture])

  const Flip = useCallback(() => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"))
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isCapturing) {
      intervalId = setInterval(() => {
        // Simulate real-time scoring (replace with actual API call in production)
        setRealtimeScores({
          overall: Math.floor(Math.random() * 100),
          comfort: Math.floor(Math.random() * 100),
          fitConfidence: Math.floor(Math.random() * 100),
          colorHarmony: Math.floor(Math.random() * 100),
        })
      }, 1000) // Update scores every second
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isCapturing])

  return (
    <div className="relative h-full w-full">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
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

