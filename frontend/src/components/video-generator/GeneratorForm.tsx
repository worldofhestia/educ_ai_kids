'use client';

import { useState } from 'react';
import { Icon } from '@/components/layout/Icon';

interface GeneratorFormProps {
  onSubmit: (data: {
    prompt: string;
    targetAudience: string;
    targetDuration: number;
  }) => void;
  isLoading: boolean;
  /** Prompt initial (utilisé quand on arrive depuis le chatbot avec ?prompt=…) */
  initialPrompt?: string;
}

const EXAMPLE_PROMPTS = [
  'Comment les abeilles font du miel ?',
  "Le cycle de l'eau en 60 secondes",
  'Pourquoi le ciel est-il bleu ?',
  'Comment les dinosaures ont-ils disparu ?',
  "Qu'est-ce que la photosynthèse ?",
];

const AUDIENCES = [
  { value: 'enfants 3-5 ans', label: '3–5 ans', icon: 'child_care' },
  { value: 'enfants 6-10 ans', label: '6–10 ans', icon: 'school' },
  { value: 'adolescents 11-15 ans', label: '11–15 ans', icon: 'auto_stories' },
];

export function GeneratorForm({
  onSubmit,
  isLoading,
  initialPrompt = '',
}: GeneratorFormProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [targetAudience, setTargetAudience] = useState('enfants 6-10 ans');
  const [targetDuration, setTargetDuration] = useState(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 10) return;
    onSubmit({ prompt, targetAudience, targetDuration });
  };

  return (
    <article className="w-full max-w-3xl mx-auto bg-card rounded-[2rem] md:rounded-[2.5rem] editorial-shadow-lg overflow-hidden border border-[color:var(--color-outline-variant)]/30">
      {/* Header éditorial */}
      <header className="px-6 md:px-10 pt-8 md:pt-10 pb-6 bg-[color:var(--color-surface-container-low)]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-hestia-gradient text-primary-foreground flex items-center justify-center editorial-shadow">
            <Icon name="auto_videocam" filled size={26} />
          </div>
          <div className="flex-1">
            <h2 className="font-headline text-2xl md:text-3xl font-semibold tracking-tight">
              Créer une vidéo pédagogique
            </h2>
            <p className="text-sm md:text-base text-[color:var(--color-on-surface-variant)] mt-1 leading-relaxed">
              Décrivez le sujet à expliquer — Hestia orchestre le reste.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
        {/* Prompt principal */}
        <div className="space-y-3">
          <label
            htmlFor="prompt"
            className="font-headline font-semibold text-sm uppercase tracking-widest text-[color:var(--color-on-surface-variant)] flex items-center gap-2"
          >
            <span className="w-1 h-4 rounded-full bg-[color:var(--color-hestia-gold-soft)]" />
            Votre sujet éducatif
          </label>

          <div className="bg-[color:var(--color-surface-container-high)] focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 rounded-2xl transition-all">
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex. Explique-moi comment les papillons se transforment, pour des enfants curieux…"
              className="w-full min-h-[140px] bg-transparent border-none focus:ring-0 focus:outline-none p-5 text-base font-body resize-none placeholder:text-[color:var(--color-on-surface-variant)]/60"
              disabled={isLoading}
              required
              minLength={10}
              maxLength={1000}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[color:var(--color-on-surface-variant)]">
            <span className="flex items-center gap-1.5">
              <Icon name="info" size={14} />
              10 caractères minimum
            </span>
            <span className="font-mono">{prompt.length}/1000</span>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <label className="font-headline font-semibold text-sm uppercase tracking-widest text-[color:var(--color-on-surface-variant)] flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[color:var(--color-hestia-sage)]" />
            Idées inspirantes
          </label>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="px-4 py-2 text-xs rounded-full bg-[color:var(--color-surface-container-low)] border border-[color:var(--color-outline-variant)]/40 hover:border-primary hover:text-primary transition-all font-body"
                disabled={isLoading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div className="space-y-3">
          <label className="font-headline font-semibold text-sm uppercase tracking-widest text-[color:var(--color-on-surface-variant)] flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-primary" />
            Public cible
          </label>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {AUDIENCES.map((a) => {
              const isActive = targetAudience === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setTargetAudience(a.value)}
                  disabled={isLoading}
                  className={`flex flex-col items-center gap-1 py-3 md:py-4 rounded-2xl transition-all font-body ${
                    isActive
                      ? 'bg-primary text-primary-foreground editorial-shadow'
                      : 'bg-[color:var(--color-surface-container-low)] text-foreground hover:bg-[color:var(--color-surface-container)]'
                  }`}
                >
                  <Icon name={a.icon} filled={isActive} size={22} />
                  <span className="text-xs md:text-sm font-semibold">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Durée */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="duration"
              className="font-headline font-semibold text-sm uppercase tracking-widest text-[color:var(--color-on-surface-variant)] flex items-center gap-2"
            >
              <span className="w-1 h-4 rounded-full bg-[color:var(--color-hestia-gold)]" />
              Durée souhaitée
            </label>
            <span className="font-headline font-bold text-primary bg-[color:var(--color-hestia-gold-soft)] px-3 py-1 rounded-full text-sm">
              {targetDuration}s
            </span>
          </div>
          <input
            id="duration"
            type="range"
            min={30}
            max={180}
            step={10}
            value={targetDuration}
            onChange={(e) => setTargetDuration(Number(e.target.value))}
            className="w-full accent-[color:var(--color-hestia-brand)]"
            disabled={isLoading}
          />
          <div className="flex justify-between text-[11px] text-[color:var(--color-on-surface-variant)] font-body uppercase tracking-widest">
            <span>Flash 30s</span>
            <span>Standard 60s</span>
            <span>Long 3min</span>
          </div>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={isLoading || prompt.trim().length < 10}
          className="w-full bg-hestia-gradient text-primary-foreground py-5 md:py-6 rounded-full font-headline font-bold text-base md:text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] editorial-shadow disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <Icon name="progress_activity" size={22} className="animate-spin" />
              Génération en cours…
            </>
          ) : (
            <>
              <Icon name="rocket_launch" size={22} />
              Lancer la génération
            </>
          )}
        </button>

        <p className="text-xs text-center text-[color:var(--color-on-surface-variant)] font-body uppercase tracking-widest">
          ⏱️ Environ 2 à 5 minutes selon la complexité
        </p>
      </form>
    </article>
  );
}
