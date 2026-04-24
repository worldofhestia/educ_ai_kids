'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { ProfileSidebar } from './ProfileSidebar';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Active si le pathname commence par cette route */
  matchPrefix: string;
}

/**
 * Les 2 sections principales exigées par le produit.
 * "Découvrir" est volontairement toujours présente.
 */
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Découvrir', icon: 'explore', matchPrefix: '/' },
  { href: '/utiliser', label: 'Utiliser', icon: 'auto_videocam', matchPrefix: '/utiliser' },
];

interface TopAppBarProps {
  credits?: number;
  userName?: string;
  userAvatarUrl?: string;
}

export function TopAppBar({
  credits = 250,
  userName = 'Alexandre',
  userAvatarUrl,
}: TopAppBarProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isActive = (item: NavItem) => {
    if (item.matchPrefix === '/') return pathname === '/';
    return pathname.startsWith(item.matchPrefix);
  };

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="flex justify-between items-center w-full px-4 md:px-8 py-4 md:py-6 max-w-screen-2xl mx-auto">
        {/* Logo / brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl md:text-3xl" role="img" aria-label="EducAIKids">
            🎓
          </span>
          <span className="text-xl md:text-2xl font-headline font-semibold tracking-tighter text-hestia-brand group-hover:text-hestia-brand-hover transition-colors">
            EducAIKids
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'font-headline transition-colors pb-1',
                  active
                    ? 'text-hestia-sage font-bold border-b-2 border-hestia-sage'
                    : 'text-hestia-neutral font-medium hover:text-hestia-brand'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions droite */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Crédits */}
          <div className="hidden sm:flex items-center gap-2 bg-[color:var(--color-hestia-gold-soft)] px-4 py-2 rounded-full">
            <Icon name="payments" className="text-[color:var(--color-hestia-gold)] text-sm" />
            <span className="text-[color:var(--color-hestia-gold-on)] font-headline font-bold text-sm">
              {credits}
            </span>
          </div>

          {/* Avatar + menu profil */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((v) => !v)}
              className="w-10 h-10 rounded-full overflow-hidden bg-[color:var(--color-surface-container-high)] cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all flex items-center justify-center"
              aria-label="Ouvrir le menu profil"
              aria-expanded={isProfileOpen}
            >
              {userAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userAvatarUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="person" className="text-[color:var(--color-on-surface-variant)]" />
              )}
            </button>

            {isProfileOpen && (
              <ProfileSidebar
                userName={userName}
                userAvatarUrl={userAvatarUrl}
                onClose={() => setIsProfileOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
