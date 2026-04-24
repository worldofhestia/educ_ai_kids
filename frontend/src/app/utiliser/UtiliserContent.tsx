'use client';

import { useSearchParams } from 'next/navigation';
import { VideoGeneratorSection } from '@/components/video-generator';

/**
 * Client wrapper : lit ?prompt=… injecté par le chatbot Hestia et pré-remplit le formulaire.
 * Isolé dans un fichier dédié pour rester compatible Suspense (obligatoire avec useSearchParams).
 */
export function UtiliserContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') ?? '';

  return <VideoGeneratorSection key={initialPrompt} initialPrompt={initialPrompt} />;
}
