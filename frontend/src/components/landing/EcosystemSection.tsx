import { Icon } from '@/components/layout/Icon';

interface Step {
  num: number;
  title: string;
  description: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    num: 1,
    title: 'Vous posez votre question',
    description:
      "Décrivez simplement le sujet que vous voulez expliquer aux enfants, en langage naturel.",
    icon: 'forum',
  },
  {
    num: 2,
    title: 'Hestia orchestre les experts IA',
    description:
      "Script, illustrations, voix off, musique — chaque agent est orchestré pour travailler en harmonie.",
    icon: 'hub',
  },
  {
    num: 3,
    title: 'Votre vidéo est prête',
    description:
      'Téléchargez, partagez ou relancez une variation. Tout est produit en quelques minutes.',
    icon: 'check_circle',
  },
];

/**
 * Section "La puissance de l'écosystème" — reprend fidèlement
 * le motif des templates Stitch Hestia (3 étapes + visualisation).
 */
export function EcosystemSection() {
  return (
    <section id="ecosysteme" className="max-w-screen-2xl mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="bg-[color:var(--color-surface-container)] rounded-[2rem] md:rounded-[4rem] p-8 md:p-16 relative overflow-hidden">
        {/* Formes organiques de fond */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-[color:var(--color-hestia-sage)]/10 rounded-full blur-3xl"
        />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Colonne texte + étapes */}
          <div className="space-y-8">
            <div>
              <span className="inline-block text-xs font-body uppercase tracking-widest font-bold text-primary mb-3">
                L&apos;écosystème pédagogique
              </span>
              <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                Une chaîne d&apos;agents IA au service de l&apos;apprentissage.
              </h2>
              <p className="mt-5 text-lg text-[color:var(--color-on-surface-variant)] leading-relaxed">
                Ne vous contentez pas d&apos;une simple réponse : Hestia orchestre
                une chaîne de valeur complète pour transformer vos idées
                pédagogiques en expériences vidéo animées prêtes à diffuser.
              </p>
            </div>

            {/* Étapes */}
            <ol className="space-y-6">
              {STEPS.map((step, index) => (
                <li key={step.num} className="relative">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-hestia-gradient text-primary-foreground flex items-center justify-center font-headline font-bold text-sm editorial-shadow">
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-headline font-semibold text-lg mb-1 flex items-center gap-2">
                        <Icon name={step.icon} className="text-primary" size={20} />
                        {step.title}
                      </h4>
                      <p className="text-[color:var(--color-on-surface-variant)] text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {/* Connecteur pointillé entre étapes */}
                  {index < STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="ml-5 h-8 border-l-2 border-dotted border-[color:var(--color-outline-variant)]"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Colonne visuelle */}
          <div className="relative bg-[color:var(--color-surface-container-highest)] rounded-[2rem] p-6 md:p-8 editorial-shadow min-h-[420px] flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Script */}
              <div className="bg-card p-5 rounded-2xl editorial-shadow space-y-3">
                <Icon name="description" className="text-primary" size={24} />
                <div className="space-y-1.5">
                  <div className="h-2 w-3/4 bg-[color:var(--color-surface-variant)] rounded-full" />
                  <div className="h-2 w-1/2 bg-[color:var(--color-surface-variant)] rounded-full" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-headline font-bold text-[color:var(--color-on-surface-variant)]">
                  Script
                </span>
              </div>

              {/* Vidéo */}
              <div className="bg-card p-5 rounded-2xl editorial-shadow space-y-3 translate-y-6">
                <Icon
                  name="movie"
                  className="text-[color:var(--color-hestia-sage-dark)]"
                  size={24}
                />
                <div className="aspect-video bg-[color:var(--color-surface-variant)] rounded-xl" />
                <span className="text-[10px] uppercase tracking-widest font-headline font-bold text-[color:var(--color-on-surface-variant)]">
                  Vidéo
                </span>
              </div>

              {/* Images */}
              <div className="bg-card p-5 rounded-2xl editorial-shadow space-y-3 -translate-y-4">
                <Icon
                  name="palette"
                  className="text-[color:var(--color-hestia-gold)]"
                  size={24}
                />
                <div className="h-14 w-14 mx-auto bg-[color:var(--color-surface-variant)] rounded-full" />
                <span className="text-[10px] uppercase tracking-widest font-headline font-bold text-[color:var(--color-on-surface-variant)] block text-center">
                  Images
                </span>
              </div>

              {/* Prêt à agir */}
              <div className="bg-hestia-gradient text-primary-foreground p-5 rounded-2xl editorial-shadow space-y-3 flex flex-col items-center justify-center">
                <Icon name="rocket_launch" size={36} />
                <span className="text-xs font-headline font-bold uppercase tracking-widest text-center">
                  Prêt à diffuser
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
