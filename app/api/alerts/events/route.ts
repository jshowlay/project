import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { alertsDB } from '../../../../lib/alerts';
import { getUserId } from '../../../../lib/auth';

// Validation schema for marking events as read
const MarkEventReadSchema = z.object({
  eventId: z.string().uuid(),
});

const MarkAllEventsReadSchema = z.object({
  confirm: z.boolean().refine(val => val === true, {
    message: 'Must confirm to mark all events as read'
  }),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const result = await alertsDB.getAlertEvents(userId, page, limit, unreadOnly);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching alert events:', error);
    
    if (error instanceof Error && error.message.includes('not authenticated')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    // Check if this is a mark as read request
    if (body.action === 'mark_read') {
      const validatedData = MarkEventReadSchema.parse(body);
      
      const success = await alertsDB.markAlertEventRead(validatedData.eventId, userId);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Alert event not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Check if this is a mark all as read request
    if (body.action === 'mark_all_read') {
      const validatedData = MarkAllEventsReadSchema.parse(body);
      
      const count = await alertsDB.markAllAlertEventsRead(userId);
      
      return NextResponse.json({ 
        success: true, 
        markedCount: count 
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing alert events action:', error);
    
    if (error instanceof Error && error.message.includes('not authenticated')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
