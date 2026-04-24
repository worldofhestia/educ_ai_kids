import { Icon } from '@/components/layout/Icon';

interface TipCard {
  icon: string;
  title: string;
  body: string;
  color: 'primary' | 'sage' | 'gold';
}

const TIPS: TipCard[] = [
  {
    icon: 'tips_and_updates',
    title: 'Soyez spécifique',
    body: "Plus votre sujet est précis, plus la vidéo sera pertinente. Ajoutez une tranche d'âge si possible.",
    color: 'primary',
  },
  {
    icon: 'history_edu',
    title: 'Contextualisez',
    body: "Indiquez l'angle pédagogique : démonstration, récit, question/réponse…",
    color: 'sage',
  },
  {
    icon: 'magic_button',
    title: 'Restez concret',
    body: 'Préférez « comment… » ou « pourquoi… » plutôt que des sujets abstraits trop larges.',
    color: 'gold',
  },
];

const COLOR_MAP = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
  },
  sage: {
    bg: 'bg-[color:var(--color-hestia-sage)]/15',
    text: 'text-[color:var(--color-hestia-sage-dark)]',
  },
  gold: {
    bg: 'bg-[color:var(--color-hestia-gold-soft)]',
    text: 'text-[color:var(--color-hestia-gold-on)]',
  },
} as const;

/**
 * Sidebar conseils pour la page /utiliser.
 * Reprend le style sidebar des templates Stitch (surface-container-low + padding généreux).
 */
export function UtiliserSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 bg-[color:var(--color-surface-container-low)] rounded-[2rem] p-6 editorial-shadow border border-[color:var(--color-outline-variant)]/20 self-start sticky top-28">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-hestia-gradient text-primary-foreground flex items-center justify-center">
          <Icon name="auto_awesome" filled size={22} />
        </div>
        <div>
          <h3 className="font-headline font-semibold text-lg leading-tight">
            Conseils Hestia
          </h3>
          <p className="text-xs text-[color:var(--color-on-surface-variant)]">
            Pour des vidéos percutantes
          </p>
        </div>
      </div>

      <ul className="space-y-4">
        {TIPS.map((tip) => {
          const c = COLOR_MAP[tip.color];
          return (
            <li
              key={tip.title}
              className="bg-card rounded-2xl p-4 border border-[color:var(--color-outline-variant)]/20"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
                  <Icon name={tip.icon} filled size={18} />
                </div>
                <div>
                  <h4 className="font-headline font-semibold text-sm mb-1">
                    {tip.title}
                  </h4>
                  <p className="text-xs text-[color:var(--color-on-surface-variant)] leading-relaxed">
                    {tip.body}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Note bas de sidebar */}
      <div className="mt-6 pt-6 border-t border-[color:var(--color-outline-variant)]/30">
        <p className="text-xs text-[color:var(--color-on-surface-variant)] text-center font-body uppercase tracking-widest flex items-center justify-center gap-1">
          <Icon name="info" size={14} />
          Besoin d&apos;aide ? Ouvrez Hestia
        </p>
      </div>
    </aside>
  );
}
