import { Icon } from '@/components/layout/Icon';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: 'primary' | 'sage' | 'gold';
}

const FEATURES: Feature[] = [
  {
    icon: 'psychology',
    title: 'Pédagogie sur mesure',
    description:
      "Adapté aux enfants : niveau de langue, rythme, vocabulaire. Du 3 ans au collégien.",
    color: 'primary',
  },
  {
    icon: 'auto_awesome',
    title: 'Animation cartoon',
    description:
      'Illustrations colorées, bienveillantes et variées, générées automatiquement pour chaque scène.',
    color: 'sage',
  },
  {
    icon: 'record_voice_over',
    title: 'Voix chaleureuse',
    description:
      'Synthèse vocale naturelle et expressive, calibrée pour capter l’attention des plus jeunes.',
    color: 'gold',
  },
  {
    icon: 'speed',
    title: 'Ultra rapide',
    description:
      'Script, images, voix, musique et montage réalisés en 2 à 5 minutes, sans intervention.',
    color: 'primary',
  },
  {
    icon: 'auto_fix_high',
    title: 'Zéro montage',
    description:
      'Assemblage synchronisé automatique : la vidéo finale est prête à partager immédiatement.',
    color: 'sage',
  },
  {
    icon: 'favorite',
    title: 'Bienveillant',
    description:
      "Contenus vérifiés, sans stéréotypes, pensés pour éveiller la curiosité en toute sécurité.",
    color: 'gold',
  },
];

const COLOR_MAP = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  sage: {
    bg: 'bg-[color:var(--color-hestia-sage)]/10',
    text: 'text-[color:var(--color-hestia-sage-dark)]',
    border: 'border-[color:var(--color-hestia-sage)]/20',
  },
  gold: {
    bg: 'bg-[color:var(--color-hestia-gold-soft)]/60',
    text: 'text-[color:var(--color-hestia-gold)]',
    border: 'border-[color:var(--color-hestia-gold-soft)]',
  },
} as const;

/**
 * Section "Features" éditoriale.
 * Grille de cartes à fond surface-container-lowest (blanc pur) pour le "lift" typique Hestia.
 */
export function FeaturesSection() {
  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="max-w-3xl mb-12 md:mb-16">
        <span className="inline-block text-xs font-body uppercase tracking-widest font-bold text-primary mb-3">
          Ce qui nous distingue
        </span>
        <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
          Conçu pour les enfants,
          <br />
          <span className="text-[color:var(--color-on-surface-variant)]">
            pensé pour les parents et enseignants.
          </span>
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const c = COLOR_MAP[f.color];
          return (
            <article
              key={f.title}
              className="bg-card p-6 rounded-3xl editorial-shadow hover:-translate-y-1 transition-transform duration-300 border border-[color:var(--color-outline-variant)]/20"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center mb-4 border ${c.border}`}
              >
                <Icon name={f.icon} filled />
              </div>
              <h3 className="font-headline font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-[color:var(--color-on-surface-variant)] leading-relaxed">
                {f.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
