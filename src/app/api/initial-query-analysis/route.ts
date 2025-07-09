import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // The frontend page.tsx now sends `question`, so we destructure `question` here.
    const { question, chat_id } = body;

    const backendResponse = await fetch(`${BACKEND_URL}/initial-query-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // The backend also expects `question`.
      body: JSON.stringify({ question, chat_id }),
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error("Backend error:", errorBody);
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