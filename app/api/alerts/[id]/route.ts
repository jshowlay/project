import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { alertsDB, UpdateAlertRuleData } from '../../../../lib/alerts';
import { getUserId } from '../../../../lib/auth';

// Validation schema for updates
const UpdateAlertRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  min_score: z.number().min(0).max(1000).optional(),
  max_score: z.number().min(0).max(1000).optional(),
  min_velocity: z.number().min(-1000).max(1000).optional(),
  max_velocity: z.number().min(-1000).max(1000).optional(),
  min_acceleration: z.number().min(-1000).max(1000).optional(),
  max_acceleration: z.number().min(-1000).max(1000).optional(),
  sources: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  notification_frequency: z.enum(['immediate', 'daily', 'hourly']).optional(),
  cooldown_minutes: z.number().min(1).max(1440).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request);
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Alert rule ID is required' },
        { status: 400 }
      );
    }
    
    const alertRule = await alertsDB.getAlertRule(id, userId);
    
    if (!alertRule) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alertRule);
  } catch (error) {
    console.error('Error fetching alert rule:', error);
    
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request);
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Alert rule ID is required' },
        { status: 400 }
      );
    }
    
    // Validate request body
    const validatedData = UpdateAlertRuleSchema.parse(body);
    
    // Validate threshold ranges if both min and max are provided
    if (validatedData.min_score !== undefined && validatedData.max_score !== undefined) {
      if (validatedData.min_score > validatedData.max_score) {
        return NextResponse.json(
          { error: 'min_score cannot be greater than max_score' },
          { status: 400 }
        );
      }
    }
    
    if (validatedData.min_velocity !== undefined && validatedData.max_velocity !== undefined) {
      if (validatedData.min_velocity > validatedData.max_velocity) {
        return NextResponse.json(
          { error: 'min_velocity cannot be greater than max_velocity' },
          { status: 400 }
        );
      }
    }
    
    if (validatedData.min_acceleration !== undefined && validatedData.max_acceleration !== undefined) {
      if (validatedData.min_acceleration > validatedData.max_acceleration) {
        return NextResponse.json(
          { error: 'min_acceleration cannot be greater than max_acceleration' },
          { status: 400 }
        );
      }
    }
    
    const updateData: UpdateAlertRuleData = validatedData;
    
    const alertRule = await alertsDB.updateAlertRule(id, userId, updateData);
    
    if (!alertRule) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alertRule);
  } catch (error) {
    console.error('Error updating alert rule:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request);
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Alert rule ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = await alertsDB.deleteAlertRule(id, userId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    
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
