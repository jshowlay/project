'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/nav.config';
import NavIcon from './NavIcon';
import { useHotkeys } from './useHotkeys';
import SavedPostsBadge from './SavedPostsBadge';

export default function PrimaryNav() {
  useHotkeys();
  const pathname = usePathname();
  const visible = NAV.filter(n => !n.hidden);

  return (
    <div className="flex items-center gap-2">
      {visible.map(n => {
        const active = pathname === n.path || (n.path !== '/' && pathname?.startsWith(n.path));
        return (
          <Link
            key={n.path}
            href={n.path}
            className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${active ? 'btn-accent' : 'hover:bg-white/10'}`}
            style={!active ? { background:'transparent', color:'#fff', border:'1px solid #333' } : {}}
          >
            <NavIcon name={n.icon} />
            <span>{n.label}</span>
            {n.path === '/saved' && <SavedPostsBadge />}
          </Link>
        );
      })}
    </div>
  );
}
