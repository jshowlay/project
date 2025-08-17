import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Runtime configuration for Node.js (Sharp requires Node runtime, not Edge)
export const runtime = 'nodejs';

interface ImageParams {
  url: string;
  width?: number;
  height?: number;
  dpr?: number;
  format?: 'avif' | 'webp' | 'jpeg';
  quality?: number;
}

// Clamp dimensions and DPR values
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Quality settings for different formats
const QUALITY_SETTINGS = {
  avif: 55,
  webp: 70,
  jpeg: 82
} as const;

// Format-specific Sharp options
const FORMAT_OPTIONS = {
  avif: { quality: QUALITY_SETTINGS.avif },
  webp: { quality: QUALITY_SETTINGS.webp },
  jpeg: { 
    quality: QUALITY_SETTINGS.jpeg,
    mozjpeg: true 
  }
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate parameters
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const width = clamp(parseInt(searchParams.get('width') || '800'), 16, 4096);
    const height = searchParams.get('height') ? clamp(parseInt(searchParams.get('height')!), 16, 4096) : undefined;
    const dpr = clamp(parseFloat(searchParams.get('dpr') || '1'), 1, 3);
    const format = (searchParams.get('format') as ImageParams['format']) || 'webp';
    const quality = clamp(parseInt(searchParams.get('quality') || QUALITY_SETTINGS[format].toString()), 1, 100);

    // Calculate actual dimensions
    const actualWidth = Math.round(width * dpr);
    const actualHeight = height ? Math.round(height * dpr) : undefined;

    // Fetch the source image
    const imageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrenderAI-ImageOptimizer/1.0)'
      }
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}` },
        { status: 404 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Process image with Sharp
    let sharpInstance = sharp(Buffer.from(imageBuffer));

    // Resize with withoutEnlargement to prevent upscaling small images
    if (actualWidth || actualHeight) {
      sharpInstance = sharpInstance.resize(actualWidth, actualHeight, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Convert to requested format
    const formatOptions = FORMAT_OPTIONS[format];
    let processedBuffer: Buffer;

    switch (format) {
      case 'avif':
        processedBuffer = await sharpInstance.avif(formatOptions).toBuffer();
        break;
      case 'webp':
        processedBuffer = await sharpInstance.webp(formatOptions).toBuffer();
        break;
      case 'jpeg':
        processedBuffer = await sharpInstance.jpeg(formatOptions).toBuffer();
        break;
      default:
        processedBuffer = await sharpInstance.webp(FORMAT_OPTIONS.webp).toBuffer();
    }

    // Set cache headers for processed images
    const headers = new Headers({
      'Content-Type': `image/${format}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Vary': 'Accept, DPR, Width',
      'Content-Length': processedBuffer.length.toString()
    });

    return new NextResponse(processedBuffer, { headers });

  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      { error: 'Internal server error during image processing' },
      { status: 500 }
    );
  }
}
