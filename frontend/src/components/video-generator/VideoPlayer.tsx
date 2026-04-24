'use client';

import { useState, useRef } from 'react';
import { Icon } from '@/components/layout/Icon';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onNewVideo: () => void;
}

export function VideoPlayer({ videoUrl, title, onNewVideo }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
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
        /* Partage annulé par l'utilisateur */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Lien copié !');
    }
  };

  return (
    <article className="w-full max-w-4xl mx-auto bg-card rounded-[2rem] md:rounded-[2.5rem] editorial-shadow-lg overflow-hidden border border-[color:var(--color-outline-variant)]/30">
      {/* Header célébration */}
      <header className="px-6 md:px-10 pt-8 md:pt-10 pb-6 bg-gradient-to-br from-[color:var(--color-hestia-gold-soft)]/60 via-[color:var(--color-surface-container-low)] to-card relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-hestia-gradient text-primary-foreground flex items-center justify-center editorial-shadow">
            <Icon name="celebration" filled size={28} />
          </div>
          <div className="flex-1">
            <span className="inline-block text-xs font-body uppercase tracking-widest font-bold text-primary mb-1">
              Génération terminée
            </span>
            <h2 className="font-headline text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
              Votre vidéo est prête !
            </h2>
            {title && (
              <p className="text-sm md:text-base text-[color:var(--color-on-surface-variant)] mt-1 italic">
                « {title} »
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Lecteur */}
      <div className="p-6 md:p-10 space-y-8">
        <div className="relative aspect-video bg-black rounded-[1.5rem] overflow-hidden editorial-shadow group">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            controls
            controlsList="nodownload"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>

          {!isPlaying && (
            <button
              type="button"
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Lecture"
            >
              <div className="w-20 h-20 rounded-full bg-card/95 flex items-center justify-center editorial-shadow-lg">
                <Icon name="play_arrow" filled className="text-primary" size={42} />
              </div>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 bg-hestia-gradient text-primary-foreground py-4 rounded-full font-headline font-bold text-base inline-flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-[0.98] editorial-shadow"
          >
            <Icon name="download" size={20} />
            Télécharger
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex-1 bg-[color:var(--color-hestia-gold-soft)] text-[color:var(--color-hestia-gold-on)] py-4 rounded-full font-headline font-bold text-base inline-flex items-center justify-center gap-2 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Icon name="share" size={20} />
            Partager
          </button>

          <button
            type="button"
            onClick={onNewVideo}
            className="flex-1 bg-[color:var(--color-surface-container-high)] text-foreground py-4 rounded-full font-headline font-bold text-base inline-flex items-center justify-center gap-2 hover:bg-[color:var(--color-surface-variant)] transition-all active:scale-[0.98]"
          >
            <Icon name="add_circle" size={20} />
            Nouvelle vidéo
          </button>
        </div>

        {/* Stats tonales */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <StatCard icon="hd" label="Qualité" value="HD" />
          <StatCard icon="video_file" label="Format" value="MP4" />
          <StatCard icon="all_inclusive" label="Usage" value="Libre" />
        </div>

        <p className="text-xs text-center text-[color:var(--color-on-surface-variant)] font-body uppercase tracking-widest">
          Générée par IA • Utilisable librement à des fins pédagogiques
        </p>
      </div>
    </article>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-[color:var(--color-surface-container-low)] rounded-2xl p-4 text-center">
      <Icon name={icon} className="text-primary mb-1" size={22} />
      <p className="font-headline font-bold text-xl text-foreground">{value}</p>
      <p className="text-[10px] text-[color:var(--color-on-surface-variant)] uppercase tracking-widest font-body">
        {label}
      </p>
    </div>
  );
}
