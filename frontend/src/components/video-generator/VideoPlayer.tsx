'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onNewVideo: () => void;
}

export function VideoPlayer({ videoUrl, title, onNewVideo }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `${title || 'video-educative'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Vidéo Éducative',
          text: `Découvrez cette vidéo éducative : ${title}`,
          url: window.location.href,
        });
      } catch {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier le lien
      await navigator.clipboard.writeText(window.location.href);
      alert('Lien copié !');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 shadow-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-4xl">🎉</span>
          <CardTitle className="text-2xl font-bold text-green-600">
            Votre vidéo est prête !
          </CardTitle>
          <span className="text-4xl">🎉</span>
        </div>
        {title && (
          <CardDescription className="text-lg font-medium">
            {title}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Lecteur vidéo */}
        <div
          className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-inner group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(isPlaying ? false : true)}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            controls
            controlsList="nodownload"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            poster="/video-poster.png"
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>

          {/* Overlay de lecture personnalisé (optionnel) */}
          {!isPlaying && showControls && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <span className="text-4xl ml-1">▶️</span>
              </div>
            </button>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            onClick={handleDownload}
            variant="default"
            size="lg"
            className="flex-1 min-w-[200px] max-w-xs py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <span className="mr-2">📥</span>
            Télécharger
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
            size="lg"
            className="flex-1 min-w-[200px] max-w-xs py-6 text-lg font-semibold"
          >
            <span className="mr-2">📤</span>
            Partager
          </Button>

          <Button
            onClick={onNewVideo}
            variant="secondary"
            size="lg"
            className="flex-1 min-w-[200px] max-w-xs py-6 text-lg font-semibold"
          >
            <span className="mr-2">✨</span>
            Nouvelle Vidéo
          </Button>
        </div>

        {/* Statistiques / Infos */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">HD</p>
            <p className="text-xs text-muted-foreground">Qualité</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">MP4</p>
            <p className="text-xs text-muted-foreground">Format</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">∞</p>
            <p className="text-xs text-muted-foreground">Utilisation</p>
          </div>
        </div>

        {/* Note de copyright */}
        <p className="text-xs text-center text-muted-foreground">
          Cette vidéo a été générée par IA. Vous pouvez l'utiliser librement à des fins éducatives.
        </p>
      </CardContent>
    </Card>
  );
}

