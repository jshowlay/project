'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/nav.config';
import NavIcon from './NavIcon';
import { useHotkeys } from './useHotkeys';

export default function PrimaryNav() {
  useHotkeys();
  const pathname = usePathname();
  const visible = NAV.filter(n => !n.hidden);

  return (
    <nav className="w-full mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {visible.map(n => {
          const active = pathname === n.path || (n.path !== '/' && pathname?.startsWith(n.path));
          return (
            <Link
              key={n.path}
              href={n.path}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${active ? 'btn-accent' : ''}`}
              style={!active ? { background:'#111', color:'#fff', border:'1px solid #222' } : {}}
            >
              <NavIcon name={n.icon} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
