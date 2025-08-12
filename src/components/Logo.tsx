'use client';
import Image from 'next/image';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export default function Logo({ size='lg', className='' }: Props) {
  const heightPx = size === 'lg' ? 64 : size === 'sm' ? 32 : 48;
  const widthClamp = size === 'lg'
    ? 'clamp(220px, 30vw, 380px)'
    : size === 'sm'
      ? 'clamp(120px, 20vw, 180px)'
      : 'clamp(160px, 24vw, 300px)';

  return (
    <div
      className={className}
      style={{ position:'relative', height: `${heightPx}px`, width: widthClamp }}
      aria-label="TrenderAI Logo"
    >
      <Image
        src="https://trenderai.com/wp-content/uploads/2025/01/logo-new.png"
        alt="TrenderAI"
        fill
        priority
        sizes="(max-width: 640px) 220px, (max-width: 1024px) 300px, 380px"
        style={{ objectFit:'contain', objectPosition:'left center' }}
      />
    </div>
  );
}
