import { NextRequest, NextResponse } from "next/server";
import { saveFeedbackData, getFeedbackData, clearFeedbackData, removeFeedback } from "@/lib/fs-utils";

export async function GET(request: NextRequest) {
  try {
    const feedbackData = await getFeedbackData();
    return NextResponse.json(feedbackData);
  } catch (error) {
    console.error("Error getting feedback data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get feedback data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { imageId, analysisId, feedback } = data;
    
    if (!imageId || !analysisId || !feedback) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    await saveFeedbackData(imageId, analysisId, {
      feedback,
      timestamp: Date.now()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing analysis ID" },
        { status: 400 }
      );
    }
    
    // Call the function to remove feedback for a specific analysis
    // Note: Need to implement this function in fs-utils.ts
    await removeFeedback(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
