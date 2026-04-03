"""
Video Assembler: Montage final avec MoviePy.
Combine clips vidéo, voix off et musique.
"""

import asyncio
from pathlib import Path
from typing import Optional
import structlog

logger = structlog.get_logger()


class VideoAssembler:
    """Assembleur vidéo utilisant MoviePy."""
    
    # Volume de la musique de fond (0.0 - 1.0)
    MUSIC_VOLUME = 0.15
    
    # FPS de sortie
    OUTPUT_FPS = 24
    
    async def assemble(
        self,
        clips: list[dict],
        voice_path: Optional[str],
        music_path: Optional[str],
        output_path: Path,
        title: str = "Video"
    ) -> Optional[str]:
        """
        Assemble tous les éléments en une vidéo finale.
        
        Args:
            clips: Liste de dicts avec 'path', 'duration', 'start_time'
            voice_path: Chemin du fichier voix off
            music_path: Chemin de la musique de fond
            output_path: Dossier de sortie
            title: Titre pour le nom de fichier
            
        Returns:
            Chemin de la vidéo finale ou None
        """
        try:
            logger.info(
                "assembling_video",
                num_clips=len(clips),
                has_voice=voice_path is not None,
                has_music=music_path is not None
            )
            
            # Exécuter le montage dans un thread séparé
            return await asyncio.to_thread(
                self._assemble_sync,
                clips,
                voice_path,
                music_path,
                output_path,
                title
            )
            
        except Exception as e:
            logger.error("assembly_failed", error=str(e))
            return None
    
    def _assemble_sync(
        self,
        clips: list[dict],
        voice_path: Optional[str],
        music_path: Optional[str],
        output_path: Path,
        title: str
    ) -> Optional[str]:
        """Version synchrone de l'assemblage."""
        from moviepy import (
            VideoFileClip,
            AudioFileClip,
            CompositeAudioClip,
            concatenate_videoclips,
            afx
        )

        video_clips: list[VideoFileClip] = []
        audio_clips: list[AudioFileClip] = []
        final_video = None

        try:
            # Charger tous les clips vidéo
            for clip_data in clips:
                clip_path = clip_data.get("path")
                if clip_path and Path(clip_path).exists():
                    clip = VideoFileClip(clip_path)
                    video_clips.append(clip)

            if not video_clips:
                logger.error("no_valid_clips")
                return None

            # Concaténer les clips vidéo
            final_video = concatenate_videoclips(
                video_clips,
                method="compose"
            )

            video_duration = final_video.duration
            logger.info("video_concatenated", duration=video_duration)

            # Préparer les pistes audio
            audio_tracks = []

            # Ajouter la voix off
            if voice_path and Path(voice_path).exists():
                try:
                    voice = AudioFileClip(voice_path)
                    audio_clips.append(voice)
                    if voice.duration > video_duration:
                        voice = voice.subclipped(0, video_duration)
                    audio_tracks.append(voice)
                    logger.info("voice_added", duration=voice.duration)
                except Exception as e:
                    logger.warning("voice_load_failed", error=str(e))

            # Ajouter la musique de fond
            if music_path and Path(music_path).exists():
                try:
                    music = AudioFileClip(music_path)
                    audio_clips.append(music)

                    # Boucler si nécessaire
                    if music.duration < video_duration:
                        loops_needed = int(video_duration / music.duration) + 1
                        from moviepy import concatenate_audioclips
                        music = concatenate_audioclips([music] * loops_needed)

                    music = music.subclipped(0, video_duration)
                    music = music.with_effects([
                        afx.MultiplyVolume(self.MUSIC_VOLUME)
                    ])
                    music = music.with_effects([
                        afx.AudioFadeOut(duration=2.0)
                    ])

                    audio_tracks.append(music)
                    logger.info("music_added", volume=self.MUSIC_VOLUME)
                except Exception as e:
                    logger.warning("music_load_failed", error=str(e))

            # Combiner les pistes audio
            if audio_tracks:
                if len(audio_tracks) == 1:
                    final_audio = audio_tracks[0]
                else:
                    final_audio = CompositeAudioClip(audio_tracks)
                final_video = final_video.with_audio(final_audio)

            # Générer le nom de fichier sécurisé
            safe_title = "".join(
                c if c.isalnum() or c in " -_" else "_"
                for c in title
            )[:50]
            output_file = output_path / f"{safe_title}.mp4"

            # Écrire la vidéo finale
            final_video.write_videofile(
                str(output_file),
                fps=self.OUTPUT_FPS,
                codec="libx264",
                audio_codec="aac",
                bitrate="5000k",
                audio_bitrate="192k",
                preset="medium",
                threads=4,
                logger=None
            )

            logger.info(
                "video_assembled",
                path=str(output_file),
                duration=video_duration
            )

            return str(output_file)

        except Exception as e:
            logger.error("sync_assembly_failed", error=str(e))
            import traceback
            traceback.print_exc()
            return None

        finally:
            # Toujours fermer les clips pour libérer les ressources
            if final_video:
                final_video.close()
            for clip in video_clips:
                clip.close()
            for clip in audio_clips:
                clip.close()
    
    async def create_intro(
        self,
        title: str,
        output_path: Path,
        duration: float = 3.0
    ) -> Optional[str]:
        """
        Crée un écran titre d'introduction.
        
        Args:
            title: Titre de la vidéo
            output_path: Dossier de sortie
            duration: Durée de l'intro
            
        Returns:
            Chemin du clip intro ou None
        """
        try:
            return await asyncio.to_thread(
                self._create_intro_sync,
                title,
                output_path,
                duration
            )
        except Exception as e:
            logger.warning("intro_creation_failed", error=str(e))
            return None
    
    def _create_intro_sync(
        self,
        title: str,
        output_path: Path,
        duration: float
    ) -> Optional[str]:
        """Crée l'intro de manière synchrone."""
        try:
            from moviepy import TextClip, ColorClip, CompositeVideoClip
            
            # Fond coloré
            background = ColorClip(
                size=(1280, 720),
                color=(41, 128, 185)  # Bleu éducatif
            ).with_duration(duration)
            
            # Texte du titre
            title_clip = TextClip(
                text=title,
                font="Arial-Bold",
                font_size=60,
                color="white"
            ).with_duration(duration).with_position("center")
            
            # Composer
            intro = CompositeVideoClip([background, title_clip])
            
            # Ajouter un fade in/out
            intro = intro.with_effects([
                ("fadein", 0.5),
                ("fadeout", 0.5)
            ])
            
            intro_file = output_path / "intro.mp4"
            intro.write_videofile(
                str(intro_file),
                fps=24,
                codec="libx264",
                logger=None
            )
            
            intro.close()
            
            return str(intro_file)
            
        except Exception as e:
            logger.warning("intro_sync_failed", error=str(e))
            return None

