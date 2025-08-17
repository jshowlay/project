import React from 'react';
import { extractBestImage } from '@/lib/imageSources';
import SmartImg, { AspectRatioSmartImg } from '@/components/SmartImg';

interface MediaCardProps {
  data: any;
  source: string;
  title?: string;
  description?: string;
  aspectRatio?: number;
  className?: string;
  priority?: boolean;
}

export default function MediaCard({
  data,
  source,
  title,
  description,
  aspectRatio = 16 / 9,
  className = '',
  priority = false
}: MediaCardProps) {
  // Extract the best image from the data
  const imageSource = extractBestImage(data, source);
  
  if (!imageSource) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500 text-sm">No image available</div>
        {title && <h3 className="font-semibold mt-2">{title}</h3>}
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Image Section */}
      <div className="relative">
        {aspectRatio ? (
          <AspectRatioSmartImg
            src={imageSource.url}
            alt={imageSource.alt || title || 'Media content'}
            aspectRatio={aspectRatio}
            priority={priority}
            formats={['webp', 'avif', 'jpeg']}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full"
          />
        ) : (
          <SmartImg
            src={imageSource.url}
            alt={imageSource.alt || title || 'Media content'}
            width={800}
            height={450}
            priority={priority}
            formats={['webp', 'avif', 'jpeg']}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-48 object-cover"
          />
        )}
        
        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {source.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content Section */}
      {(title || description) && (
        <div className="p-4">
          {title && (
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Specialized card for different content types
export function NYTimesCard({ data, ...props }: Omit<MediaCardProps, 'source'>) {
  return (
    <MediaCard
      {...props}
      data={data}
      source="nytimes"
      title={data.title}
      description={data.abstract}
    />
  );
}

export function YouTubeCard({ data, ...props }: Omit<MediaCardProps, 'source'>) {
  return (
    <MediaCard
      {...props}
      data={data}
      source="youtube"
      title={data.snippet?.title}
      description={data.snippet?.description}
    />
  );
}

export function TwitterCard({ data, ...props }: Omit<MediaCardProps, 'source'>) {
  return (
    <MediaCard
      {...props}
      data={data}
      source="twitter"
      title={data.text}
      description={data.user?.name}
    />
  );
}

export function RedditCard({ data, ...props }: Omit<MediaCardProps, 'source'>) {
  return (
    <MediaCard
      {...props}
      data={data}
      source="reddit"
      title={data.title}
      description={data.selftext}
    />
  );
}

export function InstagramCard({ data, ...props }: Omit<MediaCardProps, 'source'>) {
  return (
    <MediaCard
      {...props}
      data={data}
      source="instagram"
      title={data.caption?.text}
      description={data.user?.username}
    />
  );
}
