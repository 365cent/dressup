import { NextRequest, NextResponse } from "next/server";
import { getStyleSuggestions as serverGetStyleSuggestions } from "@/lib/ml-service";

export async function POST(request: NextRequest) {
  try {
    const { imageData, occasion } = await request.json();
    
    if (!imageData || !occasion) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Only get suggestions from API service with no fallbacks
    const suggestions = await serverGetStyleSuggestions(imageData, occasion);
    
    // Ensure we have valid suggestions from the API
    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json(
        { error: "No suggestions available from the service" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error("Error getting style suggestions:", error);
    
    // Return proper error without fallback suggestions
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get suggestions from API"
      },
      { status: 500 }
    );
  }
}
