import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { alertsDB, CreateAlertRuleData } from '../../../lib/alerts';
import { getUserId } from '../../../lib/auth';

// Validation schemas
const CreateAlertRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  min_score: z.number().min(0).max(1000).optional(),
  max_score: z.number().min(0).max(1000).optional(),
  min_velocity: z.number().min(-1000).max(1000).optional(),
  max_velocity: z.number().min(-1000).max(1000).optional(),
  min_acceleration: z.number().min(-1000).max(1000).optional(),
  max_acceleration: z.number().min(-1000).max(1000).optional(),
  sources: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  notification_frequency: z.enum(['immediate', 'daily', 'hourly']).default('immediate'),
  cooldown_minutes: z.number().min(1).max(1440).default(60),
});

const UpdateAlertRuleSchema = CreateAlertRuleSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const result = await alertsDB.getAlertRules(userId, page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    
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
    
    // Validate request body
    const validatedData = CreateAlertRuleSchema.parse(body);
    
    // Ensure at least one signal threshold is set
    const hasSignalThreshold = 
      validatedData.min_score !== undefined || 
      validatedData.max_score !== undefined ||
      validatedData.min_velocity !== undefined || 
      validatedData.max_velocity !== undefined ||
      validatedData.min_acceleration !== undefined || 
      validatedData.max_acceleration !== undefined;
    
    if (!hasSignalThreshold) {
      return NextResponse.json(
        { error: 'At least one signal threshold must be specified' },
        { status: 400 }
      );
    }
    
    // Validate threshold ranges
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
    
    const createData: CreateAlertRuleData = {
      user_id: userId,
      ...validatedData,
    };
    
    const alertRule = await alertsDB.createAlertRule(createData);
    
    return NextResponse.json(alertRule, { status: 201 });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    
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
