import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/ingest/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source') || 'youtube';
    const eventType = searchParams.get('eventType') || 'video';

    // Get recent raw events
    const events = await prisma.rawEvent.findMany({
      where: {
        source: source,
        eventType: eventType,
      },
      select: {
        id: true,
        externalId: true,
        eventType: true,
        rawData: true,
        processed: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Get statistics
    const [totalEvents, processedEvents, unprocessedEvents] = await Promise.all([
      prisma.rawEvent.count({
        where: { source: source }
      }),
      prisma.rawEvent.count({
        where: { source: source, processed: true }
      }),
      prisma.rawEvent.count({
        where: { source: source, processed: false }
      }),
    ]);

    // Get cursor information
    const cursors = await prisma.ingestCursor.findMany({
      where: { source: source },
      select: {
        cursorKey: true,
        cursorValue: true,
        lastUpdated: true,
      },
      orderBy: { lastUpdated: 'desc' },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents,
        processedEvents,
        unprocessedEvents,
        cursorCount: cursors.length,
      },
      cursors,
      events: events.map(event => ({
        id: event.id,
        externalId: event.externalId,
        eventType: event.eventType,
        processed: event.processed,
        createdAt: event.createdAt,
        data: {
          title: event.rawData.title,
          channelTitle: event.rawData.author,
          url: event.rawData.url,
          searchTerm: event.rawData.searchTerm,
        },
      })),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
