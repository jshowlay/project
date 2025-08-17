# Image Optimization System

A comprehensive image optimization system for the TrenderAI Next.js App Router project that ensures all API-sourced images are crisp and performant.

## Features

### 1. Source Selection
- **Highest Resolution Extraction**: Always selects the largest available upstream image variants
- **Multi-Platform Support**: Handles NYTimes, YouTube, Twitter/X, Reddit, Instagram, and generic sources
- **Intelligent Fallbacks**: Graceful degradation when high-res images aren't available

### 2. Responsive Delivery
- **DPR Variants**: Serves images with 1x/2x/3x Device Pixel Ratio variants
- **Responsive Srcsets**: Automatically generates proper srcset attributes
- **Container-Aware**: Prevents CSS upscaling by matching container dimensions

### 3. Format Optimization
- **Modern Formats**: Converts images to AVIF/WebP/JPEG with optimal quality settings
- **Browser Detection**: Automatic format negotiation based on browser support
- **Quality Settings**: AVIF (55%), WebP (70%), JPEG (82% with mozjpeg)

### 4. CSS Prevention
- **No Upscaling**: Prevents CSS upscaling that causes blurriness
- **Container Detection**: Uses ResizeObserver to detect actual container width
- **Width Hints**: Optional widthHint parameter for explicit sizing

## Implementation

### API Route: `/api/img`
- **Runtime**: Node.js (required for Sharp)
- **Processing**: Sharp library with optimized settings
- **Caching**: `public, max-age=31536000, immutable`
- **Headers**: `Vary: Accept, DPR, Width` for proper CDN caching

### Helper Functions: `src/lib/imageSources.ts`
- `extractNYTimesImage()` - Extracts highest res from NYTimes media metadata
- `extractYouTubeImage()` - Gets best thumbnail from YouTube video data
- `extractTwitterImage()` - Finds largest image from Twitter media
- `extractRedditImage()` - Extracts from Reddit preview/thumbnail data
- `extractInstagramImage()` - Gets standard resolution from Instagram
- `extractBestImage()` - Generic function for any source
- `generateOptimizedImageUrl()` - Creates optimized image URLs
- `generateSrcSet()` - Generates responsive srcsets

### Components

#### SmartImg (`src/components/SmartImg.tsx`)
Main component with features:
- Automatic container width detection
- DPR-aware srcset generation
- Format negotiation
- Error handling with fallbacks
- Loading states and placeholders

#### Variants
- `LazySmartImg` - Intersection Observer-based lazy loading
- `AspectRatioSmartImg` - Maintains aspect ratio with CSS padding

#### MediaCard (`src/components/content/MediaCard.tsx`)
Example usage component with:
- Source-specific card variants (NYTimes, YouTube, Twitter, etc.)
- Automatic image extraction from API data
- Responsive design with proper sizing

## Usage Examples

### Basic Usage
```tsx
import SmartImg from '@/components/SmartImg';

<SmartImg
  src="https://example.com/image.jpg"
  alt="Description"
  width={800}
  formats={['webp', 'jpeg']}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Aspect Ratio Container
```tsx
import { AspectRatioSmartImg } from '@/components/SmartImg';

<AspectRatioSmartImg
  src="https://example.com/image.jpg"
  alt="Description"
  aspectRatio={16 / 9}
  formats={['webp', 'avif', 'jpeg']}
/>
```

### Lazy Loading
```tsx
import { LazySmartImg } from '@/components/SmartImg';

<LazySmartImg
  src="https://example.com/image.jpg"
  alt="Description"
  width={400}
  height={300}
/>
```

### Media Cards
```tsx
import { NYTimesCard, YouTubeCard } from '@/components/content/MediaCard';

<NYTimesCard data={nytimesData} />
<YouTubeCard data={youtubeData} />
```

## API Parameters

### `/api/img` Endpoint
- `url` (required) - Source image URL
- `width` (optional) - Target width (16-4096px, default: 800)
- `height` (optional) - Target height (16-4096px)
- `dpr` (optional) - Device pixel ratio (1-3, default: 1)
- `format` (optional) - Output format: 'avif', 'webp', 'jpeg'
- `quality` (optional) - Quality setting (1-100)

### Example URLs
```
/api/img?url=https://example.com/image.jpg&width=800&format=webp
/api/img?url=https://example.com/image.jpg&width=400&dpr=2&format=avif
/api/img?url=https://example.com/image.jpg&width=1200&height=800&format=jpeg
```

## Testing

Visit `/debug/images` to see comprehensive testing examples:
- Direct SmartImg testing
- Aspect ratio variations
- Lazy loading demonstration
- Media card examples
- Format comparison
- DPR testing
- Error handling

## Configuration

### Next.js Config
Remote patterns are configured for:
- `images.unsplash.com`
- `picsum.photos`
- `static01.nyt.com`
- `i.ytimg.com`
- `pbs.twimg.com`
- `i.redd.it`
- `scontent.cdninstagram.com`
- `trenderai.com`

### Sharp Settings
- **AVIF**: 55% quality, effort 4
- **WebP**: 70% quality, effort 4
- **JPEG**: 82% quality, mozjpeg enabled, progressive

## Performance Benefits

1. **Reduced Bandwidth**: Modern formats (AVIF/WebP) are 30-70% smaller
2. **Faster Loading**: Optimized images load faster
3. **Better UX**: No blurry upscaled images
4. **CDN Friendly**: Proper cache headers and Vary headers
5. **Responsive**: Right image for right device

## Error Handling

- Graceful fallback to original image on optimization failure
- Loading states with skeleton placeholders
- Error states with fallback UI
- Console warnings for debugging

## Browser Support

- **AVIF**: Chrome 85+, Firefox 93+, Safari 16.4+
- **WebP**: Chrome 23+, Firefox 65+, Safari 14+
- **JPEG**: Universal fallback

The system automatically detects browser support and serves the best available format.
