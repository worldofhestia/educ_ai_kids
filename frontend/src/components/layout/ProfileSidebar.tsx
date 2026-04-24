'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface EcosystemItem {
  icon: string;
  label: string;
  colorClass: string;
}

const ECOSYSTEM: EcosystemItem[] = [
  { icon: 'movie', label: 'Vidéo', colorClass: 'bg-primary/10 text-primary' },
  { icon: 'auto_stories', label: 'Stories', colorClass: 'bg-[color:var(--color-hestia-gold)]/10 text-[color:var(--color-hestia-gold)]' },
  { icon: 'quiz', label: 'Quiz', colorClass: 'bg-[color:var(--color-hestia-sage-dark)]/10 text-[color:var(--color-hestia-sage-dark)]' },
  { icon: 'school', label: 'Leçons', colorClass: 'bg-[color:var(--color-primary-container)]/10 text-[color:var(--color-primary-container)]' },
];

interface ProfileSidebarProps {
  userName: string;
  userAvatarUrl?: string;
  onClose: () => void;
}

/**
 * Panneau flottant du profil utilisateur.
 * Reprend le motif "Écosystème" des templates Stitch Hestia.
 */
export function ProfileSidebar({ userName, userAvatarUrl, onClose }: ProfileSidebarProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute top-14 right-0 w-80 bg-card rounded-3xl editorial-shadow z-50 border border-[color:var(--color-outline-variant)]/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      role="dialog"
      aria-label="Menu profil"
    >
      {/* Header */}
      <div className="p-6 border-b border-[color:var(--color-outline-variant)]/20 flex justify-between items-center bg-[color:var(--color-surface-container-low)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[color:var(--color-surface-container-high)] flex items-center justify-center">
            {userAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <Icon name="person" className="text-[color:var(--color-on-surface-variant)]" size={28} />
            )}
          </div>
          <div>
            <h4 className="font-headline font-semibold text-foreground">{userName}</h4>
            <p className="text-xs text-[color:var(--color-on-surface-variant)] font-body">Membre Premium</p>
          </div>
        </div>
        <button
          type="button"
          className="text-[color:var(--color-on-surface-variant)] hover:text-primary transition-colors p-2 rounded-full hover:bg-[color:var(--color-surface-variant)]"
          aria-label="Réglages"
        >
          <Icon name="settings" />
        </button>
      </div>

      {/* Écosystème EducAIKids */}
      <div className="p-6">
        <h5 className="font-headline font-medium text-sm text-[color:var(--color-on-surface-variant)] mb-6 uppercase tracking-widest text-center">
          Écosystème EducAIKids
        </h5>
        <div className="grid grid-cols-4 gap-4">
          {ECOSYSTEM.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${item.colorClass} flex items-center justify-center transition-transform group-hover:scale-110`}
              >
                <Icon name={item.icon} />
              </div>
              <span className="text-[10px] font-body font-medium text-center text-foreground">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Déconnexion */}
      <div className="p-4 border-t border-[color:var(--color-outline-variant)]/20 bg-[color:var(--color-surface-container-low)] text-center">
        <button
          type="button"
          className="text-[color:var(--destructive)] font-headline font-semibold text-sm hover:underline"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}
