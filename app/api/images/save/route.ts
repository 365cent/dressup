import { NextRequest, NextResponse } from 'next/server';
import { saveImage } from '@/lib/fs-utils';

export async function POST(request: NextRequest) {
  try {
    const { imageData, imageId } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing required imageData' }, 
        { status: 400 }
      );
    }

    const savedImageId = await saveImage(imageData, imageId);
    
    return NextResponse.json({ 
      success: true, 
      imageId: savedImageId 
    });
  } catch (error) {
    console.error('Error in image save API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save image', 
        message: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}
