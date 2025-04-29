import { NextRequest, NextResponse } from 'next/server';
import { saveAnalysisData } from '@/lib/fs-utils';

export async function POST(request: NextRequest) {
  try {
    const { imageId, analysisType, data } = await request.json();
    
    if (!imageId || !analysisType || !data) {
      return NextResponse.json(
        { error: 'Missing required fields (imageId, analysisType, data)' }, 
        { status: 400 }
      );
    }

    await saveAnalysisData(imageId, analysisType, data);
    
    return NextResponse.json({ 
      success: true
    });
  } catch (error) {
    console.error('Error in analysis save API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save analysis data', 
        message: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}
