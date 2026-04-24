import Link from 'next/link';
import { Icon } from '@/components/layout/Icon';

const HIGHLIGHTS = [
  { icon: 'description', label: 'Script automatique' },
  { icon: 'palette', label: 'Images cartoon' },
  { icon: 'mic', label: 'Voix off naturelle' },
  { icon: 'music_note', label: 'Musique de fond' },
];

/**
 * Hero page d'accueil — style "Tactile Sanctuary".
 * Typographie éditoriale, asymétrie douce, dégradé organique.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Décorations organiques (floues, subtiles) */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-20 w-[420px] h-[420px] bg-primary/10 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-40 -left-24 w-[360px] h-[360px] bg-[color:var(--color-hestia-sage)]/20 rounded-full blur-3xl"
      />

      <div className="relative max-w-screen-2xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
          {/* Colonne texte */}
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-[color:var(--color-outline-variant)]/30 text-xs font-body uppercase tracking-widest text-[color:var(--color-on-surface-variant)] editorial-shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Propulsé par Hestia Orchestrator
            </span>

            <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
              Transformez une idée
              <br />
              en{' '}
              <span className="bg-hestia-gradient bg-clip-text text-transparent">
                vidéo éducative
              </span>
              <br />
              pour vos enfants.
            </h1>

            <p className="text-lg md:text-xl text-[color:var(--color-on-surface-variant)] leading-relaxed max-w-xl">
              EducAIKids orchestre une chaîne d&apos;agents IA pour produire, en
              quelques minutes, une vidéo animée complète : script pédagogique,
              illustrations cartoon, voix off et musique d&apos;ambiance.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/utiliser"
                className="bg-hestia-gradient text-primary-foreground px-8 py-5 rounded-full font-headline font-bold text-base inline-flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 editorial-shadow"
              >
                Commencer maintenant
                <Icon name="arrow_forward" size={20} />
              </Link>
              <a
                href="#ecosysteme"
                className="text-primary font-headline font-bold text-base px-6 py-5 hover:bg-primary/5 rounded-full transition-all inline-flex items-center justify-center gap-2"
              >
                Comment ça marche
                <Icon name="arrow_outward" size={18} />
              </a>
            </div>

            {/* Points clés */}
            <div className="flex flex-wrap gap-2 pt-4">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-[color:var(--color-outline-variant)]/30 text-sm font-body"
                >
                  <Icon name={h.icon} className="text-primary" size={18} />
                  <span>{h.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne visuelle — mosaïque asymétrique */}
          <div className="relative min-h-[480px] hidden lg:block">
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-4">
              {/* Card vidéo principale */}
              <div className="col-span-4 row-span-4 bg-card rounded-[2rem] editorial-shadow p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--color-on-surface-variant)] font-body font-bold">
                  <span className="w-2 h-2 rounded-full bg-[color:var(--destructive)] animate-pulse" />
                  En cours de génération
                </div>
                <div className="flex-1 rounded-2xl bg-hestia-gradient-soft flex items-center justify-center relative overflow-hidden">
                  <Icon name="movie" className="text-white opacity-80" size={72} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-3/4 bg-[color:var(--color-surface-variant)] rounded-full" />
                  <div className="h-2 w-1/2 bg-[color:var(--color-surface-variant)] rounded-full" />
                </div>
              </div>

              {/* Mini card script */}
              <div className="col-span-2 row-span-3 col-start-5 bg-[color:var(--color-secondary)] rounded-[1.5rem] p-4 flex flex-col gap-3 editorial-shadow">
                <Icon
                  name="description"
                  className="text-[color:var(--color-hestia-sage-dark)]"
                  size={28}
                />
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-white/50 rounded-full" />
                  <div className="h-1.5 w-3/4 bg-white/50 rounded-full" />
                  <div className="h-1.5 w-2/3 bg-white/50 rounded-full" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-headline font-bold text-[color:var(--color-hestia-sage-dark)] mt-auto">
                  Script
                </span>
              </div>

              {/* Mini card musique */}
              <div className="col-span-2 row-span-3 col-start-5 row-start-4 bg-[color:var(--color-hestia-gold-soft)] rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-2 editorial-shadow">
                <Icon
                  name="graphic_eq"
                  className="text-[color:var(--color-hestia-gold)]"
                  size={36}
                />
                <span className="text-[10px] uppercase tracking-widest font-headline font-bold text-[color:var(--color-hestia-gold-on)]">
                  Musique
                </span>
              </div>

              {/* Mini card voix (bas gauche) */}
              <div className="col-span-3 row-span-2 row-start-5 bg-primary text-primary-foreground rounded-[1.5rem] p-4 flex items-center gap-3 editorial-shadow">
                <Icon name="mic" size={28} />
                <div>
                  <p className="font-headline font-bold text-sm leading-tight">
                    Voix off
                  </p>
                  <p className="text-xs opacity-80">Naturelle & expressive</p>
                </div>
              </div>

              {/* Mini card rocket (bas milieu) */}
              <div className="col-span-1 row-span-2 col-start-4 row-start-5 bg-card rounded-[1.5rem] flex items-center justify-center editorial-shadow">
                <Icon name="rocket_launch" className="text-primary" size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
