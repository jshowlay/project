import { NextRequest } from 'next/server';
import { getLiveTrends } from '../../../lib/db';
import { generateMockTrendsWithFilters } from '../../../lib/mock';
import { StreamMessage } from '../../../types/trend';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  
  // Parse query parameters
  const query = searchParams.get('q') || '';
  const sources = searchParams.get('sources')?.split(',').filter(Boolean) || [];
  const region = searchParams.get('region') || '';
  const sinceMins = parseInt(searchParams.get('sinceMins') || '60', 10);
  const minScore = parseInt(searchParams.get('minScore') || '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const useMock = searchParams.get('mock') === 'true';

  const filters = {
    query,
    sources,
    region,
    sinceMins,
    minScore,
    limit
  };

  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendMessage = (message: StreamMessage) => {
        const data = `data: ${JSON.stringify(message)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      const sendHeartbeat = () => {
        const heartbeat: StreamMessage = {
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        };
        sendMessage(heartbeat);
      };

      const sendTrends = async () => {
        try {
          let trends;
          
          if (useMock) {
            trends = generateMockTrendsWithFilters(filters);
          } else {
            try {
              trends = await getLiveTrends(filters);
            } catch (error) {
              console.error('Database query failed, using mock data:', error);
              trends = generateMockTrendsWithFilters(filters);
            }
          }

          const message: StreamMessage = {
            type: 'trends',
            data: trends,
            timestamp: new Date().toISOString()
          };
          sendMessage(message);
        } catch (error) {
          console.error('Error fetching trends for stream:', error);
          const errorMessage: StreamMessage = {
            type: 'error',
            message: 'Failed to fetch trends',
            timestamp: new Date().toISOString()
          };
          sendMessage(errorMessage);
        }
      };

      // Send initial data
      await sendTrends();

      // Set up periodic updates
      const interval = setInterval(async () => {
        await sendTrends();
      }, 10000); // Update every 10 seconds

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        sendHeartbeat();
      }, 30000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
