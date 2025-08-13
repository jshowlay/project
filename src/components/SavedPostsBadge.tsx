'use client';
import { useEffect, useState } from 'react';

export default function SavedPostsBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      setCount(Array.isArray(s) ? s.length : 0);
    } catch {}
    
    const onStorage = () => {
      try {
        const s = JSON.parse(localStorage.getItem('savedPosts') || '[]');
        setCount(Array.isArray(s) ? s.length : 0);
      } catch {}
    };
    
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-gold text-black font-semibold">
      {count}
    </span>
  );
}
