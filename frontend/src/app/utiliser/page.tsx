import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { UtiliserSidebar } from '@/components/utiliser/UtiliserSidebar';
import { UtiliserContent } from './UtiliserContent';

/**
 * Page /utiliser — l'application principale de génération vidéo.
 * Layout "Service" façon Stitch : sidebar conseils + contenu principal en carte crème.
 * Le chatbot flottant reste accessible (il peut déléguer à cette page).
 */
export default function UtiliserPage() {
  return (
    <AppShell>
      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-12 flex gap-6 lg:gap-8">
        <UtiliserSidebar />

        <section className="flex-1 flex flex-col min-w-0 gap-6 items-center">
          <header className="w-full max-w-3xl">
            <span className="inline-block text-xs font-body uppercase tracking-widest font-bold text-primary mb-3">
              Utiliser
            </span>
            <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
              Studio de génération vidéo
            </h1>
            <p className="mt-3 text-base md:text-lg text-[color:var(--color-on-surface-variant)] leading-relaxed">
              Décrivez votre idée, choisissez votre public, et laissez l&apos;orchestrateur
              Hestia assembler une vidéo pédagogique complète.
            </p>
          </header>

          <Suspense
            fallback={
              <div className="w-full max-w-3xl h-64 rounded-[2rem] bg-[color:var(--color-surface-container-low)] animate-pulse" />
            }
          >
            <UtiliserContent />
          </Suspense>
        </section>
      </main>
    </AppShell>
  );
}
