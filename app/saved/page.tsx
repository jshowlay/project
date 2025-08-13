'use client';
import { useEffect, useState } from 'react';
import PrimaryNav from '@/components/PrimaryNav';
import MobileNavBar from '@/components/MobileNavBar';
import CommandPalette from '@/components/CommandPalette';
import StickyHeader from '@/components/StickyHeader';

type SavedPost = {
  trendId: string;
  title: string;
  caption: string;
  platform: 'ig' | 'tiktok' | 'x' | 'li';
  hashtags: string[];
  ts: number;
};

export default function SavedPage() {
  const [items, setItems] = useState<SavedPost[]>([]);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      setItems(Array.isArray(s) ? s : []);
    } catch {}
  }, []);

  const remove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    localStorage.setItem('savedPosts', JSON.stringify(newItems));
    setItems(newItems);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ background:'#000', color:'#fff' }}>
      <div className="mx-auto max-w-6xl p-6">
        <StickyHeader>
          <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6 sm:py-3">
            <PrimaryNav />
          </div>
        </StickyHeader>

        <CommandPalette />
        <MobileNavBar />
        <div className="h-12 sm:hidden" />

        <div className="flex items-center justify-between">
          <div className="text-2xl font-extrabold">Your Saved Posts</div>
          <a href="/" className="px-3 py-2 rounded-xl border border-border hover:bg-neutral-900 text-sm">← Back</a>
        </div>

        {items.length === 0 ? (
          <div className="text-neutral-400 mt-3">No saved posts yet.</div>
        ) : (
          <div className="grid gap-4 mt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs px-2 py-1 border border-neutral-700 rounded text-neutral-400 inline-block">
                  {p.platform.toUpperCase()}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {new Date(p.ts).toLocaleString()}
                </div>
                <div className="font-semibold mt-2 whitespace-pre-wrap">{p.caption}</div>
                <div className="flex gap-2 mt-3">
                  <button 
                    className="px-3 py-2 rounded-xl bg-gold text-black font-semibold text-sm"
                    onClick={() => copyText(p.caption)}
                  >
                    Copy
                  </button>
                  <button 
                    className="px-3 py-2 rounded-xl border border-border text-neutral-300 text-sm"
                    onClick={() => remove(i)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-neutral-400 mt-3">Saved locally in your browser.</div>
      </div>
    </div>
  );
}
