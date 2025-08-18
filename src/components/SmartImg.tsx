'use client';

import React, { useState, useRef, useEffect } from 'react';
import { generateOptimizedImageUrl, generateSrcSet } from '@/lib/imageSources';

interface SmartImgProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  widthHint?: number; // Container width to prevent CSS upscaling
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  formats?: ('avif' | 'webp' | 'jpeg')[];
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

export default function SmartImg({
  src,
  alt = '',
  width,
  height,
  widthHint,
  className = '',
  priority = false,
  loading = 'lazy',
  sizes = '100vw',
  formats = ['webp', 'jpeg'],
  quality,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  style,
  ...props
}: SmartImgProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(widthHint);

  // Detect container width to prevent CSS upscaling
  useEffect(() => {
    if (!widthHint && containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            setContainerWidth(Math.round(width));
          }
        }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [widthHint]);

  // Use container width or provided width, ensuring we don't upscale
  const effectiveWidth = containerWidth || width || 800;
  const effectiveHeight = height;

  // Generate optimized image URLs
  const defaultSrc = generateOptimizedImageUrl(src, effectiveWidth, 1, formats[0]);
  const srcSet = generateSrcSet(src, effectiveWidth, formats);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Fallback to original image if optimization fails
  const fallbackSrc = hasError ? src : defaultSrc;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        ...style
      }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            filter: 'blur(10px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={fallbackSrc}
        alt={alt}
        width={effectiveWidth}
        height={effectiveHeight}
        loading={priority ? 'eager' : loading}
        sizes={sizes}
        srcSet={srcSet}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {/* Loading skeleton */}
      {!isLoaded && !hasError && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

// Higher-order component for lazy loading
export function LazySmartImg(props: SmartImgProps) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isInView) {
    return (
      <div ref={ref} className={`bg-gray-200 animate-pulse ${props.className || ''}`} />
    );
  }

  return <SmartImg {...props} />;
}

// Component for aspect ratio containers
interface AspectRatioSmartImgProps extends SmartImgProps {
  aspectRatio: number; // width / height
}

export function AspectRatioSmartImg({ 
  aspectRatio, 
  width, 
  height,
  widthHint,
  ...props 
}: AspectRatioSmartImgProps) {
  const effectiveWidth = width || widthHint || 400;
  const effectiveHeight = height || Math.round(effectiveWidth / aspectRatio);

  return (
    <div 
      className="relative w-full"
      style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
    >
      <div className="absolute inset-0">
        <SmartImg
          {...props}
          width={effectiveWidth}
          height={effectiveHeight}
          widthHint={widthHint}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
