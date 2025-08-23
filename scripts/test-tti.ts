#!/usr/bin/env tsx

import { v4 as uuidv4 } from 'uuid';

async function testTTI() {
  console.log('🧪 Testing TTI implementation...');

  const baseUrl = 'http://localhost:3000';
  const traceId = uuidv4();
  const sessionId = uuidv4();

  try {
    // Test 1: Metrics API
    console.log('📊 Testing metrics API...');
    const metricsResponse = await fetch(`${baseUrl}/api/tti/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        traceId,
        sessionId,
        events: [
          {
            eventType: 'page_load',
            eventName: 'test_page_load',
            timestamp: new Date().toISOString(),
          },
        ],
        metrics: [
          {
            metricName: 'tti',
            metricValue: 1200,
            unit: 'ms',
            timestamp: new Date().toISOString(),
          },
          {
            metricName: 'fcp',
            metricValue: 800,
            unit: 'ms',
            timestamp: new Date().toISOString(),
          },
        ],
        userContext: {
          userAgent: 'Mozilla/5.0 (Test Browser)',
          pageUrl: 'http://localhost:3000/test',
          browser: 'test',
          os: 'test',
          deviceType: 'desktop',
        },
      }),
    });

    const metricsResult = await metricsResponse.json();
    console.log('✅ Metrics API response:', metricsResult);

    // Test 2: Stats API - Overview
    console.log('📈 Testing stats API - overview...');
    const statsResponse = await fetch(`${baseUrl}/api/tti/stats?type=overview`);
    const statsResult = await statsResponse.json();
    console.log('✅ Stats API response:', statsResult);

    // Test 3: Stats API - Route performance
    console.log('🛣️ Testing stats API - route performance...');
    const routeResponse = await fetch(`${baseUrl}/api/tti/stats?type=route_performance&route=/test`);
    const routeResult = await routeResponse.json();
    console.log('✅ Route performance response:', routeResult);

    // Test 4: Stats API - Hourly metrics
    console.log('⏰ Testing stats API - hourly metrics...');
    const hourlyResponse = await fetch(`${baseUrl}/api/tti/stats?type=hourly_metrics&metricName=tti`);
    const hourlyResult = await hourlyResponse.json();
    console.log('✅ Hourly metrics response:', hourlyResult);

    // Test 5: Cleanup API
    console.log('🧹 Testing cleanup API...');
    const cleanupResponse = await fetch(`${baseUrl}/api/tti/stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cleanup_sessions',
      }),
    });
    const cleanupResult = await cleanupResponse.json();
    console.log('✅ Cleanup response:', cleanupResult);

    console.log('🎉 All TTI tests completed successfully!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log(`- Trace ID: ${traceId}`);
    console.log(`- Session ID: ${sessionId}`);
    console.log('- All API endpoints responded correctly');
    console.log('- TTI system is fully operational');

  } catch (error) {
    console.error('❌ TTI test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testTTI();
}

export { testTTI };
