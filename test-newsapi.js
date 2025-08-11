const { newsapiAdapter } = require('./src/integrations/newsapi');

async function testNewsAPI() {
  try {
    console.log('Testing NewsAPI adapter...');
    const results = await newsapiAdapter.fetchTrends();
    console.log('✅ NewsAPI adapter returned', results.length, 'items');
    
    if (results.length > 0) {
      console.log('Sample item:', results[0]);
    }
  } catch (error) {
    console.error('❌ NewsAPI adapter failed:', error);
  }
}

testNewsAPI();
