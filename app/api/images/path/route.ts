import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  // Get the path from the query parameters
  const { searchParams } = new URL(request.url);
  const imagePath = searchParams.get('path');
  
  // If no path provided, return 400
  if (!imagePath) {
    return new NextResponse('Image path not provided', { status: 400 });
  }
  
  // Security check: make sure the path is within our data directory
  const DATA_DIR = path.join(process.cwd(), '.data');
  const normalizedPath = path.normalize(imagePath);
  
  if (!normalizedPath.startsWith(DATA_DIR)) {
    return new NextResponse('Invalid image path', { status: 403 });
  }
  
  // Check if image exists and serve it
  try {
    // Check if file exists
    await fs.promises.access(normalizedPath, fs.constants.F_OK);
    
    // Read the image file
    const imageBuffer = await fs.promises.readFile(normalizedPath);
    
    // Get file extension to determine content type
    const ext = path.extname(normalizedPath).toLowerCase();
    let contentType = 'image/jpeg'; // Default
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error reading image file:', error);
    return new NextResponse('Image not found', { status: 404 });
  }
}
