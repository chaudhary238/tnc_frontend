import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const backendResponse = await fetch(`${BACKEND_URL}/history/chats/${chatId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error("Backend error getting chat session:", errorBody);
      return new NextResponse(
        JSON.stringify({ message: `An error occurred on the backend: ${backendResponse.statusText}` }),
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error: unknown) {
    console.error("API route error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(
      JSON.stringify({ message: 'An internal server error occurred.', details: errorMessage }),
      { status: 500 }
    );
  }
} 