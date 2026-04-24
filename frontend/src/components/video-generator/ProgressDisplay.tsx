'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/layout/Icon';
import { GenerationStatus } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ProgressDisplayProps {
  status: GenerationStatus;
  progress: number;
  currentStep: string;
  errorMessage?: string | null;
}

interface StatusConfig {
  icon: string;
  label: string;
  accent: 'primary' | 'sage' | 'gold' | 'success' | 'error';
}

const STATUS_INFO: Record<GenerationStatus, StatusConfig> = {
  pending: { icon: 'hourglass_top', label: 'En attente', accent: 'gold' },
  generating_script: { icon: 'description', label: 'Script narratif', accent: 'primary' },
  generating_narration: { icon: 'view_agenda', label: 'Découpage des scènes', accent: 'primary' },
  generating_images: { icon: 'palette', label: 'Illustrations cartoon', accent: 'gold' },
  generating_voice: { icon: 'mic', label: 'Voix off', accent: 'primary' },
  generating_music: { icon: 'music_note', label: 'Musique de fond', accent: 'sage' },
  generating_video_clips: { icon: 'movie', label: 'Animation des scènes', accent: 'primary' },
  assembling: { icon: 'auto_fix_high', label: 'Montage final', accent: 'sage' },
  completed: { icon: 'check_circle', label: 'Terminé !', accent: 'success' },
  failed: { icon: 'error', label: 'Erreur', accent: 'error' },
};

const WORKFLOW_STEPS: GenerationStatus[] = [
  'generating_script',
  'generating_narration',
  'generating_images',
  'generating_voice',
  'generating_music',
  'generating_video_clips',
  'assembling',
  'completed',
];

const ACCENT_CLASSES = {
  primary: 'bg-primary text-primary-foreground',
  sage: 'bg-[color:var(--color-hestia-sage-dark)] text-white',
  gold: 'bg-[color:var(--color-hestia-gold-soft)] text-[color:var(--color-hestia-gold-on)]',
  success: 'bg-green-600 text-white',
  error: 'bg-[color:var(--destructive)] text-white',
} as const;

export function ProgressDisplay({
  status,
  progress,
  currentStep,
  errorMessage,
}: ProgressDisplayProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.pending;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const currentStepIndex = WORKFLOW_STEPS.indexOf(status);

  return (
    <article className="w-full max-w-3xl mx-auto bg-card rounded-[2rem] md:rounded-[2.5rem] editorial-shadow-lg overflow-hidden border border-[color:var(--color-outline-variant)]/30">
      {/* Header */}
      <header className="px-6 md:px-10 pt-8 pb-6 bg-[color:var(--color-surface-container-low)] flex items-center gap-4">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center editorial-shadow',
            ACCENT_CLASSES[statusInfo.accent]
          )}
        >
          <Icon
            name={statusInfo.icon}
            filled
            size={26}
            className={status !== 'completed' && status !== 'failed' ? 'animate-pulse' : ''}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-headline text-2xl md:text-3xl font-semibold tracking-tight">
            {statusInfo.label}
          </h2>
          <p className="text-sm text-[color:var(--color-on-surface-variant)] truncate">
            {currentStep || 'Initialisation…'}
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="font-headline font-bold text-3xl text-primary">
            {Math.round(animatedProgress)}
            <span className="text-base">%</span>
          </p>
        </div>
      </header>

      <div className="p-6 md:p-10 space-y-8">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="h-3 rounded-full overflow-hidden bg-[color:var(--color-surface-container-high)]">
            <div
              data-slot="progress-indicator"
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${animatedProgress}%` }}
              aria-valuenow={animatedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <div className="flex justify-between text-[11px] font-body uppercase tracking-widest text-[color:var(--color-on-surface-variant)]">
            <span>Démarrage</span>
            <span>En cours</span>
            <span>Terminé</span>
          </div>
        </div>

        {/* Timeline étapes */}
        <div className="space-y-4">
          <h3 className="font-headline font-semibold text-sm uppercase tracking-widest text-[color:var(--color-on-surface-variant)] flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-primary" />
            Étapes du processus
          </h3>

          <ol className="relative space-y-3">
            {WORKFLOW_STEPS.slice(0, -1).map((step, index) => {
              const stepInfo = STATUS_INFO[step];
              const isCompleted = index < currentStepIndex;
              const isCurrent = step === status;
              const isPending = index > currentStepIndex;

              return (
                <li
                  key={step}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-2xl transition-all',
                    isCurrent && 'bg-[color:var(--color-surface-container-low)] editorial-shadow',
                    isPending && 'opacity-40'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0',
                      isCompleted && 'bg-green-600 text-white',
                      isCurrent &&
                        'bg-hestia-gradient text-primary-foreground animate-pulse ring-4 ring-primary/20',
                      isPending && 'bg-[color:var(--color-surface-container-high)] text-[color:var(--color-on-surface-variant)]'
                    )}
                  >
                    <Icon
                      name={isCompleted ? 'check' : stepInfo.icon}
                      filled={isCurrent || isCompleted}
                      size={20}
                    />
                  </div>
                  <span
                    className={cn(
                      'font-body text-sm',
                      isCurrent && 'font-semibold'
                    )}
                  >
                    {stepInfo.label}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Erreur */}
        {status === 'failed' && errorMessage && (
          <div className="bg-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Icon name="error" className="text-[color:var(--destructive)]" filled />
              <div>
                <p className="font-headline font-semibold text-[color:var(--destructive)] text-sm">
                  {errorMessage}
                </p>
                <p className="text-xs mt-1 text-[color:var(--color-on-surface-variant)]">
                  Veuillez réessayer ou modifier votre demande.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
