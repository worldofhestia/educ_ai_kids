'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api, GenerationStatus, GenerationStatusResponse } from '@/lib/api';

interface UseVideoGenerationReturn {
  // État
  isLoading: boolean;
  jobId: string | null;
  status: GenerationStatus | null;
  progress: number;
  currentStep: string;
  errorMessage: string | null;
  videoUrl: string | null;
  title: string | null;

  // Actions
  startGeneration: (prompt: string, targetAudience?: string, targetDuration?: number) => Promise<void>;
  reset: () => void;
}

const POLLING_INTERVAL = 2000; // 2 secondes
const MAX_POLL_RETRIES = 3; // Nombre de tentatives avant d'abandonner

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const pollRetriesRef = useRef(0);

  // Nettoyage au démontage
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  // Fonction de polling du statut avec retry automatique
  const pollStatus = useCallback(async (id: string) => {
    if (!isMountedRef.current) return;

    try {
      const response: GenerationStatusResponse = await api.getStatus(id);

      if (!isMountedRef.current) return;

      // Reset le compteur de retries après un succès
      pollRetriesRef.current = 0;

      setStatus(response.status);
      setProgress(response.progress);
      setCurrentStep(response.current_step);
      setErrorMessage(response.error_message);
      setTitle(response.title);

      if (response.video_url) {
        setVideoUrl(api.getVideoUrl(id));
      }

      // Continuer le polling si pas terminé
      if (response.status !== 'completed' && response.status !== 'failed') {
        pollingRef.current = setTimeout(() => pollStatus(id), POLLING_INTERVAL);
      } else {
        setIsLoading(false);
        if (response.status === 'completed' && response.video_url) {
          setVideoUrl(api.getVideoUrl(id));
        }
      }
    } catch (error) {
      console.error('Erreur lors du polling:', error);
      if (!isMountedRef.current) return;

      pollRetriesRef.current += 1;

      if (pollRetriesRef.current < MAX_POLL_RETRIES) {
        // Retry avec backoff exponentiel (2s, 4s, 8s)
        const backoff = POLLING_INTERVAL * Math.pow(2, pollRetriesRef.current);
        console.warn(`Polling retry ${pollRetriesRef.current}/${MAX_POLL_RETRIES} dans ${backoff}ms`);
        pollingRef.current = setTimeout(() => pollStatus(id), backoff);
      } else {
        // Abandonner après MAX_POLL_RETRIES échecs consécutifs
        setErrorMessage(
          error instanceof Error ? error.message : 'Erreur de connexion au serveur'
        );
        setStatus('failed');
        setIsLoading(false);
      }
    }
  }, []);

  // Démarrer la génération
  const startGeneration = useCallback(
    async (prompt: string, targetAudience = 'enfants 6-10 ans', targetDuration = 60) => {
      // Reset l'état
      setIsLoading(true);
      setJobId(null);
      setStatus('pending');
      setProgress(0);
      setCurrentStep('Initialisation...');
      setErrorMessage(null);
      setVideoUrl(null);
      setTitle(null);

      // Arrêter le polling précédent et reset retries
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
      pollRetriesRef.current = 0;

      try {
        const response = await api.generateVideo({
          prompt,
          target_audience: targetAudience,
          target_duration: targetDuration,
        });

        if (!isMountedRef.current) return;

        setJobId(response.job_id);
        setStatus(response.status);
        setCurrentStep('Génération démarrée...');

        // Démarrer le polling
        pollingRef.current = setTimeout(
          () => pollStatus(response.job_id),
          POLLING_INTERVAL
        );
      } catch (error) {
        console.error('Erreur lors du démarrage:', error);
        if (isMountedRef.current) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Erreur lors du démarrage'
          );
          setStatus('failed');
          setIsLoading(false);
        }
      }
    },
    [pollStatus]
  );

  // Reset complet
  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }
    setIsLoading(false);
    setJobId(null);
    setStatus(null);
    setProgress(0);
    setCurrentStep('');
    setErrorMessage(null);
    setVideoUrl(null);
    setTitle(null);
  }, []);

  return {
    isLoading,
    jobId,
    status,
    progress,
    currentStep,
    errorMessage,
    videoUrl,
    title,
    startGeneration,
    reset,
  };
}

