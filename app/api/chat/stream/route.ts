import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { NextRequest } from 'next/server';

// Configure AWS Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const runtime = 'edge'; // Use edge runtime for streaming

export async function POST(request: NextRequest) {
  try {
    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS credentials not configured');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages, systemPrompt } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare the request payload for Claude
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      system: systemPrompt || 'You are a helpful AI assistant specialized in document analysis and code review.',
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      // Note: Claude 4.x models don't support both temperature and top_p
    };

    // Invoke the model with streaming - Claude Opus 4.6
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: 'us.anthropic.claude-opus-4-6-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);

    // Create a ReadableStream to handle the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!response.body) {
            controller.close();
            return;
          }

          for await (const event of response.body) {
            if (event.chunk?.bytes) {
              // Decode the chunk
              const chunkText = new TextDecoder().decode(event.chunk.bytes);
              const chunkJson = JSON.parse(chunkText);

              // Handle different event types
              if (chunkJson.type === 'content_block_delta') {
                const text = chunkJson.delta?.text || '';
                if (text) {
                  // Send the text chunk to the client
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } else if (chunkJson.type === 'message_stop') {
                // End of stream
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // Return the stream with SSE headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
