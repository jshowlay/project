#!/usr/bin/env tsx

import 'dotenv/config';

// Mock Google Trends data for testing
const mockTrendsData = [
  {
    topic: "artificial intelligence",
    score: 85,
    delta24h: 12.5,
    region: "US",
    tags: ["ai", "technology", "trending"],
    url: "https://trends.google.com/trends/explore?q=artificial+intelligence&geo=US",
    observedAt: new Date(),
    source: "google_trends" as const
  },
  {
    topic: "machine learning",
    score: 72,
    delta24h: 8.3,
    region: "US",
    tags: ["ml", "ai", "technology"],
    url: "https://trends.google.com/trends/explore?q=machine+learning&geo=US",
    observedAt: new Date(),
    source: "google_trends" as const
  },
  {
    topic: "chatgpt",
    score: 95,
    delta24h: 15.7,
    region: "US",
    tags: ["ai", "chatbot", "openai"],
    url: "https://trends.google.com/trends/explore?q=chatgpt&geo=US",
    observedAt: new Date(),
    source: "google_trends" as const
  },
  {
    topic: "blockchain",
    score: 45,
    delta24h: -5.2,
    region: "US",
    tags: ["crypto", "technology", "web3"],
    url: "https://trends.google.com/trends/explore?q=blockchain&geo=US",
    observedAt: new Date(),
    source: "google_trends" as const
  },
  {
    topic: "metaverse",
    score: 38,
    delta24h: -12.1,
    region: "US",
    tags: ["vr", "ar", "virtual-reality"],
    url: "https://trends.google.com/trends/explore?q=metaverse&geo=US",
    observedAt: new Date(),
    source: "google_trends" as const
  }
];

// Function to simulate Google Trends API call
async function fetchMockGoogleTrends(query: string, geo: string = 'US') {
  console.log(`🔍 Fetching mock Google Trends data for: "${query}" in ${geo}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find matching trend or create a new one
  const existingTrend = mockTrendsData.find(trend => 
    trend.topic.toLowerCase().includes(query.toLowerCase()) ||
    query.toLowerCase().includes(trend.topic.toLowerCase())
  );
  
  if (existingTrend) {
    return [existingTrend];
  }
  
  // Create a new mock trend
  const newTrend = {
    topic: query,
    score: Math.floor(Math.random() * 100) + 20,
    delta24h: (Math.random() * 40) - 20, // -20 to +20
    region: geo,
    tags: [query.toLowerCase(), 'trending', 'google'],
    url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}&geo=${geo}`,
    observedAt: new Date(),
    source: "google_trends" as const
  };
  
  return [newTrend];
}

// Function to get trending topics
async function getTrendingTopics(geo: string = 'US', limit: number = 10) {
  console.log(`📈 Getting trending topics for ${geo} (limit: ${limit})`);
  
  // Return top trending topics
  return mockTrendsData
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(trend => ({
      ...trend,
      region: geo
    }));
}

// Function to get related queries
async function getRelatedQueries(query: string, geo: string = 'US') {
  console.log(`🔗 Getting related queries for: "${query}" in ${geo}`);
  
  const relatedQueries = [
    `${query} tutorial`,
    `${query} examples`,
    `${query} 2024`,
    `${query} latest`,
    `${query} news`
  ];
  
  return relatedQueries.map(relatedQuery => ({
    topic: relatedQuery,
    score: Math.floor(Math.random() * 80) + 10,
    delta24h: (Math.random() * 30) - 15,
    region: geo,
    tags: [relatedQuery.toLowerCase(), 'related', 'google'],
    url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(relatedQuery)}&geo=${geo}`,
    observedAt: new Date(),
    source: "google_trends" as const
  }));
}

// Main test function
async function testGoogleTrends() {
  console.log('🚀 Testing Google Trends Integration\n');
  
  try {
    // Test 1: Fetch specific query
    console.log('=== Test 1: Fetch Specific Query ===');
    const aiTrends = await fetchMockGoogleTrends('artificial intelligence', 'US');
    console.log('✅ AI Trends:', JSON.stringify(aiTrends, null, 2));
    
    // Test 2: Get trending topics
    console.log('\n=== Test 2: Trending Topics ===');
    const trendingTopics = await getTrendingTopics('US', 5);
    console.log('✅ Trending Topics:', JSON.stringify(trendingTopics, null, 2));
    
    // Test 3: Get related queries
    console.log('\n=== Test 3: Related Queries ===');
    const relatedQueries = await getRelatedQueries('machine learning', 'US');
    console.log('✅ Related Queries:', JSON.stringify(relatedQueries, null, 2));
    
    // Test 4: Test different regions
    console.log('\n=== Test 4: Different Regions ===');
    const ukTrends = await fetchMockGoogleTrends('brexit', 'GB');
    console.log('✅ UK Trends:', JSON.stringify(ukTrends, null, 2));
    
    // Test 5: Performance metrics
    console.log('\n=== Test 5: Performance Summary ===');
    const allTrends = [...aiTrends, ...trendingTopics, ...relatedQueries, ...ukTrends];
    const avgScore = allTrends.reduce((sum, trend) => sum + trend.score, 0) / allTrends.length;
    const avgDelta = allTrends.reduce((sum, trend) => sum + (trend.delta24h || 0), 0) / allTrends.length;
    
    console.log(`📊 Total Trends Fetched: ${allTrends.length}`);
    console.log(`📊 Average Score: ${avgScore.toFixed(2)}`);
    console.log(`📊 Average Delta 24h: ${avgDelta.toFixed(2)}%`);
    console.log(`📊 Regions Covered: ${[...new Set(allTrends.map(t => t.region))].join(', ')}`);
    
    console.log('\n🎉 All Google Trends tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Google Trends:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testGoogleTrends().catch(console.error);
}

export {
  fetchMockGoogleTrends,
  getTrendingTopics,
  getRelatedQueries,
  testGoogleTrends
};

