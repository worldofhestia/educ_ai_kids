'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface MobileNavItem {
  href: string;
  label: string;
  icon: string;
  matchPrefix: string;
}

const ITEMS: MobileNavItem[] = [
  { href: '/', label: 'Découvrir', icon: 'explore', matchPrefix: '/' },
  { href: '/utiliser', label: 'Utiliser', icon: 'auto_videocam', matchPrefix: '/utiliser' },
  { href: '#profil', label: 'Profil', icon: 'person', matchPrefix: '#profil' },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (item: MobileNavItem) => {
    if (item.matchPrefix === '/') return pathname === '/';
    if (item.matchPrefix.startsWith('#')) return false;
    return pathname.startsWith(item.matchPrefix);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-6 pt-3 glass-nav border-t border-[color:var(--color-outline-variant)]/20 drawer-shadow rounded-t-[2rem]"
      aria-label="Navigation mobile"
    >
      {ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center px-5 py-2 transition-colors',
              active ? 'text-hestia-sage' : 'text-hestia-neutral hover:text-hestia-brand'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} filled={active} />
            <span className="font-body text-[10px] font-bold uppercase tracking-widest mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
