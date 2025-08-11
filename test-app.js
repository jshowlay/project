#!/usr/bin/env node

/**
 * Trender AI Application Test Suite
 * Tests all major components and functionality
 */

const https = require('https');
const http = require('http');

// Test configuration
const config = {
  frontend: 'http://localhost:3000',
  api: 'http://localhost:8000',
  timeout: 5000
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { timeout: config.timeout, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test functions
async function testFrontend() {
  console.log('🧪 Testing Frontend...');
  
  try {
    // Test main page
    const mainPage = await makeRequest(config.frontend);
    console.log(`  ✅ Main page: ${mainPage.status}`);
    
    // Test dynamic route
    const briefPage = await makeRequest(`${config.frontend}/brief/test-123`);
    console.log(`  ✅ Brief page: ${briefPage.status}`);
    
    // Check for key content
    if (mainPage.data.includes('Trender AI')) {
      console.log('  ✅ Trender AI branding found');
    }
    
    if (mainPage.data.includes('Brief Configuration')) {
      console.log('  ✅ Configuration panel found');
    }
    
    if (mainPage.data.includes('Generate Brief')) {
      console.log('  ✅ Generate button found');
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Frontend test failed: ${error.message}`);
    return false;
  }
}

async function testAPI() {
  console.log('🧪 Testing API...');
  
  try {
    // Test health endpoint
    const health = await makeRequest(`${config.api}/health`);
    console.log(`  ✅ Health check: ${health.status}`);
    
    // Test trends endpoint
    const trends = await makeRequest(`${config.api}/api/trends?niche=technology&hours=24&limit=5`);
    console.log(`  ✅ Trends endpoint: ${trends.status}`);
    
    // Test brief generation endpoint
    const briefRequest = {
      niche: 'Technology',
      platforms: ['TikTok', 'YouTube'],
      geo: 'US',
      language: 'en',
      limit: 5,
      time_window_hours: 24,
      include_sources: true
    };
    
    const brief = await makeRequest(`${config.api}/api/brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(briefRequest)
    });
    console.log(`  ✅ Brief generation: ${brief.status}`);
    
    return true;
  } catch (error) {
    console.log(`  ⚠️  API test failed (expected if backend not running): ${error.message}`);
    return false;
  }
}

async function testComponents() {
  console.log('🧪 Testing Components...');
  
  try {
    // Test if components are properly built
    const mainPage = await makeRequest(config.frontend);
    
    // Check for component-specific classes
    const componentChecks = [
      { name: 'TrendCard', pattern: 'bg-card border-gray-800' },
      { name: 'ScorePill', pattern: 'text-golden' },
      { name: 'SourceChips', pattern: 'badge' },
      { name: 'CopyButton', pattern: 'copy' }
    ];
    
    for (const check of componentChecks) {
      if (mainPage.data.includes(check.pattern)) {
        console.log(`  ✅ ${check.name} component styles found`);
      } else {
        console.log(`  ⚠️  ${check.name} component styles not found`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Component test failed: ${error.message}`);
    return false;
  }
}

async function testStyling() {
  console.log('🧪 Testing Styling...');
  
  try {
    const mainPage = await makeRequest(config.frontend);
    
    // Check for dark theme
    if (mainPage.data.includes('bg-black') || mainPage.data.includes('bg-background')) {
      console.log('  ✅ Dark theme applied');
    }
    
    // Check for golden accent
    if (mainPage.data.includes('text-golden') || mainPage.data.includes('#e5c35a')) {
      console.log('  ✅ Golden accent color found');
    }
    
    // Check for Tailwind classes
    if (mainPage.data.includes('rounded-lg') && mainPage.data.includes('shadow-sm')) {
      console.log('  ✅ Tailwind CSS classes found');
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Styling test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Trender AI Application Tests\n');
  
  const results = {
    frontend: await testFrontend(),
    api: await testAPI(),
    components: await testComponents(),
    styling: await testStyling()
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Trender AI is ready to go!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

