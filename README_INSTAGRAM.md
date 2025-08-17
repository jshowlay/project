# Instagram Integration Setup

The Instagram integration is now ready to use! Here's how to set it up:

## Prerequisites

1. **Instagram Business/Creator Account**: You need a Business or Creator Instagram account
2. **Facebook Developer Account**: Create an app at [developers.facebook.com](https://developers.facebook.com)
3. **Instagram Basic Display API**: Enable this in your Facebook app

## Setup Steps

### 1. Create a Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click "Create App" → "Consumer" → "Next"
3. Fill in app details and create the app

### 2. Configure Instagram Basic Display

1. In your app dashboard, go to "Add Product" → "Instagram Basic Display"
2. Add your Instagram account as a test user
3. Generate a long-lived access token

### 3. Get Your Instagram User ID

1. Go to [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. Select your app and generate a token
3. Make a GET request to: `https://graph.facebook.com/v20.0/me/accounts`
4. Find your Instagram Business Account ID

### 4. Configure Environment Variables

Add these to your `.env` file:

```env
# Instagram Graph API (Business/Creator account required)
IG_APP_ID=your_app_id_here
IG_APP_SECRET=your_app_secret_here
IG_USER_ID=your_instagram_user_id_here
IG_LONG_LIVED_TOKEN=your_long_lived_token_here
IG_DEFAULT_HASHTAGS=ai,tech,startups,bitcoin

# Caching / defaults
IG_CACHE_TTL_SECONDS=900
IG_DEFAULT_GEO=GLOBAL
```

### 5. Test the Integration

Once configured, you can test:

```bash
# Test Instagram hashtag API
curl "http://localhost:3000/api/instagram/hashtag?tag=ai"

# Test Instagram trends
curl "http://localhost:3000/api/trends?source=instagram&limit=5"
```

## Features

- **Hashtag Tracking**: Monitors popular hashtags for trending content
- **Engagement Scoring**: Calculates trend scores based on likes, comments, and recency
- **Image Support**: Includes Instagram post images in trend results
- **Caching**: 15-minute cache to avoid rate limits
- **Multiple Hashtags**: Configure multiple hashtags to track

## Default Hashtags

The integration tracks these hashtags by default:
- `ai` - Artificial Intelligence
- `tech` - Technology
- `startups` - Startup ecosystem
- `bitcoin` - Cryptocurrency

You can customize this list by setting `IG_DEFAULT_HASHTAGS` in your environment.

## Rate Limits

Instagram Graph API has rate limits:
- 200 calls per hour per user
- 100 calls per hour per app

The integration includes caching to help stay within these limits.

## Troubleshooting

### Common Issues

1. **"No userId configured"**: Make sure `IG_USER_ID` is set correctly
2. **"No hashtag ID found"**: The hashtag might not exist or your account doesn't have access
3. **Token expired**: Long-lived tokens expire after 60 days, you'll need to refresh them

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will show detailed Instagram API requests and responses.

## API Endpoints

- `GET /api/instagram/hashtag?tag=ai` - Get trending posts for a specific hashtag
- `GET /api/trends?source=instagram` - Get Instagram trends in the main trends feed

## Integration Status

✅ **Ready to use** - The Instagram adapter is fully integrated and will appear in your trends feed once credentials are configured.


