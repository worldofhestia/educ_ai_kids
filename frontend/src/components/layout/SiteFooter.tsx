import Link from 'next/link';
import { Icon } from './Icon';

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--color-outline-variant)]/20 bg-[color:var(--color-surface-container-low)] mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="EducAIKids">
              🎓
            </span>
            <span className="text-xl font-headline font-semibold tracking-tighter text-hestia-brand">
              EducAIKids
            </span>
          </div>
          <p className="text-sm text-[color:var(--color-on-surface-variant)] max-w-md leading-relaxed">
            L&apos;écosystème pédagogique qui transforme vos idées en vidéos animées pour
            les enfants, grâce à l&apos;intelligence artificielle.
          </p>
        </div>

        <div>
          <h5 className="font-headline font-semibold text-sm uppercase tracking-widest text-[color:var(--color-on-surface-variant)] mb-4">
            Produit
          </h5>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-hestia-brand transition-colors">
                Découvrir
              </Link>
            </li>
            <li>
              <Link href="/utiliser" className="hover:text-hestia-brand transition-colors">
                Utiliser
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-headline font-semibold text-sm uppercase tracking-widest text-[color:var(--color-on-surface-variant)] mb-4">
            Contact
          </h5>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Icon name="mail" className="text-sm" />
              <span>hello@educaikids.app</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--color-outline-variant)]/15">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[color:var(--color-on-surface-variant)]">
          <p>© {new Date().getFullYear()} EducAIKids — Propulsé par Hestia Design System.</p>
          <p>Généré avec ❤️ et IA.</p>
        </div>
      </div>
    </footer>
  );
}
