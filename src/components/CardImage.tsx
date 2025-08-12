'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  remoteUrl: string;          // original remote URL (http/https)
  alt: string;
  ratio?: string;             // CSS aspect ratio, e.g. '16/9' | '3/2'
  // Optional: give a hint if your grid makes cards wider or narrower than default
  widthHint?: number;         // approximate CSS px width of the image on desktop (e.g., 520)
};

export default function CardImage({ remoteUrl, alt, ratio='16/9', widthHint }: Props) {
  const [useProxy, setUseProxy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const triedDirect = useRef(false);

  // Breakpoints we'll serve (browser picks best by sizes)
  const widths = useMemo(() => [360, 540, 720, 960, 1200], []);
  const sizes = useMemo(() => {
    // Two-column from sm: ~50vw; cap around 520px desktop
    const desktop = Math.max(320, Math.min(widthHint ?? 520, 640));
    return `(min-width: 1280px) ${desktop}px, (min-width: 640px) 50vw, 100vw`;
  }, [widthHint]);

  const src = useMemo(() => {
    if (!useProxy) return remoteUrl;
    // default to mid width as base src to avoid massive first load
    const baseW = 720;
    return `/api/img?u=${encodeURIComponent(remoteUrl)}&w=${baseW}&q=82`;
  }, [remoteUrl, useProxy]);

  const srcSet = useMemo(() => {
    if (!useProxy) return undefined;
    const acceptAvif = true; // let server pick via Accept; no need to force fmt
    return widths.map(w => `/api/img?u=${encodeURIComponent(remoteUrl)}&w=${w}&q=82 ${w}w`).join(', ');
  }, [remoteUrl, widths, useProxy]);

  useEffect(() => { setLoaded(false); setFailed(false); triedDirect.current = false; }, [remoteUrl, useProxy]);

  return (
    <div className="mb-3 overflow-hidden rounded-xl relative"
         style={{ aspectRatio: ratio, background:'#0e0e0e', border:'1px solid #1b1b1b' }}>
      {/* Blur/skeleton */}
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse" style={{
          filter:'blur(12px)',
          background:'linear-gradient(135deg, #0f0f0f 0%, #161616 50%, #0f0f0f 100%)'
        }} />
      )}
      {/* Image */}
      {!failed && (
        <img
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (useProxy) {
              // Fall back to direct remote if proxy (or sharp) fails
              setUseProxy(false);
              return;
            }
            if (!triedDirect.current) {
              triedDirect.current = true;
              // last ditch: try remote once again (no srcset)
              setUseProxy(false);
              return;
            }
            setFailed(true);
          }}
          style={{
            width:'100%', height:'100%', objectFit:'cover', display:'block',
            opacity: loaded ? 1 : 0, transition:'opacity .25s ease'
          }}
        />
      )}
      {/* Failure state */}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color:'#aaa' }}>
          image unavailable
        </div>
      )}
    </div>
  );
}
