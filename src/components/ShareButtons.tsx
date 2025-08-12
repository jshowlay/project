'use client';
import { useMemo, useState } from 'react';

type Props = {
  title: string;                 // usually the card's topic
  url?: string | null;           // external link if present
  source?: string;               // e.g., 'google_trends', 'reddit'
  tags?: string[];               // optional
};

function encode(u: string) { return encodeURIComponent(u); }
function openPopup(href: string, w = 680, h = 460) {
  const y = window.top?.outerHeight ? Math.max(0, (window.top.outerHeight - h) / 2) : 50;
  const x = window.top?.outerWidth  ? Math.max(0, (window.top.outerWidth  - w) / 2) : 50;
  window.open(href, '_blank', `popup=yes,width=${w},height=${h},left=${x},top=${y}`);
}

function appendUTM(rawUrl: string, source: string) {
  try {
    const u = new URL(rawUrl);
    u.searchParams.set('utm_source', 'trenderai');
    u.searchParams.set('utm_medium', 'share_card');
    if (source) u.searchParams.set('utm_content', source);
    return u.toString();
  } catch {
    return rawUrl;
  }
}

export default function ShareButtons({ title, url, source='trender', tags=[] }: Props) {
  const [copied, setCopied] = useState(false);

  // Pick the best URL to share:
  // 1) card's external url (with UTM), else
  // 2) current page URL deep-linked with ?q=<title>
  const shareUrl = useMemo(() => {
    const fallback = (() => {
      try {
        const u = new URL(window.location.href);
        // make a simple deep-link that people can open and see context
        u.searchParams.set('q', title);
        return u.toString();
      } catch {
        return window.location?.href || '';
      }
    })();
    const base = url && url.trim().length > 0 ? url : fallback;
    return appendUTM(base, source);
  }, [url, title, source]);

  const text = useMemo(() => {
    const tagStr = tags?.slice(0,3).map(t=>t.replace(/\s+/g,'')).map(t=>t.startsWith('#')?t:'#'+t).join(' ');
    return `${title}${tagStr ? ' ' + tagStr : ''}`;
  }, [title, tags]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(()=>setCopied(false), 1200);
    } catch {}
  }

  async function webShare() {
    if (navigator.share) {
      try { await navigator.share({ title, text, url: shareUrl }); return; } catch {}
    }
    copyLink();
  }

  // minimal inline styles (dark UI + accent on hover)
  const baseBtn: React.CSSProperties = {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:32, height:32, borderRadius:999, border:'1px solid #222',
    background:'#111', color:'var(--accent)', cursor:'pointer'
  };
  const rowStyle: React.CSSProperties = { display:'flex', gap:8, alignItems:'center' };

  return (
    <div className="share-buttons" style={rowStyle} aria-label="Share">
      {/* X / Twitter */}
      <button
        aria-label="Share on X"
        title="Share on X"
        style={baseBtn}
        onClick={() => {
          const href = `https://twitter.com/intent/tweet?text=${encode(text)}&url=${encode(shareUrl)}`;
          openPopup(href);
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2H21.5l-7.543 8.6L22.5 22h-6.27l-4.902-6.087L5.7 22H2.44l8.06-9.19L1.5 2h6.41l4.43 5.59L18.244 2Zm-1.097 18h1.63L7.92 4H6.18l10.967 16Z"/>
        </svg>
      </button>

      {/* LinkedIn */}
      <button
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
        style={baseBtn}
        onClick={() => {
          const href = `https://www.linkedin.com/sharing/share-offsite/?url=${encode(shareUrl)}`;
          openPopup(href);
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M6.94 6.5A2.44 2.44 0 1 1 4.5 4.06 2.44 2.44 0 0 1 6.94 6.5ZM4.75 8.75h4.38v10.5H4.75Zm7.25 0h4.18v1.44h.06a4.59 4.59 0 0 1 4.13-2.26c4.42 0 5.24 2.91 5.24 6.7v4.62H21.3v-4.1c0-1-.02-2.28-1.39-2.28s-1.6 1.09-1.6 2.21v4.17h-4.38Z"/>
        </svg>
      </button>

      {/* Facebook */}
      <button
        aria-label="Share on Facebook"
        title="Share on Facebook"
        style={baseBtn}
        onClick={() => {
          const href = `https://www.facebook.com/sharer/sharer.php?u=${encode(shareUrl)}`;
          openPopup(href);
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M13 22v-8h3l1-4h-4V7.5c0-1.16.32-1.95 2-1.95H17V2.14C16.65 2.1 15.56 2 14.31 2 11.64 2 10 3.66 10 6.7V10H7v4h3v8h3Z"/>
        </svg>
      </button>

      {/* Reddit */}
      <button
        aria-label="Share on Reddit"
        title="Share on Reddit"
        style={baseBtn}
        onClick={() => {
          const href = `https://www.reddit.com/submit?url=${encode(shareUrl)}&title=${encode(title)}`;
          openPopup(href);
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M22 12a3 3 0 0 0-5.11-2.09 8.87 8.87 0 0 0-4.78-1.41l.79-3.72 2.62.56a1.75 1.75 0 1 0 .22-1.06l-3.18-.68a.75.75 0 0 0-.88.56l-.98 4.64A8.95 8.95 0 0 0 6.9 10 3 3 0 1 0 4 13.5a5.93 5.93 0 0 0 2.86 3.94c1.54.9 3.58 1.41 5.64 1.41s4.1-.51 5.64-1.41A5.93 5.93 0 0 0 20 13.5 3 3 0 0 0 22 12Zm-11.5 1a1.5 1.5 0 1 1-1.49-1.5A1.5 1.5 0 0 1 10.5 13Zm6.49-1.5a1.5 1.5 0 1 1-1.49 1.5 1.5 1.5 0 0 1 1.49-1.5ZM12.5 18c-1.9 0-3.57-.6-4.5-1.53a.5.5 0 0 1 .71-.7c.72.72 2.13 1.23 3.79 1.23s3.07-.51 3.79-1.23a.5.5 0 1 1 .71.7C16.07 17.4 14.4 18 12.5 18Z"/>
        </svg>
      </button>

      {/* Copy / Web Share */}
      <button
        aria-label="Copy share link"
        title={typeof navigator !== 'undefined' && 'share' in navigator ? 'Share' : 'Copy link'}
        style={baseBtn}
        onClick={() => {
          if (typeof navigator !== 'undefined' && 'share' in navigator) webShare();
          else copyLink();
        }}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M9 16.17 4.83 12l-1.41 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M3.9 12a4.1 4.1 0 0 1 4.1-4.1h3v2h-3A2.1 2.1 0 0 0 5.9 12a2.1 2.1 0 0 0 2.1 2.1h3v2h-3A4.1 4.1 0 0 1 3.9 12Zm6-1h4.2v2H9.9v-2ZM16 7h-3V5h3A4.1 4.1 0 0 1 20.1 9a4.1 4.1 0 0 1-4.1 4.1h-3v-2h3A2.1 2.1 0 0 0 18.1 9 2.1 2.1 0 0 0 16 7Z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
