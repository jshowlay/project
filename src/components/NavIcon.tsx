'use client';
import { LayoutDashboard, Radio, Bookmark, BellRing, Plug } from 'lucide-react';

export default function NavIcon({ name, className }: { name: string; className?: string }) {
  const props = { className: className ?? 'w-4 h-4' };
  switch (name) {
    case 'layout-dashboard': return <LayoutDashboard {...props} />;
    case 'radio':            return <Radio {...props} />;
    case 'bookmark':         return <Bookmark {...props} />;
    case 'bell-ring':        return <BellRing {...props} />;
    case 'plug':             return <Plug {...props} />;
    default:                 return null;
  }
}
