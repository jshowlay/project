import React from 'react';
import SmartImg, { AspectRatioSmartImg, LazySmartImg } from '@/components/SmartImg';
import MediaCard, { NYTimesCard, YouTubeCard, TwitterCard, RedditCard, InstagramCard } from '@/components/content/MediaCard';

// Sample data for testing
const sampleData = {
  nytimes: {
    title: "Sample NYTimes Article",
    abstract: "This is a sample abstract for testing the image optimization system.",
    media: [
      {
        type: "image",
        "media-metadata": [
          {
            url: "https://static01.nyt.com/images/2023/12/01/multimedia/01xp-ai-1/01xp-ai-1-superJumbo.jpg",
            width: 2048,
            height: 1365
          }
        ],
        caption: "Sample NYTimes image"
      }
    ]
  },
  youtube: {
    snippet: {
      title: "Sample YouTube Video",
      description: "This is a sample YouTube video for testing.",
      thumbnails: {
        maxres: {
          url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          width: 1280,
          height: 720
        }
      }
    }
  },
  twitter: {
    text: "Sample Twitter post with image",
    user: { name: "Sample User" },
    entities: {
      media: [
        {
          type: "photo",
          media_url_https: "https://pbs.twimg.com/media/example.jpg",
          sizes: {
            large: { w: 1024, h: 768 }
          },
          ext_alt_text: "Sample Twitter image"
        }
      ]
    }
  },
  reddit: {
    title: "Sample Reddit Post",
    selftext: "This is a sample Reddit post for testing.",
    preview: {
      images: [
        {
          source: {
            url: "https://i.redd.it/example.jpg",
            width: 1920,
            height: 1080
          }
        }
      ]
    }
  },
  instagram: {
    caption: { text: "Sample Instagram post" },
    user: { username: "sample_user" },
    images: {
      standard_resolution: {
        url: "https://scontent.cdninstagram.com/example.jpg",
        width: 1080,
        height: 1080
      }
    }
  }
};

// Test images for direct optimization testing
const testImages = [
  {
    name: "High Resolution Landscape",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=4000&h=3000&fit=crop",
    width: 4000,
    height: 3000
  },
  {
    name: "Portrait Image",
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=2000&h=3000&fit=crop",
    width: 2000,
    height: 3000
  },
  {
    name: "Square Image",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=3000&h=3000&fit=crop",
    width: 3000,
    height: 3000
  }
];

export default function ImageDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Image Optimization System Test
          </h1>
          <p className="text-gray-600">
            This page demonstrates the comprehensive image optimization system with various formats, DPR variants, and responsive delivery.
          </p>
        </div>

        {/* Direct SmartImg Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Direct SmartImg Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testImages.map((image, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-medium text-gray-900 mb-3">{image.name}</h3>
                <SmartImg
                  src={image.url}
                  alt={image.name}
                  width={400}
                  height={300}
                  formats={['webp', 'avif', 'jpeg']}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="w-full h-48 object-cover rounded"
                />
                <div className="mt-3 text-sm text-gray-500">
                  Original: {image.width}×{image.height}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Aspect Ratio Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Aspect Ratio Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">16:9 Landscape</h3>
              <AspectRatioSmartImg
                src={testImages[0].url}
                alt="Landscape"
                aspectRatio={16 / 9}
                formats={['webp', 'jpeg']}
                className="w-full rounded"
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">3:4 Portrait</h3>
              <AspectRatioSmartImg
                src={testImages[1].url}
                alt="Portrait"
                aspectRatio={3 / 4}
                formats={['webp', 'jpeg']}
                className="w-full rounded"
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">1:1 Square</h3>
              <AspectRatioSmartImg
                src={testImages[2].url}
                alt="Square"
                aspectRatio={1}
                formats={['webp', 'jpeg']}
                className="w-full rounded"
              />
            </div>
          </div>
        </section>

        {/* Lazy Loading Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Lazy Loading Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-medium text-gray-900 mb-3">Lazy Loaded Image {i + 1}</h3>
                <LazySmartImg
                  src={`https://picsum.photos/400/300?random=${i}`}
                  alt={`Random image ${i + 1}`}
                  width={400}
                  height={300}
                  formats={['webp', 'jpeg']}
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Media Card Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Media Card Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NYTimesCard data={sampleData.nytimes} />
            <YouTubeCard data={sampleData.youtube} />
            <TwitterCard data={sampleData.twitter} />
            <RedditCard data={sampleData.reddit} />
            <InstagramCard data={sampleData.instagram} />
            <MediaCard
              data={{ image_url: "https://picsum.photos/400/300?random=99" }}
              source="generic"
              title="Generic Media Card"
              description="This is a generic media card with a placeholder image."
            />
          </div>
        </section>

        {/* Format Comparison */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Format Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">AVIF Format</h3>
              <SmartImg
                src={testImages[0].url}
                alt="AVIF format"
                width={400}
                height={300}
                formats={['avif']}
                className="w-full h-48 object-cover rounded"
              />
              <div className="mt-2 text-sm text-gray-500">Best compression, modern browsers</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">WebP Format</h3>
              <SmartImg
                src={testImages[0].url}
                alt="WebP format"
                width={400}
                height={300}
                formats={['webp']}
                className="w-full h-48 object-cover rounded"
              />
              <div className="mt-2 text-sm text-gray-500">Good compression, wide support</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">JPEG Format</h3>
              <SmartImg
                src={testImages[0].url}
                alt="JPEG format"
                width={400}
                height={300}
                formats={['jpeg']}
                className="w-full h-48 object-cover rounded"
              />
              <div className="mt-2 text-sm text-gray-500">Universal support, fallback</div>
            </div>
          </div>
        </section>

        {/* DPR Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Device Pixel Ratio Testing</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 mb-4">
              Resize your browser window and check the Network tab to see different DPR variants being loaded.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SmartImg
                src={testImages[0].url}
                alt="DPR Test 1"
                width={300}
                height={200}
                formats={['webp']}
                className="w-full h-32 object-cover rounded"
              />
              <SmartImg
                src={testImages[1].url}
                alt="DPR Test 2"
                width={300}
                height={200}
                formats={['webp']}
                className="w-full h-32 object-cover rounded"
              />
              <SmartImg
                src={testImages[2].url}
                alt="DPR Test 3"
                width={300}
                height={200}
                formats={['webp']}
                className="w-full h-32 object-cover rounded"
              />
            </div>
          </div>
        </section>

        {/* Error Handling Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Error Handling Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">Invalid URL</h3>
              <SmartImg
                src="https://invalid-url-that-does-not-exist.com/image.jpg"
                alt="Invalid image"
                width={400}
                height={300}
                className="w-full h-48 object-cover rounded"
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">Empty URL</h3>
              <SmartImg
                src=""
                alt="Empty image"
                width={400}
                height={300}
                className="w-full h-48 object-cover rounded"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
