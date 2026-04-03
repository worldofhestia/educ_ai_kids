'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface GeneratorFormProps {
  onSubmit: (data: {
    prompt: string;
    targetAudience: string;
    targetDuration: number;
  }) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  "Explique-moi comment les abeilles font du miel",
  "Comment fonctionne le cycle de l'eau dans la nature ?",
  "Pourquoi le ciel est-il bleu pendant la journée ?",
  "Comment les dinosaures ont-ils disparu de la Terre ?",
  "Qu'est-ce que la photosynthèse et pourquoi est-elle importante ?",
];

export function GeneratorForm({ onSubmit, isLoading }: GeneratorFormProps) {
  const [prompt, setPrompt] = useState('');
  const [targetAudience, setTargetAudience] = useState('enfants 6-10 ans');
  const [targetDuration, setTargetDuration] = useState(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 10) return;
    onSubmit({ prompt, targetAudience, targetDuration });
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-card/80">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          🎬 Créer une Vidéo Éducative
        </CardTitle>
        <CardDescription className="text-lg">
          Décrivez le sujet que vous souhaitez expliquer aux enfants
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt principal */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base font-semibold">
              Votre sujet éducatif *
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Explique-moi comment les papillons se transforment..."
              className="min-h-[120px] text-base resize-none border-2 focus:border-primary transition-colors"
              disabled={isLoading}
              required
              minLength={10}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {prompt.length}/1000 caractères
            </p>
          </div>

          {/* Exemples de prompts */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              💡 Idées de sujets :
            </Label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground"
                  disabled={isLoading}
                >
                  {example.slice(0, 40)}...
                </button>
              ))}
            </div>
          </div>

          {/* Options avancées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audience" className="text-sm font-medium">
                Public cible
              </Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="enfants 6-10 ans"
                className="border-2"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Durée (secondes)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  type="range"
                  min={30}
                  max={180}
                  step={10}
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(Number(e.target.value))}
                  className="flex-1"
                  disabled={isLoading}
                />
                <span className="w-16 text-center font-mono text-sm bg-secondary px-2 py-1 rounded">
                  {targetDuration}s
                </span>
              </div>
            </div>
          </div>

          {/* Bouton de soumission */}
          <Button
            type="submit"
            size="lg"
            className="w-full text-lg font-semibold py-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading || prompt.trim().length < 10}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Génération en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>🚀</span>
                Générer la Vidéo
              </span>
            )}
          </Button>
        </form>

        {/* Informations */}
        <div className="pt-4 border-t">
          <p className="text-xs text-center text-muted-foreground">
            La génération peut prendre 2-5 minutes selon la complexité du sujet.
            <br />
            Une connexion stable est recommandée.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

