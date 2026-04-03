'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerationStatus } from '@/lib/api';

interface ProgressDisplayProps {
  status: GenerationStatus;
  progress: number;
  currentStep: string;
  errorMessage?: string | null;
}

const STATUS_INFO: Record<
  GenerationStatus,
  { emoji: string; label: string; color: string }
> = {
  pending: { emoji: '⏳', label: 'En attente', color: 'text-yellow-500' },
  generating_script: { emoji: '📝', label: 'Écriture du script', color: 'text-blue-500' },
  generating_narration: { emoji: '🎬', label: 'Création des scènes', color: 'text-purple-500' },
  generating_images: { emoji: '🎨', label: 'Génération des images', color: 'text-pink-500' },
  generating_voice: { emoji: '🎙️', label: 'Enregistrement voix off', color: 'text-orange-500' },
  generating_music: { emoji: '🎵', label: 'Composition musicale', color: 'text-cyan-500' },
  generating_video_clips: { emoji: '🎥', label: 'Animation des scènes', color: 'text-indigo-500' },
  assembling: { emoji: '🔧', label: 'Montage final', color: 'text-green-500' },
  completed: { emoji: '✅', label: 'Terminé !', color: 'text-green-600' },
  failed: { emoji: '❌', label: 'Erreur', color: 'text-red-500' },
};

const WORKFLOW_STEPS = [
  'generating_script',
  'generating_narration',
  'generating_images',
  'generating_voice',
  'generating_music',
  'generating_video_clips',
  'assembling',
  'completed',
];

export function ProgressDisplay({
  status,
  progress,
  currentStep,
  errorMessage,
}: ProgressDisplayProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const statusInfo = STATUS_INFO[status] || STATUS_INFO.pending;

  // Animation fluide de la progression
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const currentStepIndex = WORKFLOW_STEPS.indexOf(status);

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-4">
        <CardTitle className="text-center text-2xl flex items-center justify-center gap-3">
          <span className={`text-4xl ${status === 'completed' ? 'animate-bounce' : 'animate-pulse'}`}>
            {statusInfo.emoji}
          </span>
          <span className={statusInfo.color}>{statusInfo.label}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Barre de progression principale */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Progression globale</span>
            <span className="font-mono font-bold text-primary">
              {Math.round(animatedProgress)}%
            </span>
          </div>
          <Progress 
            value={animatedProgress} 
            className="h-4 transition-all duration-500"
          />
        </div>

        {/* Étape actuelle */}
        <div className="bg-secondary/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Étape en cours</p>
          <p className="font-medium text-lg">{currentStep}</p>
        </div>

        {/* Timeline des étapes */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Étapes du processus</p>
          <div className="flex justify-between items-center gap-1">
            {WORKFLOW_STEPS.slice(0, -1).map((step, index) => {
              const stepInfo = STATUS_INFO[step as GenerationStatus];
              const isCompleted = index < currentStepIndex;
              const isCurrent = step === status;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step}
                  className={`flex-1 flex flex-col items-center gap-1 ${
                    isPending ? 'opacity-40' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground animate-pulse ring-4 ring-primary/30'
                        : 'bg-secondary'
                    }`}
                  >
                    {isCompleted ? '✓' : stepInfo.emoji}
                  </div>
                  <span className="text-[10px] text-center leading-tight hidden md:block">
                    {stepInfo.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message d'erreur */}
        {status === 'failed' && errorMessage && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              ⚠️ {errorMessage}
            </p>
            <p className="text-red-500 dark:text-red-500 text-xs mt-2">
              Veuillez réessayer ou modifier votre demande.
            </p>
          </div>
        )}

        {/* Indicateur de chargement animé */}
        {status !== 'completed' && status !== 'failed' && (
          <div className="flex justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

