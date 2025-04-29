import { NextRequest, NextResponse } from 'next/server';
import { MCPOperation, executeMCPOperation } from '@/lib/mcp-protocol';

export async function POST(request: NextRequest) {
  try {
    // Ensure FS utils are loaded on the server when the API route is hit
    // This might be redundant if they load on module import, but safer.
    // await import('@/lib/fs-utils'); // Consider if needed

    const operation = await request.json() as MCPOperation;

    if (!operation || !operation.type) {
      return NextResponse.json(
        { error: 'Invalid MCP operation' },
        { status: 400 }
      );
    }

    // Execute the operation (server-side implementation)
    const result = await executeMCPOperation(operation);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in MCP API route for operation ${(await request.clone().json().catch(()=>({type:'unknown'}))).type}:`, error);
    // Return a generic error message to the client
    return NextResponse.json(
      {
        error: 'MCP operation failed on server',
        // Optionally include non-sensitive error details in development
        // message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
