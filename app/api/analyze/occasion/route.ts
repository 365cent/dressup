import { NextRequest, NextResponse } from "next/server";
import { matchOutfitToOccasion as serverMatchOutfitToOccasion } from "@/lib/ml-service";
import { recordAnalysisResult, recordAnalysisError } from "@/lib/mcp-protocol";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { imageData, occasion } = data;
    
    if (!imageData || !occasion) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    try {
      // Call the server-side implementation
      const score = await serverMatchOutfitToOccasion(imageData, occasion);
      
      // Record the successful analysis on server (MCP recording is already inside serverMatchOutfitToOccasion)
      // await recordAnalysisResult(imageData, "occasion", { occasion, score }, { startTime }); // Redundant
      
      return NextResponse.json({ success: true, score });
    } catch (error) {
      // Record the error on server (MCP recording is already inside serverMatchOutfitToOccasion)
      // await recordAnalysisError( // Redundant
      //   imageData, 
      //   "occasion", 
      //   error instanceof Error ? error : new Error(String(error)), 
      //   { startTime, occasion }
      // );
      
      console.error("Error matching outfit to occasion in API route:", error);
      // Remove fallback score generation
      // const fallbackScore = 70 + Math.floor(Math.random() * 20); // Removed
      
      // Return error without fallback score
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
          // fallback: true, // Removed
          // score: fallbackScore // Removed
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, error: "Server error processing request" }, // More generic error
      { status: 500 }
    );
  }
}
