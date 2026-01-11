# Instagram Data Ingestion Setup Guide

## Current Status

❌ **Your Instagram access token has expired** (expired August 17, 2025)

You need to generate a new long-lived access token to enable Instagram data ingestion.

## Quick Setup Steps

### Option 1: Generate New Token via Facebook Graph API Explorer (Easiest)

1. **Go to Facebook Graph API Explorer**
   - Visit: https://developers.facebook.com/tools/explorer
   - Select your app: `752392357551405`

2. **Generate a Short-Lived Token**
   - Click "Generate Access Token"
   - Select permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
   - Copy the generated token

3. **Exchange for Long-Lived Token**
   Run this command (replace `SHORT_TOKEN` with your token):

   ```bash
   curl -X GET "https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=752392357551405&client_secret=39cac05347e03818a4aa962e393637bd&fb_exchange_token=SHORT_TOKEN"
   ```

4. **Update Your .env File**
   ```env
   IG_LONG_LIVED_TOKEN=your_new_long_lived_token_here
   ```

5. **Test the Integration**
   ```bash
   npm run ingest:instagram
   ```

### Option 2: Use Instagram Basic Display API

1. **Go to Your Facebook App Dashboard**
   - Visit: https://developers.facebook.com/apps/752392357551405
   - Navigate to "Instagram Basic Display" product

2. **Create a Test User**
   - Add your Instagram account as a test user
   - Generate a token for the test user

3. **Exchange for Long-Lived Token**
   - Use the same exchange endpoint as above
   - Long-lived tokens last 60 days

### Option 3: Use Instagram Graph API (Business Account)

If you have an Instagram Business account:

1. **Connect Instagram Business Account to Facebook Page**
2. **Get Page Access Token**
3. **Use Instagram Graph API endpoints**

## Current Configuration

Your current setup:
- ✅ App ID: `752392357551405`
- ✅ App Secret: Configured
- ✅ User ID: `17841476153797843`
- ❌ Access Token: **EXPIRED** (needs refresh)

## Hashtags Being Tracked

The integration will fetch data for these hashtags:
- `ai` - Artificial Intelligence
- `tech` - Technology  
- `startups` - Startup ecosystem
- `bitcoin` - Cryptocurrency

You can customize this in `.env`:
```env
IG_DEFAULT_HASHTAGS=ai,tech,startups,bitcoin,crypto,entrepreneurship
```

## After Getting New Token

Once you have a new token:

1. **Update .env file:**
   ```env
   IG_LONG_LIVED_TOKEN=your_new_token_here
   ```

2. **Test the token:**
   ```bash
   npm run instagram:refresh-token
   ```

3. **Ingest Instagram data:**
   ```bash
   npm run ingest:instagram
   ```

4. **Or refresh all data (includes Instagram):**
   ```bash
   npm run refresh:data
   ```

## Token Refresh Schedule

- **Long-lived tokens expire after 60 days**
- Set a reminder to refresh before expiration
- You can refresh tokens up to 60 days before they expire
- Use: `npm run instagram:refresh-token` to refresh

## Troubleshooting

### "Session has expired"
- Your token is too old to refresh
- Generate a completely new token (see steps above)

### "Invalid access token"
- Check that your token hasn't expired
- Verify the token is for the correct app and user

### "No hashtag ID found"
- The hashtag might not exist
- Your account might not have permission to access that hashtag
- Try a different hashtag

### Rate Limits
- Instagram API: 200 calls/hour per user
- If you hit limits, wait an hour or reduce hashtag count

## Testing Without Token (Mock Data)

If you want to test the integration without a valid token, the system will:
- Show error messages but continue processing other sources
- Not crash the ingestion process
- Allow you to test other data sources

## Need Help?

- Facebook Developer Docs: https://developers.facebook.com/docs/instagram-api
- Instagram Graph API: https://developers.facebook.com/docs/instagram-api/overview
- Check `README_INSTAGRAM.md` for more details
