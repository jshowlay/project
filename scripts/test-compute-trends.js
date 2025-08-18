#!/usr/bin/env node

/**
 * Test script for the compute-trends cron endpoint
 * Usage: node scripts/test-compute-trends.js [local|production]
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.argv[2] === 'production' 
  ? 'https://your-domain.vercel.app' 
  : 'http://localhost:3000';

const CRON_SECRET = process.env.CRON_SECRET || 'change-me';

async function makeRequest(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 3000),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testCronEndpoint() {
  console.log('🧪 Testing compute-trends cron endpoint...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using CRON_SECRET: ${CRON_SECRET ? 'Set' : 'Not set'}\n`);

  // Test 1: GET request without authentication (should fail)
  console.log('1️⃣ Testing GET without authentication...');
  try {
    const response = await makeRequest('/cron/compute-trends');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  console.log('');

  // Test 2: GET request with query parameter authentication
  console.log('2️⃣ Testing GET with query parameter authentication...');
  try {
    const response = await makeRequest(`/cron/compute-trends?token=${CRON_SECRET}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  console.log('');

  // Test 3: GET request with header authentication
  console.log('3️⃣ Testing GET with header authentication...');
  try {
    const response = await makeRequest('/cron/compute-trends', 'GET', {
      'x-cron-token': CRON_SECRET
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  console.log('');

  // Test 4: POST request to trigger computation
  console.log('4️⃣ Testing POST to trigger computation...');
  try {
    const response = await makeRequest(`/cron/compute-trends?token=${CRON_SECRET}`, 'POST');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  console.log('');

  // Test 5: Test the API route directly
  console.log('5️⃣ Testing API route directly...');
  try {
    const response = await makeRequest(`/api/cron/compute-trends?token=${CRON_SECRET}`, 'POST');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  console.log('');

  console.log('✅ Testing completed!');
}

// Run the tests
testCronEndpoint().catch(console.error);
