'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [boxW, setBoxW] = useState<number>(0);
  const [useProxy, setUseProxy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const triedDirect = useRef(false);

  // Measure the rendered width of the card image container
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w && w !== boxW) setBoxW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build the proxy URL sized for element width × DPR (with a sane cap)
  const imgUrl = useMemo(() => {
    const dpr = (typeof window !== 'undefined' ? Math.min(Math.max(window.devicePixelRatio || 1, 1), 3) : 1);
    const wantedW = Math.min(Math.max(boxW, 320) * dpr, maxW);
    const wParam = Math.max( Math.round(wantedW), 320 );
    if (!useProxy) return remoteUrl;
    return `/api/img?u=${encodeURIComponent(remoteUrl)}&w=${wParam}&dpr=${dpr}&q=${Math.round(quality)}`;
  }, [remoteUrl, useProxy, boxW, maxW, quality]);

  // Reset state when URL changes
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    triedDirect.current = false;
  }, [imgUrl, remoteUrl, useProxy]);

  return (
    <div
      ref={wrapRef}
      className="mb-3 overflow-hidden rounded-xl relative"
      style={{ aspectRatio: ratio ?? 'var(--card-image-ratio)', background:'#0e0e0e', border:'1px solid #1b1b1b' }}
    >
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse" style={{
          filter:'blur(12px)',
          background:'linear-gradient(135deg, #0f0f0f 0%, #161616 50%, #0f0f0f 100%)'
        }} />
      )}

      {!failed && (
        <img
          src={imgUrl}
          alt={alt}
          loading="lazy"
          fetchPriority="low"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (useProxy) { setUseProxy(false); return; }         // fall back to direct
            if (!triedDirect.current) { triedDirect.current = true; return; }
            setFailed(true);
          }}
          style={{
            width:'100%', height:'100%', objectFit:'cover', display:'block',
            opacity: loaded ? 1 : 0, transition:'opacity .25s ease'
          }}
        />
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color:'#aaa' }}>
          image unavailable
        </div>
      )}
    </div>
  );
}
