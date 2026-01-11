# YouTube High-Quality Image Integration

This document describes the enhanced YouTube integration that provides high-quality thumbnail images for YouTube trends in the TrenderAI application.

## Features

### 🎯 High-Quality Thumbnail Support
- **Automatic Quality Detection**: Automatically selects the best available thumbnail quality
- **Quality Hierarchy**: maxres > standard > high > medium > default
- **Fallback System**: Gracefully falls back to lower quality if higher quality fails
- **Multiple URL Support**: Provides URLs for all quality levels

### 🎨 Enhanced UI Components
- **YouTubeImage Component**: Specialized component for YouTube thumbnails
- **MediaCard Component**: Enhanced card component with YouTube support
- **Play Button Overlay**: Visual play button indicator
- **Channel Display**: Shows channel name on thumbnails
- **Responsive Design**: Proper aspect ratios and responsive layouts

### 🔧 Technical Features
- **Error Handling**: Robust error handling with placeholder content
- **Performance Optimized**: Uses Next.js Image component for optimization
- **TypeScript Support**: Full type safety and IntelliSense support
- **Utility Functions**: Helper functions for video ID extraction and URL generation

## Components

### YouTubeImage Component

A specialized React component for displaying YouTube video thumbnails with high-quality support.

```tsx
import YouTubeImage from '@/components/content/YouTubeImage';

<YouTubeImage
  videoId="dQw4w9WgXcQ"
  title="Video Title"
  channel="Channel Name"
  width={320}
  height={180}
  quality="high"
  showPlayButton={true}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `videoId` | `string` | - | YouTube video ID (required) |
| `imageUrls` | `YouTubeImageUrls` | - | Pre-fetched image URLs |
| `title` | `string` | - | Video title for alt text |
| `channel` | `string` | - | Channel name to display |
| `width` | `number` | `320` | Image width |
| `height` | `number` | `180` | Image height |
| `quality` | `'maxres' \| 'high' \| 'medium' \| 'low'` | `'high'` | Preferred quality |
| `showPlayButton` | `boolean` | `true` | Show play button overlay |
| `onClick` | `() => void` | - | Click handler |

### MediaCard Component

Enhanced media card component that supports YouTube videos with high-quality images.

```tsx
import MediaCard from '@/components/content/MediaCard';

<MediaCard
  source="youtube"
  title="Video Title"
  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  channel="Channel Name"
  views={1000000}
  likes={50000}
  comments={1000}
  imageQuality="high"
/>
```

## API Integration

### Enhanced YouTube Adapter

The YouTube adapter has been enhanced to fetch high-quality thumbnail information:

```typescript
// src/integrations/youtube.ts
export const youtubeAdapter: Adapter = {
  SOURCE_ID: 'youtube',
  async fetchTrends() {
    // Fetches videos with enhanced thumbnail data
    const vids = await listMostPopular('US');
    
    return vids.map(video => ({
      // ... other fields
      raw: {
        // Enhanced image data
        images: {
          primary: bestThumbnailUrl,
          high: allThumbnailUrls.high,
          medium: allThumbnailUrls.medium,
          low: allThumbnailUrls.low,
          fallbacks: allThumbnailUrls.fallback
        }
      }
    }));
  }
};
```

### YouTube Source Class

Enhanced data source class for YouTube integration:

```typescript
// lib/sources.ts
export class YouTubeSource extends DataSource {
  async fetchData(): Promise<TrendItem[]> {
    // Requests additional parts for detailed thumbnail information
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${this.regionCode}&videoCategoryId=${this.videoCategoryId}&maxResults=25&key=${this.apiKey}`;
    
    return data.items.map(video => ({
      // ... other fields
      image_url: bestThumbnailUrl,
      image_urls: allThumbnailUrls,
      metadata: {
        channel: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails?.duration,
        tags: video.snippet.tags || [],
        thumbnails: thumbnails
      }
    }));
  }
}
```

## Utility Functions

### extractYouTubeVideoId

Extracts video ID from various YouTube URL formats:

```typescript
import { extractYouTubeVideoId } from '@/components/content/YouTubeImage';

const videoId = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
// Returns: 'dQw4w9WgXcQ'
```

### getYouTubeThumbnailUrls

Generates thumbnail URLs for a video ID:

```typescript
import { getYouTubeThumbnailUrls } from '@/components/content/YouTubeImage';

const urls = getYouTubeThumbnailUrls('dQw4w9WgXcQ');
// Returns object with maxres, high, medium, default URLs
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# YouTube API Configuration
YOUTUBE_API_KEY=your-youtube-api-key
YOUTUBE_REGION_CODE=US
YOUTUBE_VIDEO_CATEGORY_ID=0
YOUTUBE_RATE_LIMIT_MS=1000
ENABLE_YOUTUBE=true
```

### YouTube API Setup

1. **Get API Key**: Visit [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable YouTube Data API v3**: Enable the YouTube Data API v3 service
3. **Create Credentials**: Create an API key with YouTube Data API v3 access
4. **Set Quotas**: Configure appropriate quotas for your usage

## Demo Page

Visit `/youtube-demo` to see the high-quality YouTube image integration in action. The demo page includes:

- Sample videos with different thumbnail qualities
- Quality selector to test different image qualities
- Individual YouTube image components
- Enhanced media cards
- Feature showcase

## Thumbnail Quality Levels

YouTube provides several thumbnail quality levels:

| Quality | Resolution | Description |
|---------|------------|-------------|
| `maxres` | 1280x720 | Maximum resolution (not always available) |
| `standard` | 640x480 | Standard quality |
| `high` | 480x360 | High quality |
| `medium` | 320x180 | Medium quality |
| `default` | 120x90 | Default quality |

## Error Handling

The system includes robust error handling:

1. **Image Load Failures**: Automatically falls back to lower quality
2. **Missing Thumbnails**: Uses fallback URL patterns
3. **Network Issues**: Shows placeholder content
4. **Invalid Video IDs**: Graceful degradation

## Performance Considerations

- **Image Optimization**: Uses Next.js Image component for optimization
- **Lazy Loading**: Images load only when needed
- **Caching**: Leverages browser and CDN caching
- **Fallback URLs**: Reduces API calls with predictable URL patterns

## Usage Examples

### Basic Usage

```tsx
import YouTubeImage from '@/components/content/YouTubeImage';

function VideoCard({ video }) {
  return (
    <YouTubeImage
      videoId={video.id}
      title={video.title}
      channel={video.channel}
    />
  );
}
```

### With Custom Quality

```tsx
<YouTubeImage
  videoId="dQw4w9WgXcQ"
  quality="maxres"
  width={640}
  height={360}
  showPlayButton={false}
/>
```

### In Media Cards

```tsx
import MediaCard from '@/components/content/MediaCard';

function YouTubeTrends({ trends }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {trends.map(trend => (
        <MediaCard
          key={trend.id}
          source="youtube"
          title={trend.title}
          url={trend.url}
          channel={trend.channel}
          views={trend.views}
          likes={trend.likes}
          imageQuality="high"
        />
      ))}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Images Not Loading**
   - Check YouTube API key configuration
   - Verify video ID extraction
   - Check network connectivity

2. **Low Quality Images**
   - Ensure `quality` prop is set correctly
   - Check if higher quality thumbnails are available
   - Verify YouTube API response

3. **Performance Issues**
   - Use appropriate image sizes
   - Enable image optimization
   - Consider lazy loading for large lists

### Debug Mode

Enable debug logging by setting:

```bash
TIKTOK_ENABLE_DEBUG_LOGGING=true
```

This will provide detailed logs about image loading and fallback behavior.

## Future Enhancements

- **Image Caching**: Implement server-side image caching
- **Progressive Loading**: Add progressive image loading
- **Custom Thumbnails**: Support for custom thumbnail generation
- **Analytics**: Track image load performance and quality usage
- **A/B Testing**: Test different image qualities for engagement

## Contributing

When contributing to the YouTube image integration:

1. Follow the existing code patterns
2. Add TypeScript types for new features
3. Include error handling for edge cases
4. Test with various YouTube video types
5. Update documentation for new features

