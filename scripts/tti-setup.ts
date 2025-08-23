#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function setupTTI() {
  console.log('🚀 Setting up TTI system...');

  try {
    // Step 1: Check if TTI tables exist
    console.log('🔍 Checking TTI tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'tti_%'
      ORDER BY table_name;
    `;

    console.log('📋 Found tables:', tables);

    // Step 2: Create TTI tables if they don't exist
    if (!tables || (tables as any[]).length === 0) {
      console.log('📦 Creating TTI tables...');
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TTISession" (
          "id" TEXT NOT NULL,
          "traceId" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "userId" TEXT,
          "ipHash" TEXT,
          "userAgent" TEXT,
          "referrer" TEXT,
          "pageUrl" TEXT NOT NULL,
          "region" TEXT,
          "deviceType" TEXT,
          "browser" TEXT,
          "os" TEXT,
          "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(6) NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          CONSTRAINT "TTISession_pkey" PRIMARY KEY ("id")
        );
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TTIEvent" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "traceId" TEXT NOT NULL,
          "eventType" TEXT NOT NULL,
          "eventName" TEXT NOT NULL,
          "timestamp" TIMESTAMP(6) NOT NULL,
          "duration" INTEGER,
          "metadata" JSONB,
          "source" TEXT NOT NULL,
          "component" TEXT,
          "route" TEXT,
          CONSTRAINT "TTIEvent_pkey" PRIMARY KEY ("id")
        );
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TTIMetric" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "traceId" TEXT NOT NULL,
          "metricName" TEXT NOT NULL,
          "metricValue" DOUBLE PRECISION NOT NULL,
          "unit" TEXT,
          "timestamp" TIMESTAMP(6) NOT NULL,
          "metadata" JSONB,
          "source" TEXT NOT NULL,
          CONSTRAINT "TTIMetric_pkey" PRIMARY KEY ("id")
        );
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TTIAggregate" (
          "id" TEXT NOT NULL,
          "date" DATE NOT NULL,
          "hour" INTEGER NOT NULL,
          "metricName" TEXT NOT NULL,
          "source" TEXT NOT NULL,
          "route" TEXT,
          "count" INTEGER NOT NULL DEFAULT 0,
          "sum" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "min" DOUBLE PRECISION,
          "max" DOUBLE PRECISION,
          "avg" DOUBLE PRECISION,
          "p50" DOUBLE PRECISION,
          "p95" DOUBLE PRECISION,
          "p99" DOUBLE PRECISION,
          "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(6) NOT NULL,
          CONSTRAINT "TTIAggregate_pkey" PRIMARY KEY ("id")
        );
      `;

      console.log('✅ TTI tables created');
    } else {
      console.log('✅ TTI tables already exist');
    }

    // Step 3: Create indexes
    console.log('⚡ Creating indexes...');
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_session_trace_id ON "TTISession" ("traceId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_session_session_id ON "TTISession" ("sessionId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_session_created_at ON "TTISession" ("createdAt");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_event_session_id ON "TTIEvent" ("sessionId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_event_trace_id ON "TTIEvent" ("traceId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_event_timestamp ON "TTIEvent" ("timestamp");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_metric_session_id ON "TTIMetric" ("sessionId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_metric_trace_id ON "TTIMetric" ("traceId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_metric_timestamp ON "TTIMetric" ("timestamp");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_aggregate_date ON "TTIAggregate" ("date");
      `;
      
      console.log('✅ Indexes created');
    } catch (error) {
      console.log('⚠️ Index creation failed (may already exist):', error);
    }

    // Step 4: Create unique constraints
    console.log('🔒 Creating unique constraints...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "TTISession" ADD CONSTRAINT IF NOT EXISTS "TTISession_traceId_key" UNIQUE ("traceId");
      `;
      await prisma.$executeRaw`
        ALTER TABLE "TTIAggregate" ADD CONSTRAINT IF NOT EXISTS "TTIAggregate_unique" UNIQUE ("date", "hour", "metricName", "source", "route");
      `;
      console.log('✅ Unique constraints created');
    } catch (error) {
      console.log('⚠️ Unique constraint creation failed (may already exist):', error);
    }

    // Step 5: Create views
    console.log('👁️ Creating TTI views...');
    try {
      await prisma.$executeRaw`
        CREATE OR REPLACE VIEW tti_hourly_metrics AS
        SELECT 
          DATE(timestamp) as date,
          EXTRACT(hour FROM timestamp) as hour,
          "metricName" as metric_name,
          source,
          route,
          COUNT(*) as count,
          SUM("metricValue") as sum,
          MIN("metricValue") as min,
          MAX("metricValue") as max,
          AVG("metricValue") as avg,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "metricValue") as p50,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "metricValue") as p95,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "metricValue") as p99
        FROM "TTIMetric"
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(timestamp), EXTRACT(hour FROM timestamp), "metricName", source, route;
      `;

      await prisma.$executeRaw`
        CREATE OR REPLACE VIEW tti_daily_metrics AS
        SELECT 
          DATE(timestamp) as date,
          "metricName" as metric_name,
          source,
          route,
          COUNT(*) as count,
          SUM("metricValue") as sum,
          MIN("metricValue") as min,
          MAX("metricValue") as max,
          AVG("metricValue") as avg,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "metricValue") as p50,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "metricValue") as p95,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "metricValue") as p99
        FROM "TTIMetric"
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp), "metricName", source, route;
      `;

      console.log('✅ Views created');
    } catch (error) {
      console.log('⚠️ View creation failed (may already exist):', error);
    }

    // Step 6: Create refresh function
    console.log('🔄 Creating refresh function...');
    try {
      await prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION refresh_tti_aggregates()
        RETURNS void AS $$
        BEGIN
          DELETE FROM "TTIAggregate" 
          WHERE date < CURRENT_DATE - INTERVAL '30 days';
          
          INSERT INTO "TTIAggregate" (id, date, hour, "metricName", source, route, count, sum, min, max, avg, p50, p95, p99)
          SELECT 
            gen_random_uuid()::text,
            date,
            hour,
            metric_name,
            source,
            route,
            count,
            sum,
            min,
            max,
            avg,
            p50,
            p95,
            p99
          FROM tti_hourly_metrics
          ON CONFLICT (date, hour, "metricName", source, route) 
          DO UPDATE SET
            count = EXCLUDED.count,
            sum = EXCLUDED.sum,
            min = EXCLUDED.min,
            max = EXCLUDED.max,
            avg = EXCLUDED.avg,
            p50 = EXCLUDED.p50,
            p95 = EXCLUDED.p95,
            p99 = EXCLUDED.p99,
            "updatedAt" = NOW();
        END;
        $$ LANGUAGE plpgsql;
      `;
      console.log('✅ Refresh function created');
    } catch (error) {
      console.log('⚠️ Function creation failed (may already exist):', error);
    }

    // Step 7: Insert sample data
    console.log('🧪 Inserting sample data...');
    try {
      const sampleSession = await prisma.tTISession.create({
        data: {
          traceId: 'sample-trace-id-123',
          sessionId: 'sample-session-id-123',
          pageUrl: 'http://localhost:3000/sample',
          userAgent: 'Mozilla/5.0 (Sample Browser)',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await prisma.tTIMetric.create({
        data: {
          sessionId: sampleSession.id,
          traceId: sampleSession.traceId,
          metricName: 'tti',
          metricValue: 1500,
          unit: 'ms',
          timestamp: new Date(),
          source: 'client',
        },
      });

      await prisma.tTIEvent.create({
        data: {
          sessionId: sampleSession.id,
          traceId: sampleSession.traceId,
          eventType: 'page_load',
          eventName: 'sample_page_load',
          timestamp: new Date(),
          source: 'client',
        },
      });

      console.log('✅ Sample data inserted');
    } catch (error) {
      console.log('⚠️ Sample data insertion failed (may already exist):', error);
    }

    console.log('🎉 TTI setup completed successfully!');
    console.log('');
    console.log('📊 Next steps:');
    console.log('1. Start your application');
    console.log('2. Visit http://localhost:3000/api/tti/stats?type=overview');
    console.log('3. Check the TTI dashboard for metrics');

  } catch (error) {
    console.error('❌ TTI setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupTTI();
}

export { setupTTI };
