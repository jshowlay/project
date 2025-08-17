# TikTok Integration for TrenderAI

This document explains how to set up and use the TikTok integration feature in TrenderAI.

## Overview

The TikTok integration allows you to:
- Connect your TikTok account via OAuth v2
- Import your recent videos for analysis
- Store video metadata locally for trend analysis
- View engagement metrics and hashtags

## Setup Instructions

### 1. Create a TikTok Developer App

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in with your TikTok account
3. Click "Create App" and fill in the required information:
   - App Name: `TrenderAI Integration`
   - App Description: `AI-powered trend analysis for TikTok content`
   - Platform: Web
   - Category: Other

### 2. Configure App Permissions

1. In your app dashboard, go to "App Info"
2. Enable the following permissions:
   - **Login Kit** - Required for OAuth authentication
   - **Display API** - Required to fetch user videos

### 3. Set Up OAuth Redirect

1. Go to "App Info" → "OAuth 2.0"
2. Add your redirect URI: `http://localhost:3000/api/tiktok/callback`
3. Request the following scopes:
   - `user.info.basic` - Access to user profile information
   - `video.list` - Access to user's video list

### 4. Get Your Credentials

1. Copy your **Client Key** and **Client Secret** from the app dashboard
2. Add them to your `.env` file:

```env
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_REDIRECT_URI=http://localhost:3000/api/tiktok/callback
TIKTOK_SCOPES=user.info.basic,video.list
TIKTOK_DATABASE_URL="file:./data/tiktok.sqlite"
SESSION_SECRET=change_me_tiktok_session
```

### 5. Database Setup

The TikTok integration uses a separate SQLite database. The database is automatically created when you first run the application.

```bash
# Generate Prisma client for TikTok schema
npx prisma generate --schema=prisma/tiktok.schema.prisma

# Push schema to database (creates tables)
npx prisma db push --schema=prisma/tiktok.schema.prisma
```

## Usage

### 1. Access the TikTok Integration

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/tiktok`

### 2. Connect Your Account

1. Click "Connect TikTok" button
2. You'll be redirected to TikTok's authorization page
3. Grant the requested permissions
4. You'll be redirected back to the TrenderAI TikTok page

### 3. Import Videos

1. Once connected, click "Import Recent Videos"
2. The system will fetch your recent TikTok videos
3. Videos are stored locally in the SQLite database
4. You can view imported videos and their metadata

### 4. View Imported Data

- **Video Descriptions**: Full text of your video captions
- **Engagement Metrics**: Likes, comments, shares, views
- **Hashtags**: All hashtags used in each video
- **Music**: Background music information
- **Timestamps**: When videos were posted

## API Endpoints

### Authentication
- `GET /api/tiktok/auth` - Initiate OAuth flow
- `GET /api/tiktok/callback` - Handle OAuth callback

### User Data
- `GET /api/tiktok/user` - Get user profile information
- `POST /api/tiktok/videos` - Import videos from TikTok
- `GET /api/tiktok/videos` - Get imported videos

### Optional Features
- `GET /api/tiktok/trending?hashtag=example` - Get trending content (disabled by default)

## Database Schema

### TikTokAccount
- `id` - Unique identifier
- `openId` - TikTok user ID
- `displayName` - User's display name
- `avatarUrl` - Profile picture URL
- `unionId` - Union ID (if available)
- `createdAt` - Account creation timestamp

### TikTokVideo
- `id` - TikTok video ID
- `accountId` - Reference to TikTokAccount
- `description` - Video caption/description
- `shareUrl` - Direct link to video
- `durationSec` - Video duration in seconds
- `width` / `height` - Video dimensions
- `likeCount` / `commentCount` / `shareCount` / `viewCount` - Engagement metrics
- `postedAt` - When video was posted
- `hashtags` - JSON string of hashtags
- `musicTitle` - Background music title

## Optional Trending Providers

The integration supports optional third-party trending providers:

### Apify
```env
TREND_PROVIDER=apify
APIFY_TOKEN=your_apify_token
```

### TikAPI
```env
TREND_PROVIDER=tikapi
TIKAPI_KEY=your_tikapi_key
```

**Note**: These providers are disabled by default and require separate API keys.

## Security Considerations

### Development
- Uses in-memory session storage (not suitable for production)
- Tokens are stored server-side in session cookies
- CSRF protection via state parameter

### Production Recommendations
- Replace in-memory sessions with Redis or database storage
- Implement proper session management
- Add rate limiting for API endpoints
- Use HTTPS in production
- Store sensitive data encrypted

## Troubleshooting

### Common Issues

1. **"TIKTOK_CLIENT_KEY not configured"**
   - Ensure your `.env` file has the correct TikTok credentials

2. **"OAuth error"**
   - Check that your redirect URI matches exactly
   - Verify your app has the correct permissions enabled

3. **"Token exchange failed"**
   - Ensure your client secret is correct
   - Check that your app is approved for the requested scopes

4. **"Authentication expired"**
   - Reconnect your TikTok account
   - The system will attempt to refresh tokens automatically

### Debug Mode

Enable detailed logging by setting:
```env
LOG_LEVEL=debug
```

## Integration with TrenderAI

The imported TikTok data can be used for:
- Trend analysis across your content
- Performance tracking over time
- Hashtag effectiveness analysis
- Content optimization insights

## Support

For issues with the TikTok integration:
1. Check the browser console for error messages
2. Review the server logs for detailed error information
3. Ensure all environment variables are properly configured
4. Verify your TikTok app permissions and settings

