import Link from 'next/link';
import { Icon } from '@/components/layout/Icon';

export function FinalCTA() {
  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 py-20 md:py-28 text-center">
      <div className="space-y-10 max-w-3xl mx-auto">
        <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
          Prêt à{' '}
          <span className="bg-hestia-gradient bg-clip-text text-transparent">
            enchanter
          </span>{' '}
          l&apos;apprentissage de vos enfants&nbsp;?
        </h2>

        <p className="text-lg text-[color:var(--color-on-surface-variant)] leading-relaxed">
          Lancez votre première vidéo pédagogique en moins de trois minutes.
          Sans carte bancaire, sans installation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/utiliser"
            className="bg-hestia-gradient text-primary-foreground px-10 py-5 rounded-full font-headline font-bold text-base inline-flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 editorial-shadow"
          >
            Générer ma première vidéo
            <Icon name="arrow_forward" size={20} />
          </Link>
          <Link
            href="#ecosysteme"
            className="text-primary font-headline font-bold text-base px-6 py-5 hover:bg-primary/5 rounded-full transition-all inline-flex items-center gap-2"
          >
            Revoir le fonctionnement
            <Icon name="arrow_upward" size={18} />
          </Link>
        </div>

        <p className="text-[color:var(--color-on-surface-variant)] font-body text-xs uppercase tracking-widest">
          Sans engagement • 10 crédits offerts • Compatible classe &amp; famille
        </p>
      </div>
    </section>
  );
}
