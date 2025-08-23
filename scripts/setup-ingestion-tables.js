require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupIngestionTables() {
  const client = await pool.connect();
  try {
    console.log('Setting up ingestion tables...');

    // Create IngestCursor table
    console.log('Creating IngestCursor table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "IngestCursor" (
        "id" TEXT NOT NULL,
        "source" VARCHAR(50) NOT NULL,
        "cursorKey" VARCHAR(100) NOT NULL,
        "cursorValue" TEXT NOT NULL,
        "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "metadata" JSONB,
        CONSTRAINT "IngestCursor_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "IngestCursor_source_cursorKey_key" UNIQUE ("source", "cursorKey")
      );
    `);

    // Create RawEvent table
    console.log('Creating RawEvent table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "RawEvent" (
        "id" TEXT NOT NULL,
        "source" VARCHAR(50) NOT NULL,
        "externalId" VARCHAR(255) NOT NULL,
        "eventType" VARCHAR(50) NOT NULL,
        "rawData" JSONB NOT NULL,
        "processed" BOOLEAN NOT NULL DEFAULT false,
        "processedAt" TIMESTAMP(3),
        "errorCount" INTEGER NOT NULL DEFAULT 0,
        "lastError" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RawEvent_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "RawEvent_source_externalId_key" UNIQUE ("source", "externalId")
      );
    `);

    // Create IngestDeadLetter table
    console.log('Creating IngestDeadLetter table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "IngestDeadLetter" (
        "id" TEXT NOT NULL,
        "source" VARCHAR(50) NOT NULL,
        "eventType" VARCHAR(50) NOT NULL,
        "errorType" VARCHAR(50) NOT NULL,
        "errorMessage" TEXT NOT NULL,
        "rawData" JSONB,
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "maxRetries" INTEGER NOT NULL DEFAULT 3,
        "nextRetryAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "IngestDeadLetter_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IngestCursor_source_idx" ON "IngestCursor"("source");
      CREATE INDEX IF NOT EXISTS "IngestCursor_lastUpdated_idx" ON "IngestCursor"("lastUpdated");
      CREATE INDEX IF NOT EXISTS "IngestCursor_expiresAt_idx" ON "IngestCursor"("expiresAt");
      
      CREATE INDEX IF NOT EXISTS "RawEvent_source_idx" ON "RawEvent"("source");
      CREATE INDEX IF NOT EXISTS "RawEvent_eventType_idx" ON "RawEvent"("eventType");
      CREATE INDEX IF NOT EXISTS "RawEvent_processed_idx" ON "RawEvent"("processed");
      CREATE INDEX IF NOT EXISTS "RawEvent_createdAt_idx" ON "RawEvent"("createdAt");
      CREATE INDEX IF NOT EXISTS "RawEvent_updatedAt_idx" ON "RawEvent"("updatedAt");
      
      CREATE INDEX IF NOT EXISTS "IngestDeadLetter_source_idx" ON "IngestDeadLetter"("source");
      CREATE INDEX IF NOT EXISTS "IngestDeadLetter_eventType_idx" ON "IngestDeadLetter"("eventType");
      CREATE INDEX IF NOT EXISTS "IngestDeadLetter_errorType_idx" ON "IngestDeadLetter"("errorType");
      CREATE INDEX IF NOT EXISTS "IngestDeadLetter_nextRetryAt_idx" ON "IngestDeadLetter"("nextRetryAt");
      CREATE INDEX IF NOT EXISTS "IngestDeadLetter_createdAt_idx" ON "IngestDeadLetter"("createdAt");
      CREATE INDEX IF NOT EXISTS "IngestDeadLetter_expiresAt_idx" ON "IngestDeadLetter"("expiresAt");
    `);

    console.log('✅ Ingestion tables created successfully!');

    // Test the tables
    console.log('Testing table access...');
    const cursorCount = await client.query('SELECT COUNT(*) FROM "IngestCursor"');
    const eventCount = await client.query('SELECT COUNT(*) FROM "RawEvent"');
    const deadLetterCount = await client.query('SELECT COUNT(*) FROM "IngestDeadLetter"');

    console.log('Table counts:');
    console.log(`- IngestCursor: ${cursorCount.rows[0].count}`);
    console.log(`- RawEvent: ${eventCount.rows[0].count}`);
    console.log(`- IngestDeadLetter: ${deadLetterCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error setting up ingestion tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await setupIngestionTables();
    console.log('🎉 Ingestion tables setup completed successfully!');
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
