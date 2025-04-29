"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react" // Added useRef
// Import the client-side version of analyzeOutfit
import { analyzeOutfit } from "@/lib/client-data-service" 

interface ScoreData {
  comfort: number
  fitConfidence: number
  colorHarmony: number
}

// Add null to allow for error/initial state
type ScoresState = ScoreData | null;

interface RealtimeScoreProps {
  // scores?: ScoreData // Removing initialScores prop as analysis is done internally based on imageData
  imageData?: string
  isTabVisible?: boolean
}

const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => {
  // Handle potential negative scores indicating error
  const displayScore = score < 0 ? 0 : score;
  const scoreText = score < 0 ? "N/A" : `${score}%`;
  
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-white w-20">{label}</span>
      <div className="flex items-center flex-1">
        <div className="w-24 bg-white bg-opacity-20 rounded-full h-2 mr-2">
          {/* Only show bar if score is valid */}
          {score >= 0 && (
            <div className="bg-white h-2 rounded-full" style={{ width: `${displayScore}%` }}></div>
          )}
        </div>
        <span className="text-sm text-white w-12">{scoreText}</span>
      </div>
    </div>
  );
}


const RealtimeScore: React.FC<RealtimeScoreProps> = ({ imageData, isTabVisible = true }) => {
  const [scores, setScores] = useState<ScoresState>(null) // Initialize scores to null
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorState, setErrorState] = useState<boolean>(false); // State to track analysis errors
  const analysisControllerRef = useRef<AbortController | null>(null); // Ref to manage abort controller

  useEffect(() => {
    // Abort previous analysis if image data changes or tab visibility changes
    if (analysisControllerRef.current) {
      analysisControllerRef.current.abort();
      analysisControllerRef.current = null;
      setIsAnalyzing(false); // Reset analyzing state
    }

    // Reset error state when image data changes
    setErrorState(false);

    // Only analyze if we have image data and the tab is visible
    if (imageData && isTabVisible) {
      const controller = new AbortController();
      analysisControllerRef.current = controller;
      
      const analyzeImage = async () => {
        setIsAnalyzing(true)
        setScores(null); // Reset scores while analyzing new image
        setErrorState(false); // Reset error state
        
        try {
          // Pass the signal to the analyzeOutfit function if it supports it
          // Assuming analyzeOutfit might eventually support AbortSignal
          // const result = await analyzeOutfit(imageData, { signal: controller.signal }); 
          
          // Use the client-side analyzeOutfit function
          const result = await analyzeOutfit(imageData)

          // Check if the request was aborted before setting state
          if (!controller.signal.aborted) {
            // --- Add Validation for received data ---
            if (
              !result ||
              typeof result !== 'object' ||
              typeof result.comfort !== 'number' ||
              typeof result.fitConfidence !== 'number' ||
              typeof result.colorHarmony !== 'number'
            ) {
              console.error("Invalid analysis result structure:", result);
              throw new Error("Received invalid data structure from analysis.");
            }
            // --- End Validation ---

            setScores({
              comfort: result.comfort,
              fitConfidence: result.fitConfidence,
              colorHarmony: result.colorHarmony,
            })
          } else {
             console.log("Analysis aborted, discarding results.");
          }
        } catch (error: any) {
           // Only set error state if the error wasn't an abort
           if (error.name !== 'AbortError') {
             console.error("Error analyzing image in RealtimeScore:", error)
             setErrorState(true); // Set error state
             setScores(null); // Ensure scores are null on error
           } else {
             console.log("Analysis fetch aborted.");
           }
        } finally {
          // Check if this controller is still the active one before resetting state
          if (analysisControllerRef.current === controller) {
             setIsAnalyzing(false)
             analysisControllerRef.current = null; // Clear the ref once done
          }
        }
      }

      analyzeImage()
    } else {
      // If no image data or tab not visible, reset scores
      setScores(null);
      setIsAnalyzing(false); // Ensure analyzing is false
      setErrorState(false); // Reset error state
    }

    // Cleanup function to abort request on unmount or dependency change
    return () => {
      if (analysisControllerRef.current) {
        analysisControllerRef.current.abort();
        analysisControllerRef.current = null;
      }
    };
  }, [imageData, isTabVisible]) // Rerun effect when imageData or isTabVisible changes

  // No need for the second useEffect handling shouldAnalyze

  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 max-w-xs min-h-[80px]"> {/* Added min-height */}
      {isAnalyzing ? (
        <div className="flex items-center justify-center h-full"> {/* Centering loading */}
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm text-white">Analyzing...</span>
        </div>
      ) : errorState ? (
         <div className="flex items-center justify-center h-full text-red-400 text-sm"> {/* Centering error */}
           Analysis failed
         </div>
      ) : !isTabVisible ? (
         <div className="flex items-center justify-center h-full text-gray-400 text-sm"> {/* Centering paused */}
           Analysis paused
         </div>
      ) : scores ? (
        <>
          <ScoreBar score={scores.comfort} label="Comfort" />
          <ScoreBar score={scores.fitConfidence} label="Fit" />
          <ScoreBar score={scores.colorHarmony} label="Color" />
        </>
      ) : (
         <div className="flex items-center justify-center h-full text-gray-400 text-sm"> {/* Centering initial/no data */}
           Waiting for data...
         </div>
      )}
    </div>
  )
}

export default RealtimeScore
