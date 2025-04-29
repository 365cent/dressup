import { NextRequest, NextResponse } from 'next/server';
import { analyzeOutfitDetails as serverAnalyzeOutfitDetails } from "@/lib/clothing-analysis-service";

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }
    
    try {
      // Call the server-side implementation
      const result = await serverAnalyzeOutfitDetails(imageData);
      return NextResponse.json({ success: true, result });
    } catch (error) {
      console.error("Error analyzing outfit details:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
