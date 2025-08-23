#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runTTIMigration() {
  console.log('🚀 Starting TTI database migration...');

  try {
    // Step 1: Generate Prisma client with new TTI models
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Step 2: Run database migration
    console.log('🗄️ Running database migration...');
    execSync('npx prisma migrate dev --name add-tti-tables', { stdio: 'inherit' });

    // Step 3: Create SQL views
    console.log('👁️ Creating TTI views...');
    const viewsPath = join(process.cwd(), 'sql', 'tti_views.sql');
    const viewsSQL = readFileSync(viewsPath, 'utf-8');
    
    // Split SQL into individual statements
    const statements = viewsSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log('✅ Executed SQL statement');
        } catch (error) {
          console.log('⚠️ SQL statement failed (may already exist):', error);
        }
      }
    }

    // Step 4: Verify tables exist
    console.log('🔍 Verifying TTI tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'tti_%'
      ORDER BY table_name;
    `;

    console.log('📋 Found TTI tables:', tables);

    // Step 5: Create indexes for better performance
    console.log('⚡ Creating performance indexes...');
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_metric_timestamp_source 
        ON tti_metric (timestamp, source);
      `;

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_event_timestamp_source 
        ON tti_event (timestamp, source);
      `;

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_tti_session_created_at 
        ON tti_session (created_at);
      `;

      console.log('✅ Performance indexes created');
    } catch (error) {
      console.log('⚠️ Index creation failed (may already exist):', error);
    }

    // Step 6: Insert sample data for testing
    console.log('🧪 Inserting sample data...');
    try {
      const sampleSession = await prisma.tTISession.create({
        data: {
          traceId: 'sample-trace-id-123',
          sessionId: 'sample-session-id-123',
          pageUrl: 'http://localhost:3000/sample',
          userAgent: 'Mozilla/5.0 (Sample Browser)',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
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

    // Step 7: Test the refresh function
    console.log('🔄 Testing aggregate refresh function...');
    try {
      await prisma.$executeRaw`SELECT refresh_tti_aggregates();`;
      console.log('✅ Aggregate refresh function works');
    } catch (error) {
      console.log('⚠️ Aggregate refresh function failed:', error);
    }

    console.log('🎉 TTI migration completed successfully!');
    console.log('');
    console.log('📊 Next steps:');
    console.log('1. Start your application');
    console.log('2. Visit http://localhost:3000/api/tti/stats?type=overview');
    console.log('3. Check the TTI dashboard for metrics');
    console.log('4. Monitor the logs for TTI events');

  } catch (error) {
    console.error('❌ TTI migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runTTIMigration();
}

export { runTTIMigration };
