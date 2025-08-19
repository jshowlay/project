#!/usr/bin/env node

import cron from 'node-cron';
import { logger } from '../lib/logger.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const INGEST_SECRET = process.env.INGEST_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!INGEST_SECRET) {
  console.error('❌ INGEST_SECRET not configured');
  process.exit(1);
}

// Function to trigger ingestion
async function triggerIngestion() {
  const startTime = Date.now();
  
  try {
    logger.info('🔄 Triggering scheduled ingestion');
    
    const response = await fetch(`${BASE_URL}/api/ingest?secret=${INGEST_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batch: false,
        batchSize: 100,
      }),
    });

    const result = await response.json();
    const duration = Date.now() - startTime;

    if (response.ok && result.success) {
      logger.info('✅ Scheduled ingestion completed successfully', {
        totalItems: result.data.totalItems,
        sourcesProcessed: result.data.sourcesProcessed,
        duration,
        errors: result.data.errors.length,
      });
    } else {
      logger.error('❌ Scheduled ingestion failed', {
        status: response.status,
        result,
        duration,
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('💥 Scheduled ingestion error', {
      error: errorMessage,
      duration,
    });
  }
}

// Schedule cron job to run every 15 minutes
const cronSchedule = '*/15 * * * *'; // Every 15 minutes

logger.info('🚀 Starting cron job scheduler', {
  schedule: cronSchedule,
  baseUrl: BASE_URL,
  ingestSecret: INGEST_SECRET ? '***' : 'not set',
});

// Schedule the job
cron.schedule(cronSchedule, () => {
  triggerIngestion();
}, {
  scheduled: true,
  timezone: 'UTC',
});

// Also run immediately on startup
logger.info('🔄 Running initial ingestion');
triggerIngestion();

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Keep the process alive
logger.info('⏰ Cron job scheduler is running. Press Ctrl+C to stop.');
