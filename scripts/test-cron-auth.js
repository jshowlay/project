#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not configured');
  process.exit(1);
}

async function testCronAuth() {
  console.log('🧪 Testing cron authentication...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Secret: ${CRON_SECRET ? '***' : 'not set'}`);

  try {
    // Test with query parameter
    console.log('\n📝 Testing with query parameter...');
    const queryResponse = await fetch(`${BASE_URL}/api/ingest?secret=${CRON_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Query param status: ${queryResponse.status}`);
    if (queryResponse.ok) {
      const data = await queryResponse.json();
      console.log('✅ Query param auth successful:', data);
    } else {
      const error = await queryResponse.text();
      console.log('❌ Query param auth failed:', error);
    }

    // Test with Bearer token
    console.log('\n🔐 Testing with Bearer token...');
    const bearerResponse = await fetch(`${BASE_URL}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });

    console.log(`Bearer token status: ${bearerResponse.status}`);
    if (bearerResponse.ok) {
      const data = await bearerResponse.json();
      console.log('✅ Bearer token auth successful:', data);
    } else {
      const error = await bearerResponse.text();
      console.log('❌ Bearer token auth failed:', error);
    }

    // Test health check
    console.log('\n🏥 Testing health check...');
    const healthResponse = await fetch(`${BASE_URL}/api/ingest?secret=${CRON_SECRET}`, {
      method: 'GET',
    });

    console.log(`Health check status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✅ Health check successful:', data);
    } else {
      const error = await healthResponse.text();
      console.log('❌ Health check failed:', error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testCronAuth();
