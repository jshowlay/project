'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NAV } from '@/nav.config';

export function useHotkeys() {
  const router = useRouter();
  const lastKeyRef = useRef<{ k: string; t: number } | null>(null);

  useEffect(() => {
    function inInput() {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || (el as any).isContentEditable;
    }

    const onKey = (e: KeyboardEvent) => {
      // Command palette
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) && !inInput()) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-cmd'));
        return;
      }

      // Focus global search on '/'
      if (e.key === '/' && !inInput()) {
        const el = document.getElementById('global-search') as HTMLInputElement | null;
        if (el) { e.preventDefault(); el.focus(); el.select?.(); }
        return;
      }

      // g <letter> sequences
      const now = Date.now();
      const last = lastKeyRef.current;
      if (e.key.toLowerCase() === 'g' && !inInput()) {
        lastKeyRef.current = { k: 'g', t: now };
        return;
      }
      if (last && last.k === 'g' && now - last.t < 800 && !inInput()) {
        const letter = e.key.toLowerCase();
        lastKeyRef.current = null;
        const target = NAV.find(n => (n.hotkey.split(' ')[1] || '') === letter && !n.hidden);
        if (target) {
          e.preventDefault();
          router.push(target.path);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
