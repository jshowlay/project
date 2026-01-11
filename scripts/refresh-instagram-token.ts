#!/usr/bin/env tsx

import 'dotenv/config';

/**
 * Instagram Token Refresh Script
 * 
 * This script helps refresh your Instagram long-lived access token.
 * Instagram tokens expire after 60 days, so you need to refresh them periodically.
 */

async function refreshInstagramToken() {
  console.log('🔄 Instagram Token Refresh Tool\n');

  const appId = process.env.IG_APP_ID;
  const appSecret = process.env.IG_APP_SECRET;
  const currentToken = process.env.IG_LONG_LIVED_TOKEN;

  if (!appId || !appSecret || !currentToken) {
    console.log('❌ Missing required environment variables:');
    console.log('   - IG_APP_ID:', appId ? '✅' : '❌');
    console.log('   - IG_APP_SECRET:', appSecret ? '✅' : '❌');
    console.log('   - IG_LONG_LIVED_TOKEN:', currentToken ? '✅' : '❌');
    console.log('\nPlease add these to your .env file.');
    process.exit(1);
  }

  console.log('✅ Configuration found');
  console.log(`   App ID: ${appId}`);
  console.log(`   Current token: ${currentToken.substring(0, 20)}...`);
  console.log('\n🔄 Attempting to refresh token...\n');

  try {
    const url = new URL('https://graph.facebook.com/v20.0/oauth/access_token');
    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('client_secret', appSecret);
    url.searchParams.set('fb_exchange_token', currentToken);

    console.log('📡 Calling Facebook Graph API...');
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Token refresh failed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          console.log('\n💡 Troubleshooting:');
          if (errorJson.error.code === 190) {
            console.log('   - Your token has expired and cannot be refreshed');
            console.log('   - You need to generate a new token from scratch');
            console.log('   - See README_INSTAGRAM.md for instructions');
          } else if (errorJson.error.code === 100) {
            console.log('   - Invalid app ID or app secret');
            console.log('   - Check your IG_APP_ID and IG_APP_SECRET in .env');
          }
        }
      } catch {
        // Error text is not JSON, already printed
      }
      
      process.exit(1);
    }

    const data = await response.json();
    
    if (data.access_token) {
      console.log('✅ Token refreshed successfully!\n');
      console.log('📋 New Token Information:');
      console.log(`   Access Token: ${data.access_token.substring(0, 30)}...`);
      console.log(`   Token Type: ${data.token_type || 'Bearer'}`);
      console.log(`   Expires In: ${data.expires_in ? `${Math.floor(data.expires_in / 86400)} days` : 'Unknown'}`);
      
      console.log('\n📝 Next Steps:');
      console.log('   1. Update your .env file with the new token:');
      console.log(`      IG_LONG_LIVED_TOKEN=${data.access_token}`);
      console.log('   2. Restart your server');
      console.log('   3. Run: npm run ingest:instagram');
      
      // Optionally write to a file
      const fs = await import('fs');
      const tokenFile = '.instagram-token.txt';
      fs.writeFileSync(tokenFile, data.access_token, 'utf8');
      console.log(`\n💾 Token also saved to ${tokenFile} (for reference)`);
      
    } else {
      console.log('❌ Unexpected response format:');
      console.log(JSON.stringify(data, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error refreshing token:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  refreshInstagramToken()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default refreshInstagramToken;
