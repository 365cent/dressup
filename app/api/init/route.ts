import { NextRequest, NextResponse } from 'next/server';
import { initDataDirectories } from '@/lib/fs-utils';

export async function POST(request: NextRequest) {
  try {
    const result = await initDataDirectories();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error initializing data directories from API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}
