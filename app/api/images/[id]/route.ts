import { NextResponse } from 'next/server';
import { getImage } from '@/lib/fs-utils'; // Import the refactored function

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Await the params before accessing properties
  const resolvedParams = await params;
  const imageId = resolvedParams.id;

  if (!imageId) {
    return new NextResponse('Image ID not provided', { status: 400 });
  }

  try {
    // Use the getImage function which handles path joining and reading
    const imageBuffer = await getImage(imageId);

    // Assume JPEG for now, could add logic to check file extension if needed
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error: any) {
    console.error(`Error serving image ${imageId}:`, error);
    // Check if it's the specific "Image not found" error from fs-utils
    if (error.message?.includes('Image not found')) {
       return new NextResponse('Image not found', { status: 404 });
    }
    // Generic server error for other issues
    return new NextResponse('Error serving image', { status: 500 });
  }
}
