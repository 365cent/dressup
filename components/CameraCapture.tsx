"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Aperture, SwitchCamera } from "lucide-react"
import RealtimeScore from "./RealtimeScore"
import RealtimeAnalysisSidebar from "./RealtimeAnalysisSidebar"
// Keep server-side analyzeOutfit for the main capture button (via MCP)
import { analyzeOutfit } from "@/lib/ml-service"
// Remove direct import of analyzeOutfitDetails
import { type OutfitAnalysis } from "@/lib/clothing-analysis-service"
// Import executeMCPOperation
import { executeMCPOperation, type AnalysisResult } from "@/lib/mcp-protocol"
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
  const [isCapturing, setIsCapturing] = useState(true) // Default to true, but startCapture checks visibility
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentImageData, setCurrentImageData] = useState<string | null>(null)
  const [isTabVisible, setIsTabVisible] = useState(true) // Assume visible initially
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [detailedAnalysis, setDetailedAnalysis] = useState<OutfitAnalysis | null>(null)
  const [isDetailedAnalysisLoading, setIsDetailedAnalysisLoading] = useState(false)
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pendingAnalysisRef = useRef<boolean>(false)

  // Function to stop the camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
      console.log("Stopping camera tracks"); // Debug log
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    setIsCapturing(false) // Ensure state reflects camera is off
    
    // Clear intervals when camera stops
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
      captureIntervalRef.current = null
    }
    
    if (analysisIntervalRef.current) {
      clearTimeout(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
  }, [])

  const startCapture = useCallback(async () => {
    // Don't start if tab is not visible or already capturing
    if (!isDocumentVisible() || (videoRef.current && videoRef.current.srcObject)) {
      console.log(`Skipping startCapture: visible=${isDocumentVisible()}, srcObject=${!!videoRef.current?.srcObject}`); // Debug log
      return;
    }
    
    console.log("Attempting to start camera..."); // Debug log
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      })
      
      // If component was unmounted or tab became hidden during getUserMedia, clean up
      if (!videoRef.current || !isDocumentVisible()) {
        console.log("Aborting camera start due to component unmount or visibility change"); // Debug log
        stream.getTracks().forEach(track => track.stop())
        return
      }
      
      console.log("Camera stream acquired"); // Debug log
      videoRef.current.srcObject = stream
      setIsCapturing(true) // Set capturing state on success
    } catch (err) {
      console.error("Error accessing camera:", err)
      setIsCapturing(false) // Ensure state is false on error
    }
  }, [facingMode]) // Removed isTabVisible dependency, using isDocumentVisible directly

  // Initialize visibility tracking and handle changes
  useEffect(() => {
    // Set initial visibility state
    setIsTabVisible(isDocumentVisible());

    initVisibilityTracking()

    // Register for visibility changes
    const unsubscribe = onVisibilityChange((isVisible) => {
      console.log(`Visibility changed: ${isVisible}`); // Debug log
      setIsTabVisible(isVisible)

      if (isVisible) {
        // Tab became visible, start camera if not already running
        startCapture()
      } else {
        // Tab became hidden, stop camera
        stopCamera()
      }
    })

    return () => {
      unsubscribe()
      stopCamera() // Stop camera when component unmounts
    }
  }, [stopCamera, startCapture]) // Dependencies include stop/start functions

  // Start camera on initial mount only if tab is visible
  useEffect(() => {
    if (isTabVisible) {
      startCapture()
    }
    
    // Cleanup function remains the same
    return () => {
      stopCamera()
    }
    // Run only once on mount, but depend on start/stop functions
  }, [startCapture, stopCamera, isTabVisible]) 
  
  // Function to capture the current frame from video
  const captureCurrentFrame = useCallback(() => {
    // Only capture if the camera is active
    if (!isCapturing || !videoRef.current || !canvasRef.current) {
      return null;
    }
    // ... rest of the function remains the same
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
  }, [facingMode, isCapturing]) // Added isCapturing dependency

  // Function to perform detailed analysis using MCP
  const performDetailedAnalysis = useCallback(
    async (imageData: string) => {
      if (!isTabVisible) {
        console.log("Deferring detailed analysis, tab not visible");
        pendingAnalysisRef.current = true; // Still track pending if needed elsewhere
        return;
      }

      setIsDetailedAnalysisLoading(true);
      try {
        // Use MCP to trigger server-side detailed analysis
        const analysisResult: AnalysisResult = await executeMCPOperation({
          type: "ANALYZE_DETAILS",
          imageData: imageData,
        });

        // Check visibility *after* await, before setting state
        if (isTabVisible) {
          if (analysisResult.status === "success") {
            // Assuming analysisResult.result contains the OutfitAnalysis data
            setDetailedAnalysis(analysisResult.result as OutfitAnalysis);
            setLastAnalysisTime(new Date(analysisResult.timestamp));
          } else {
            // Handle analysis error reported by the server
            console.error("Detailed analysis failed on server:", analysisResult.error);
            setDetailedAnalysis(null); // Clear previous analysis on error
            // Optionally set an error state for the sidebar
          }
        } else {
          console.log("Discarding detailed analysis result, tab became hidden");
        }
      } catch (error) {
        // Handle network errors or MCP execution errors
        console.error("Error executing detailed analysis MCP operation:", error);
        if (isTabVisible) {
           setDetailedAnalysis(null); // Clear previous analysis on error
           // Optionally set an error state for the sidebar
        }
      } finally {
        // Update loading state regardless of visibility
        setIsDetailedAnalysisLoading(false);
      }
    },
    [isTabVisible] // Dependency remains isTabVisible
  );

  // Set up interval for capturing frames and updating currentImageData
  useEffect(() => {
    // Only run interval if capturing and tab is visible
    if (isCapturing && isTabVisible && !captureIntervalRef.current) {
      console.log("Starting capture interval"); // Debug log
      captureIntervalRef.current = setInterval(() => {
        const imageData = captureCurrentFrame()
        // Check visibility again before setting state
        if (imageData && isDocumentVisible()) { 
          setCurrentImageData(imageData)
        }
      }, 1000) // Update every second for smooth UI
    } else if ((!isCapturing || !isTabVisible) && captureIntervalRef.current) {
      // Clear interval if no longer capturing or tab hidden
      console.log("Clearing capture interval"); // Debug log
      clearInterval(captureIntervalRef.current)
      captureIntervalRef.current = null
    }

    // Cleanup function clears interval if component unmounts while interval is running
    return () => {
      if (captureIntervalRef.current) {
        console.log("Clearing capture interval on cleanup"); // Debug log
        clearInterval(captureIntervalRef.current)
        captureIntervalRef.current = null
      }
    }
  }, [isCapturing, isTabVisible, captureCurrentFrame]) // Add isTabVisible dependency

  // Set up interval for detailed analysis with random variation
  useEffect(() => {
    // Only run interval if capturing, tab is visible, and sidebar is open
    if (isCapturing && isTabVisible && sidebarOpen && !analysisIntervalRef.current) {
      const scheduleNextAnalysis = () => {
        // Base interval of 3 seconds with random variation of ±0.5 seconds
        const randomVariation = (Math.random() - 0.5) * 1000 // ±0.5 seconds in milliseconds
        const interval = 3000 + randomVariation // 3 seconds ± random variation

        analysisIntervalRef.current = setTimeout(() => {
          // Check conditions again before performing analysis
          if (isCapturing && isTabVisible && sidebarOpen) {
            const imageData = captureCurrentFrame()
            if (imageData) {
              performDetailedAnalysis(imageData)
            }
          }

          // Clear the current timeout ref before scheduling next
          analysisIntervalRef.current = null 
          
          // Schedule next only if conditions still met
          if (isCapturing && isTabVisible && sidebarOpen) {
             scheduleNextAnalysis()
          } else {
             console.log("Stopping detailed analysis interval"); // Debug log
          }

        }, interval)
      }
      console.log("Starting detailed analysis interval"); // Debug log
      scheduleNextAnalysis()
    } else if ((!isCapturing || !isTabVisible || !sidebarOpen) && analysisIntervalRef.current) {
       // Clear timeout if conditions are no longer met
       console.log("Clearing detailed analysis timeout"); // Debug log
       clearTimeout(analysisIntervalRef.current)
       analysisIntervalRef.current = null
    }

    // Cleanup function clears timeout
    return () => {
      if (analysisIntervalRef.current) {
        console.log("Clearing detailed analysis timeout on cleanup"); // Debug log
        clearTimeout(analysisIntervalRef.current)
        analysisIntervalRef.current = null
      }
    }
  }, [isCapturing, isTabVisible, sidebarOpen, captureCurrentFrame, performDetailedAnalysis]) // Add isTabVisible dependency

  // When sidebar is opened, immediately perform analysis if conditions met
  useEffect(() => {
    if (sidebarOpen && isTabVisible && isCapturing && !detailedAnalysis && !isDetailedAnalysisLoading && currentImageData) {
      performDetailedAnalysis(currentImageData)
    }
  }, [sidebarOpen, isTabVisible, isCapturing, detailedAnalysis, isDetailedAnalysisLoading, currentImageData, performDetailedAnalysis]) // Add isTabVisible, isCapturing

  // Update captureFrame to potentially use MCP if needed, or keep using direct ml-service call if that's intended for basic analysis
  // NOTE: The current code uses analyzeOutfit from ml-service directly. If this should also go via MCP, update this function similarly to performDetailedAnalysis.
  // Assuming the basic analyzeOutfit is okay to call directly (maybe it's simpler or intended for client-side in some contexts, though imported from ml-service suggests server).
  // For consistency, let's route the main capture analysis via MCP as well.
  const captureFrame = useCallback(async () => {
    // Ensure camera is capturing before proceeding
    if (!isCapturing || !videoRef.current || !canvasRef.current) {
      console.log("Capture frame called but camera not ready/capturing"); // Debug log
      return;
    }
    // ... rest of the function remains the same
    setIsAnalyzing(true)

    const imageData = captureCurrentFrame()
    if (!imageData) {
      setIsAnalyzing(false)
      return
    }

    try {
      // Check visibility again before making the API call
      if (isDocumentVisible()) {
        // Use MCP to trigger server-side basic analysis
        const analysisResult: AnalysisResult = await executeMCPOperation({
          type: "ANALYZE_OUTFIT",
          imageData: imageData,
        });

        if (isDocumentVisible()) {
          if (analysisResult.status === "success" && analysisResult.result) {
            // Extract basic scores from the result
            const { comfort, fitConfidence, colorHarmony } = analysisResult.result;
            if (typeof comfort === 'number' && typeof fitConfidence === 'number' && typeof colorHarmony === 'number') {
              onCapture(imageData, { comfort, fitConfidence, colorHarmony });
            } else {
               console.error("Invalid basic analysis result structure via MCP:", analysisResult.result);
               onCapture(imageData, { comfort: -1, fitConfidence: -1, colorHarmony: -1 }); // Error indication
            }
          } else {
            console.error("Basic analysis failed on server via MCP:", analysisResult.error);
            onCapture(imageData, { comfort: -1, fitConfidence: -1, colorHarmony: -1 }); // Error indication
          }
        } else {
          console.log("Discarding capture result, tab became hidden during analysis"); // Debug log
        }
      } else {
        // Mark that we have a pending analysis
        pendingAnalysisRef.current = true
        console.log("Deferring capture analysis, tab not visible"); // Debug log

        // Provide placeholder data immediately if needed by parent
        onCapture(imageData, {
          comfort: 0, // Indicate data is placeholder/pending
          fitConfidence: 0,
          colorHarmony: 0,
        })
      }
    } catch (error) {
      console.error("Error executing basic analysis MCP operation:", error);
      if (isDocumentVisible()) {
         onCapture(imageData, { comfort: -1, fitConfidence: -1, colorHarmony: -1 }); // Error indication
      }
    } finally {
      setIsAnalyzing(false)
    }
  }, [onCapture, captureCurrentFrame, isCapturing, isTabVisible]) // Dependencies remain the same

  const flipCamera = useCallback(() => {
    // Stop the current camera first
    stopCamera();
    // Change facing mode
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    // Use a slight delay to allow tracks to fully stop before starting new ones
    setTimeout(() => {
      // Only start if the tab is currently visible
      if (isDocumentVisible()) {
        startCapture();
      } else {
        console.log("Flip camera: Tab not visible, delaying startCapture"); // Debug log
      }
    }, 150); // Increased delay slightly
  }, [stopCamera, startCapture]); // Dependencies are correct

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Ensure video is muted to avoid potential autoplay issues
        className={`h-full w-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
      />
      
      {/* Loading/Starting indicator */}
      {!isCapturing && isTabVisible && ( // Show only if tab is visible but camera isn't capturing yet
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Content shown when camera is capturing */}
      {isCapturing && videoRef.current?.srcObject && (
        <>
          {/* RealtimeScore still uses client-side analysis - this might need adjustment if consistency is key */}
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

          {/* Analysis paused indicator */}
          {!isTabVisible && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
              Camera & Analysis paused - tab not in focus
            </div>
          )}

          {/* Control buttons */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-8">
            <button
              onClick={captureFrame}
              disabled={isAnalyzing || !isCapturing} // Disable if analyzing or not capturing
              className={`bg-white bg-opacity-20 p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30 ${
                isAnalyzing || !isCapturing ? "opacity-50 cursor-not-allowed" : ""
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
              disabled={isAnalyzing || !isTabVisible} // Disable if analyzing or tab not visible (prevents flipping while hidden)
              className={`bg-white bg-opacity-20 p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30 ${
                isAnalyzing || !isTabVisible ? "opacity-50 cursor-not-allowed" : ""
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
