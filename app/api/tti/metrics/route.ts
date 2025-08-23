import { NextRequest, NextResponse } from 'next/server';
import { ttiDb } from '../../../../src/server/tti-db';
import { TTIUtils } from '../../../../src/lib/tti-utils';
import { ServerTTIRecorder } from '../../../../src/lib/tti-recorder';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const recorder = new ServerTTIRecorder({ route: '/api/tti/metrics' });

  try {
    const body = await request.json();
    const { 
      traceId, 
      sessionId, 
      userId, 
      events = [], 
      metrics = [], 
      userContext 
    } = body;

    // Validate required fields
    if (!traceId || !TTIUtils.isValidTraceId(traceId)) {
      return NextResponse.json(
        { error: 'Invalid traceId' },
        { status: 400 }
      );
    }

    if (!sessionId || !TTIUtils.isValidSessionId(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid sessionId' },
        { status: 400 }
      );
    }

    // Check if we should sample this request
    if (!TTIUtils.shouldSample()) {
      recorder.recordApiResponse(Date.now() - startTime, 200);
      return NextResponse.json({ success: true, sampled: true });
    }

    // Create or update session
    if (userContext) {
      const sessionData = {
        traceId,
        sessionId,
        userId,
        ipHash: userContext.ip,
        userAgent: userContext.userAgent,
        referrer: userContext.referrer,
        pageUrl: userContext.pageUrl,
        region: userContext.region,
        deviceType: userContext.deviceType,
        browser: userContext.browser,
        os: userContext.os,
      };

      await ttiDb.createSession(sessionData);
    }

    // Record events
    const eventPromises = events.map(async (event: any) => {
      try {
        await ttiDb.recordEvent({
          sessionId,
          traceId,
          eventType: event.eventType,
          eventName: event.eventName,
          timestamp: new Date(event.timestamp || Date.now()),
          duration: event.duration,
          metadata: event.metadata,
          source: 'client',
          component: event.component,
          route: event.route,
        });
      } catch (error) {
        TTIUtils.error('Failed to record event', error);
      }
    });

    // Record metrics
    const metricPromises = metrics.map(async (metric: any) => {
      try {
        await ttiDb.recordMetric({
          sessionId,
          traceId,
          metricName: metric.metricName,
          metricValue: metric.metricValue,
          unit: metric.unit,
          timestamp: new Date(metric.timestamp || Date.now()),
          metadata: metric.metadata,
          source: 'client',
        });
      } catch (error) {
        TTIUtils.error('Failed to record metric', error);
      }
    });

    // Wait for all recordings to complete
    await Promise.all([...eventPromises, ...metricPromises]);

    const duration = Date.now() - startTime;
    await recorder.recordApiResponse(duration, 200);

    return NextResponse.json({
      success: true,
      recorded: {
        events: events.length,
        metrics: metrics.length,
      },
      traceId,
      sessionId,
    });

  } catch (error) {
    TTIUtils.error('TTI metrics API error', error);
    
    const duration = Date.now() - startTime;
    await recorder.recordApiResponse(duration, 500);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const traceId = searchParams.get('traceId');
  const sessionId = searchParams.get('sessionId');
  const metricNames = searchParams.get('metricNames')?.split(',');

  if (!traceId && !sessionId) {
    return NextResponse.json(
      { error: 'traceId or sessionId is required' },
      { status: 400 }
    );
  }

  try {
    let data;

    if (traceId) {
      data = await ttiDb.getSessionByTraceId(traceId);
    } else if (sessionId) {
      data = await ttiDb.getSessionMetrics(sessionId, metricNames);
    }

    return NextResponse.json({ data });
  } catch (error) {
    TTIUtils.error('Failed to get TTI data', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
