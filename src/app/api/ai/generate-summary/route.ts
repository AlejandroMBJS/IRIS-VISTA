import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SummaryItem {
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
}

interface SummaryRequest {
  items: SummaryItem[];
  justification: string;
  language: string;
  question?: string;
  previousSummary?: string;
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8087';

    // If not streaming, just proxy to the backend
    if (!body.stream) {
      const response = await fetch(`${backendUrl}/api/ai/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: body.items,
          justification: body.justification,
          language: body.language,
          question: body.question,
          previousSummary: body.previousSummary,
        }),
      });

      const data = await response.json();
      return NextResponse.json(data);
    }

    // For streaming, proxy the SSE stream from the backend
    const response = await fetch(`${backendUrl}/api/ai/generate-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: body.items,
        justification: body.justification,
        language: body.language,
        question: body.question,
        previousSummary: body.previousSummary,
        stream: true,
      }),
    });

    if (!response.ok) {
      // If streaming backend fails, fallback to non-streaming
      const fallbackResponse = await fetch(`${backendUrl}/api/ai/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: body.items,
          justification: body.justification,
          language: body.language,
          question: body.question,
          previousSummary: body.previousSummary,
          stream: false,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error('Backend request failed');
      }

      const data = await fallbackResponse.json();
      const summary = data.data?.summary || data.summary || '';
      const encoder = new TextEncoder();

      // Create simulated stream
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode('data: [THINKING]\n\n'));
          await new Promise(resolve => setTimeout(resolve, 500));
          controller.enqueue(encoder.encode('data: [RESPONDING]\n\n'));

          const chunkSize = 3;
          for (let i = 0; i < summary.length; i += chunkSize) {
            const chunk = summary.slice(i, i + chunkSize);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
            );
            await new Promise(resolve => setTimeout(resolve, 15));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Proxy the SSE stream directly from the backend
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
