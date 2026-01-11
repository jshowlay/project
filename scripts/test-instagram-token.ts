#!/usr/bin/env tsx

import 'dotenv/config';

/**
 * Quick test to verify Instagram token is working
 */

async function testInstagramToken() {
  console.log('🧪 Testing Instagram Token...\n');

  const token = process.env.IG_LONG_LIVED_TOKEN;
  const userId = process.env.IG_USER_ID;

  if (!token) {
    console.log('❌ IG_LONG_LIVED_TOKEN not found in environment');
    console.log('   Make sure you updated .env file and restarted the server');
    process.exit(1);
  }

  if (!userId) {
    console.log('❌ IG_USER_ID not found in environment');
    process.exit(1);
  }

  console.log('✅ Token found in environment');
  console.log(`   Token (first 30 chars): ${token.substring(0, 30)}...`);
  console.log(`   User ID: ${userId}`);
  console.log('\n🔄 Testing token with Instagram API...\n');

  try {
    // Test by trying to get user info
    const testUrl = `https://graph.facebook.com/v20.0/${userId}?fields=id,username&access_token=${token}`;
    const response = await fetch(testUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Token test failed:');
      console.log(`   Status: ${response.status}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          console.log(`   Error: ${errorJson.error.message}`);
          console.log(`   Code: ${errorJson.error.code}`);
          
          if (errorJson.error.code === 190) {
            console.log('\n💡 The token is invalid or expired.');
            console.log('   Please check:');
            console.log('   1. Did you update the .env file?');
            console.log('   2. Did you restart the server/process?');
            console.log('   3. Is the token a valid long-lived token?');
          }
        }
      } catch {
        console.log(`   Response: ${errorText.substring(0, 200)}`);
      }
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Token is valid!');
    console.log(`   Instagram User: ${data.username || data.id}`);
    console.log(`   User ID: ${data.id}`);
    console.log('\n🎉 Your token is working! You can now run:');
    console.log('   npm run ingest:instagram');

  } catch (error) {
    console.error('❌ Error testing token:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  testInstagramToken()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default testInstagramToken;
