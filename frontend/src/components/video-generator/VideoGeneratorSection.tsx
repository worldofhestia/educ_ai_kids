'use client';

import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { GeneratorForm } from './GeneratorForm';
import { ProgressDisplay } from './ProgressDisplay';
import { VideoPlayer } from './VideoPlayer';

export function VideoGeneratorSection() {
  const {
    isLoading,
    status,
    progress,
    currentStep,
    errorMessage,
    videoUrl,
    title,
    startGeneration,
    reset,
  } = useVideoGeneration();

  const handleSubmit = async (data: {
    prompt: string;
    targetAudience: string;
    targetDuration: number;
  }) => {
    await startGeneration(data.prompt, data.targetAudience, data.targetDuration);
  };

  const showForm = !status || status === 'failed';
  const showProgress = status && status !== 'completed' && status !== 'failed';
  const showVideo = status === 'completed' && videoUrl;

  return (
    <section className="flex flex-col items-center justify-center">
      {/* Indicateur de statut */}
      {status && status !== 'failed' && (
        <div className="flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-secondary/50">
          <div
            className={`w-2 h-2 rounded-full ${
              status === 'completed'
                ? 'bg-green-500'
                : 'bg-yellow-500 animate-pulse'
            }`}
          />
          <span className="text-sm font-medium">
            {status === 'completed' ? 'Terminé' : 'En cours...'}
          </span>
        </div>
      )}

      {/* Message d'erreur visible au-dessus du formulaire */}
      {status === 'failed' && errorMessage && (
        <div className="w-full max-w-2xl mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* Formulaire de génération */}
      {showForm && (
        <GeneratorForm onSubmit={handleSubmit} isLoading={isLoading} />
      )}

      {/* Affichage de la progression */}
      {showProgress && (
        <ProgressDisplay
          status={status}
          progress={progress}
          currentStep={currentStep}
          errorMessage={errorMessage}
        />
      )}

      {/* Lecteur vidéo */}
      {showVideo && (
        <VideoPlayer
          videoUrl={videoUrl}
          title={title || undefined}
          onNewVideo={reset}
        />
      )}

      {/* Bouton réessayer en cas d'erreur */}
      {status === 'failed' && (
        <div className="mt-4 text-center">
          <button
            onClick={reset}
            className="text-primary hover:underline font-medium"
          >
            ← Réessayer avec une nouvelle demande
          </button>
        </div>
      )}
    </section>
  );
}
