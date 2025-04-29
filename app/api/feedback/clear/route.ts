import { NextRequest, NextResponse } from "next/server";
import { clearFeedbackData } from "@/lib/fs-utils";

export async function POST(request: NextRequest) {
  try {
    const success = await clearFeedbackData();
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Error clearing feedback data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear feedback data" },
      { status: 500 }
    );
  }
}
