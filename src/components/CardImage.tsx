'use client';
import SmartImg from './SmartImg';

type Props = {
  remoteUrl: string;       // original http(s) image
  alt: string;
  ratio?: string;          // CSS aspect-ratio (e.g., '16/9', '3/2')
  maxW?: number;           // hard cap for width requests (px). default 2000
  quality?: number;        // 30..95 (proxy enforces clamp). default 88
};

export default function CardImage({
  remoteUrl,
  alt,
  ratio,
  maxW = 2000,
  quality = 88
}: Props) {
  // Convert CSS aspect ratio string to number
  const aspectRatio = ratio ? parseFloat(ratio.split('/')[0]) / parseFloat(ratio.split('/')[1]) : 16 / 9;

  return (
    <div className="mb-3 overflow-hidden rounded-xl relative" style={{ background:'#0e0e0e', border:'1px solid #1b1b1b' }}>
      <SmartImg
        src={remoteUrl}
        alt={alt}
        widthHint={400}
        formats={['webp', 'jpeg']}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="w-full h-48 object-cover rounded-xl"
        placeholder="empty"
        onError={() => {
          console.warn(`Failed to load image: ${remoteUrl}`);
        }}
      />
    </div>
  );
}
