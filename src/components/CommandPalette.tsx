'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NAV } from '@/nav.config';
import NavIcon from './NavIcon';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const router = useRouter();

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener('open-cmd', openHandler as any);
    window.addEventListener('keydown', (e: any) => {
      if (e.key === 'Escape') closeHandler();
    });
    return () => window.removeEventListener('open-cmd', openHandler as any);
  }, []);

  const items = useMemo(() => {
    const list = NAV.filter(n => !n.hidden);
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter(n => n.label.toLowerCase().includes(s) || n.path.includes(s));
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4" onClick={()=>setOpen(false)}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#222] bg-[#0f0f0f] shadow-xl" onClick={(e)=>e.stopPropagation()}>
        <div className="p-3 border-b border-[#1b1b1b]">
          <input
            autoFocus
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Type to navigate… (Esc to close)"
            className="w-full bg-transparent outline-none text-base px-2 py-2"
            style={{ color:'#fff' }}
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {items.map(item => (
            <button
              key={item.path}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#141414] transition"
              onClick={()=>{ router.push(item.path); setOpen(false); }}
            >
              <span className="inline-flex w-5 justify-center"><NavIcon name={item.icon} /></span>
              <span className="flex-1">{item.label}</span>
              <span className="text-xs opacity-60">{item.hotkey}</span>
            </button>
          ))}
          {items.length === 0 && <div className="px-4 py-6 text-sm opacity-60">No matches.</div>}
        </div>
      </div>
    </div>
  );
}
