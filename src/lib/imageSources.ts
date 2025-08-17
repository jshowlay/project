/**
 * Helper functions to extract the highest resolution images from various APIs
 */

export interface ImageSource {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface MediaItem {
  type: 'image' | 'video' | 'gif';
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  thumbnail?: string;
}

/**
 * Extract the highest resolution image from NYTimes media metadata
 */
export function extractNYTimesImage(media: any[]): ImageSource | null {
  if (!Array.isArray(media) || media.length === 0) return null;

  // Find the largest image variant
  const images = media
    .filter(item => item.type === 'image')
    .flatMap(item => {
      if (item['media-metadata']) {
        return item['media-metadata'].map((meta: any) => ({
          url: meta.url,
          width: meta.width,
          height: meta.height,
          alt: item.caption || item.copyright || undefined
        }));
      }
      return [];
    })
    .filter(img => img.url && img.width && img.height)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));

  return images[0] || null;
}

/**
 * Extract the highest resolution image from YouTube video data
 */
export function extractYouTubeImage(videoData: any): ImageSource | null {
  if (!videoData?.snippet?.thumbnails) return null;

  const thumbnails = videoData.snippet.thumbnails;
  
  // Priority order: maxres > high > medium > standard > default
  const priority = ['maxres', 'high', 'medium', 'standard', 'default'];
  
  for (const quality of priority) {
    const thumbnail = thumbnails[quality];
    if (thumbnail?.url) {
      return {
        url: thumbnail.url,
        width: thumbnail.width,
        height: thumbnail.height,
        alt: videoData.snippet.title || 'YouTube video thumbnail'
      };
    }
  }

  return null;
}

/**
 * Extract the highest resolution image from Twitter/X media data
 */
export function extractTwitterImage(media: any[]): ImageSource | null {
  if (!Array.isArray(media) || media.length === 0) return null;

  const images = media
    .filter(item => item.type === 'photo')
    .map(item => {
      // Twitter provides different sizes, prefer the largest
      const sizes = item.sizes || {};
      const variants = ['large', 'medium', 'small'];
      
      for (const variant of variants) {
        if (sizes[variant]) {
          return {
            url: item.media_url_https || item.media_url,
            width: sizes[variant].w,
            height: sizes[variant].h,
            alt: item.ext_alt_text || 'Twitter image'
          };
        }
      }
      
      return {
        url: item.media_url_https || item.media_url,
        alt: item.ext_alt_text || 'Twitter image'
      };
    })
    .filter(img => img.url)
    .sort((a, b) => {
      const aSize = (a.width || 0) * (a.height || 0);
      const bSize = (b.width || 0) * (b.height || 0);
      return bSize - aSize;
    });

  return images[0] || null;
}

/**
 * Extract the highest resolution image from Reddit post data
 */
export function extractRedditImage(postData: any): ImageSource | null {
  if (!postData) return null;

  // Check for preview images first (highest quality)
  if (postData.preview?.images?.[0]?.source) {
    const source = postData.preview.images[0].source;
    return {
      url: source.url.replace(/&amp;/g, '&'),
      width: source.width,
      height: source.height,
      alt: postData.title || 'Reddit post image'
    };
  }

  // Check for thumbnail
  if (postData.thumbnail && postData.thumbnail !== 'self' && postData.thumbnail !== 'default') {
    return {
      url: postData.thumbnail,
      alt: postData.title || 'Reddit post thumbnail'
    };
  }

  // Check for media metadata
  if (postData.media?.oembed?.thumbnail_url) {
    return {
      url: postData.media.oembed.thumbnail_url,
      width: postData.media.oembed.thumbnail_width,
      height: postData.media.oembed.thumbnail_height,
      alt: postData.title || 'Reddit media thumbnail'
    };
  }

  return null;
}

/**
 * Extract the highest resolution image from Instagram media data
 */
export function extractInstagramImage(mediaData: any): ImageSource | null {
  if (!mediaData) return null;

  // Check for carousel media (multiple images)
  if (mediaData.carousel_media && mediaData.carousel_media.length > 0) {
    const firstImage = mediaData.carousel_media[0];
    if (firstImage.images?.standard_resolution) {
      const img = firstImage.images.standard_resolution;
      return {
        url: img.url,
        width: img.width,
        height: img.height,
        alt: mediaData.caption?.text || 'Instagram image'
      };
    }
  }

  // Check for single image
  if (mediaData.images?.standard_resolution) {
    const img = mediaData.images.standard_resolution;
    return {
      url: img.url,
      width: img.width,
      height: img.height,
      alt: mediaData.caption?.text || 'Instagram image'
    };
  }

  return null;
}

/**
 * Generic function to extract the best image from any source
 */
export function extractBestImage(data: any, source: string): ImageSource | null {
  switch (source.toLowerCase()) {
    case 'nytimes':
    case 'nyt':
      return extractNYTimesImage(data.media || data.multimedia);
    
    case 'youtube':
    case 'yt':
      return extractYouTubeImage(data);
    
    case 'twitter':
    case 'x':
      return extractTwitterImage(data.entities?.media || data.extended_entities?.media);
    
    case 'reddit':
      return extractRedditImage(data);
    
    case 'instagram':
    case 'ig':
      return extractInstagramImage(data);
    
    default:
      // Generic fallback - look for common image fields
      if (data.image_url) return { url: data.image_url, alt: data.title || data.name };
      if (data.thumbnail) return { url: data.thumbnail, alt: data.title || data.name };
      if (data.image) return { url: data.image, alt: data.title || data.name };
      return null;
  }
}

/**
 * Generate optimized image URL with proper parameters
 */
export function generateOptimizedImageUrl(
  sourceUrl: string,
  width: number,
  dpr: number = 1,
  format?: 'avif' | 'webp' | 'jpeg'
): string {
  const params = new URLSearchParams({
    url: sourceUrl,
    width: width.toString(),
    dpr: dpr.toString()
  });

  if (format) {
    params.set('format', format);
  }

  return `/api/img?${params.toString()}`;
}

/**
 * Generate responsive srcset for multiple DPR variants
 */
export function generateSrcSet(
  sourceUrl: string,
  width: number,
  formats: ('avif' | 'webp' | 'jpeg')[] = ['webp', 'jpeg']
): string {
  const dprs = [1, 2, 3];
  const srcSets: string[] = [];

  formats.forEach(format => {
    const urls = dprs.map(dpr => 
      `${generateOptimizedImageUrl(sourceUrl, width, dpr, format)} ${dpr}x`
    );
    srcSets.push(urls.join(', '));
  });

  return srcSets.join(', ');
}
