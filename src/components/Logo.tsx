'use client';
import Image from 'next/image';

export default function Logo({ className = '' }: { className?: string }) {
  // Container uses fixed height with responsive width; image uses "fill" + contain for perfect fit.
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        height: '40px',
        width: 'clamp(140px, 22vw, 240px)'
      }}
      aria-label="TrenderAI Logo"
    >
      <Image
        src="https://trenderai.com/wp-content/uploads/2025/01/logo-new.png"
        alt="TrenderAI"
        fill
        priority
        sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
        style={{ objectFit: 'contain', objectPosition: 'left center' }}
      />
    </div>
  );
}
