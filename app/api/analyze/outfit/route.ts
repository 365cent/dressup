import { NextRequest, NextResponse } from "next/server";
import { analyzeOutfit as serverAnalyzeOutfit } from "@/lib/ml-service";
import { recordAnalysisResult, recordAnalysisError } from "@/lib/mcp-protocol";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { imageData } = data;
    
    if (!imageData) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    try {
      // Call the server-side implementation
      const result = await serverAnalyzeOutfit(imageData);
      
      // Record the successful analysis on server (MCP recording is already inside serverAnalyzeOutfit)
      // await recordAnalysisResult(imageData, "outfit", result, { startTime }); // Redundant if already in serverAnalyzeOutfit
      
      return NextResponse.json({ success: true, result });
    } catch (error) {
      // Record the error on server (MCP recording is already inside serverAnalyzeOutfit)
      // await recordAnalysisError( // Redundant if already in serverAnalyzeOutfit
      //   imageData, 
      //   "outfit", 
      //   error instanceof Error ? error : new Error(String(error)), 
      //   { startTime }
      // );
      
      console.error("Error analyzing outfit in API route:", error);
      // Return error without fallback data
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, error: "Server error processing request" }, // More generic error for outer catch
      { status: 500 }
    );
  }
}
