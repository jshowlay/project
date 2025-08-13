'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/nav.config';
import NavIcon from './NavIcon';

export default function MobileNavBar() {
  const pathname = usePathname();
  const items = NAV.filter(n => !n.hidden).slice(0, 4); // show 4 max on bottom bar

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1b1b1b] bg-[#0f0f0f] sm:hidden">
      <div className="grid grid-cols-4">
        {items.map(n => {
          const active = pathname === n.path || (n.path !== '/' && pathname?.startsWith(n.path));
          return (
            <Link
              key={n.path}
              href={n.path}
              className="flex flex-col items-center justify-center gap-1 py-2"
              style={{ color: active ? 'var(--accent)' : '#ddd' }}
            >
              <NavIcon name={n.icon} />
              <span className="text-[11px]">{n.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
