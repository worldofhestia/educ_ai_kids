'use client';

import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { GeneratorForm } from './GeneratorForm';
import { ProgressDisplay } from './ProgressDisplay';
import { VideoPlayer } from './VideoPlayer';
import { Icon } from '@/components/layout/Icon';

interface VideoGeneratorSectionProps {
  /** Prompt pré-rempli (ex. depuis le chatbot Hestia via ?prompt=…) */
  initialPrompt?: string;
}

export function VideoGeneratorSection({ initialPrompt }: VideoGeneratorSectionProps) {
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
    <section className="w-full flex flex-col items-center gap-6">
      {/* Message d'erreur visible au-dessus du formulaire */}
      {status === 'failed' && errorMessage && (
        <div className="w-full max-w-3xl p-4 rounded-2xl bg-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/30 text-[color:var(--destructive)] text-sm text-center flex items-center justify-center gap-2">
          <Icon name="error" filled size={18} />
          {errorMessage}
        </div>
      )}

      {showForm && (
        <GeneratorForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          initialPrompt={initialPrompt}
        />
      )}

      {showProgress && (
        <ProgressDisplay
          status={status}
          progress={progress}
          currentStep={currentStep}
          errorMessage={errorMessage}
        />
      )}

      {showVideo && (
        <VideoPlayer
          videoUrl={videoUrl}
          title={title || undefined}
          onNewVideo={reset}
        />
      )}

      {status === 'failed' && (
        <button
          type="button"
          onClick={reset}
          className="text-primary hover:underline font-headline font-medium inline-flex items-center gap-1"
        >
          <Icon name="arrow_back" size={16} />
          Réessayer avec une nouvelle demande
        </button>
      )}
    </section>
  );
}
