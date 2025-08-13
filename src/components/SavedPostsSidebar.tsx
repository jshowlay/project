'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type SavedPost = {
  trendId: string;
  title: string;
  caption: string;
  platform: 'ig' | 'tiktok' | 'x' | 'li';
  hashtags: string[];
  ts: number;
};

export default function SavedPostsSidebar() {
  const [saved, setSaved] = useState<SavedPost[]>([]);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      setSaved(Array.isArray(s) ? s : []);
    } catch {}
  }, []);

  const topSaved = saved.slice(0, 4);

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-neutral-200">Saved (latest)</div>
          <Link
            href="/saved"
            className="text-sm px-2 py-1 rounded-lg border border-border hover:bg-neutral-900"
          >
            View all
          </Link>
        </div>
        {topSaved.length === 0 ? (
          <div className="text-sm text-neutral-400 mt-3">
            Nothing saved yet. Generate content and hit "Save to Board".
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {topSaved.map((p, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <div className="text-[11px] px-1.5 py-0.5 inline-block border border-neutral-700 rounded text-neutral-400">
                  {p.platform.toUpperCase()}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {new Date(p.ts).toLocaleString()}
                </div>
                <div className="text-sm mt-1 line-clamp-3 whitespace-pre-wrap">
                  {p.caption}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
