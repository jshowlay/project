import { NextRequest, NextResponse } from 'next/server';
import { ttiDb } from '../../../../src/server/tti-db';
import { TTIUtils } from '../../../../src/lib/tti-utils';
import { ServerTTIRecorder } from '../../../../src/lib/tti-recorder';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const recorder = new ServerTTIRecorder({ route: '/api/tti/stats' });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const route = searchParams.get('route');
    const days = parseInt(searchParams.get('days') || '7');
    const metricName = searchParams.get('metricName');
    const date = searchParams.get('date');

    let data: any = {};

    switch (type) {
      case 'overview':
        data = await getOverviewStats(days);
        break;
      case 'route_performance':
        if (!route) {
          return NextResponse.json(
            { error: 'route parameter is required for route_performance' },
            { status: 400 }
          );
        }
        data = await getRoutePerformance(route, days);
        break;
      case 'hourly_metrics':
        data = await getHourlyMetrics(date ? new Date(date) : new Date(), metricName || undefined);
        break;
      case 'session_summary':
        data = await getSessionSummary(days);
        break;
      case 'aggregates':
        data = await getAggregates(date ? new Date(date) : new Date(), metricName || undefined);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    const duration = Date.now() - startTime;
    await recorder.recordApiResponse(duration, 200);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    TTIUtils.error('TTI stats API error', error);
    
    const duration = Date.now() - startTime;
    await recorder.recordApiResponse(duration, 500);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOverviewStats(days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get basic metrics
  const metrics = await ttiDb.getAggregates(startDate);
  
  // Calculate summary statistics
  const summary = {
    totalSessions: 0,
    totalEvents: 0,
    totalMetrics: 0,
    avgTTI: 0,
    avgFCP: 0,
    avgLCP: 0,
    avgCLS: 0,
    p95TTI: 0,
    p95FCP: 0,
    p95LCP: 0,
  };

  // Process aggregates
  metrics.forEach((metric: any) => {
    if (metric.metricName === 'tti') {
      summary.avgTTI = metric.avg || 0;
      summary.p95TTI = metric.p95 || 0;
    } else if (metric.metricName === 'fcp') {
      summary.avgFCP = metric.avg || 0;
      summary.p95FCP = metric.p95 || 0;
    } else if (metric.metricName === 'lcp') {
      summary.avgLCP = metric.avg || 0;
      summary.p95LCP = metric.p95 || 0;
    } else if (metric.metricName === 'cls') {
      summary.avgCLS = metric.avg || 0;
    }
  });

  return {
    period: `${days} days`,
    summary,
    metrics,
  };
}

async function getRoutePerformance(route: string, days: number) {
  const performance = await ttiDb.getRoutePerformance(route, days);
  
  const routeStats = {
    route,
    sessionCount: 0,
    avgTTI: 0,
    avgFCP: 0,
    avgLCP: 0,
    avgCLS: 0,
    p95TTI: 0,
    p95FCP: 0,
  };

  performance.forEach((stat: any) => {
    if (stat.metricName === 'tti') {
      routeStats.avgTTI = stat._avg.metricValue || 0;
      routeStats.p95TTI = stat._avg.metricValue * 1.5; // Approximation
    } else if (stat.metricName === 'fcp') {
      routeStats.avgFCP = stat._avg.metricValue || 0;
      routeStats.p95FCP = stat._avg.metricValue * 1.5; // Approximation
    } else if (stat.metricName === 'lcp') {
      routeStats.avgLCP = stat._avg.metricValue || 0;
    } else if (stat.metricName === 'cls') {
      routeStats.avgCLS = stat._avg.metricValue || 0;
    }
  });

  return {
    route,
    period: `${days} days`,
    stats: routeStats,
    rawData: performance,
  };
}

async function getHourlyMetrics(date: Date, metricName?: string) {
  const aggregates = await ttiDb.getAggregates(date, metricName);
  
  // Group by hour
  const hourlyData: Record<number, any> = {};
  
  aggregates.forEach((agg: any) => {
    if (!hourlyData[agg.hour]) {
      hourlyData[agg.hour] = {};
    }
    
    hourlyData[agg.hour][agg.metricName] = {
      count: agg.count,
      avg: agg.avg,
      min: agg.min,
      max: agg.max,
      p50: agg.p50,
      p95: agg.p95,
      p99: agg.p99,
    };
  });

  return {
    date: date.toISOString().split('T')[0],
    metricName,
    hourlyData,
  };
}

async function getSessionSummary(days: number) {
  // This would typically use a database view
  // For now, return a placeholder structure
  return {
    period: `${days} days`,
    totalSessions: 0,
    activeSessions: 0,
    avgSessionDuration: 0,
    topRoutes: [],
    topBrowsers: [],
    topDevices: [],
  };
}

async function getAggregates(date: Date, metricName?: string) {
  return await ttiDb.getAggregates(date, metricName);
}

// Refresh aggregates endpoint
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const recorder = new ServerTTIRecorder({ route: '/api/tti/stats' });

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'refresh_aggregates') {
      await ttiDb.refreshAggregates();
      
      const duration = Date.now() - startTime;
      await recorder.recordApiResponse(duration, 200);

      return NextResponse.json({
        success: true,
        message: 'Aggregates refreshed successfully',
      });
    }

    if (action === 'cleanup_sessions') {
      const count = await ttiDb.cleanupExpiredSessions();
      
      const duration = Date.now() - startTime;
      await recorder.recordApiResponse(duration, 200);

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${count} expired sessions`,
        count,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    TTIUtils.error('TTI stats POST error', error);
    
    const duration = Date.now() - startTime;
    await recorder.recordApiResponse(duration, 500);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
