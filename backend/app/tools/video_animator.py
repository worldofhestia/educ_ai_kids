"""
Video Animator Tool using Replicate Wan 2.1/2.2 model.
Anime les images statiques en clips vidéo courts.
"""

import asyncio
from pathlib import Path
from typing import Optional
import httpx
import replicate
from replicate.exceptions import ReplicateError
import structlog

from ..config import get_settings

logger = structlog.get_logger()


class VideoAnimator:
    """Animateur d'images utilisant Wan 2.1/2.2 via Replicate."""
    
    # Prompts d'animation subtils pour style éducatif
    ANIMATION_PROMPTS = {
        "default": (
            "slow gentle camera pan, subtle zoom in, smooth motion, "
            "educational video style, professional animation"
        ),
        "talking": (
            "character speaking animation, subtle head movement, "
            "gentle expressions, educational presenter style"
        ),
        "nature": (
            "gentle wind effect, leaves moving, soft ambient motion, "
            "nature documentary style, calm and peaceful"
        ),
        "science": (
            "slow rotation, particles floating, gentle glow effects, "
            "scientific visualization, smooth transitions"
        ),
        "action": (
            "smooth movement, gentle transitions, dynamic but calm, "
            "child-friendly action, educational demonstration"
        ),
    }
    
    # Rate limiting settings
    MAX_RETRIES = 3
    RETRY_DELAY_BASE = 15
    REQUEST_DELAY = 12
    
    def __init__(self):
        self.settings = get_settings()
        
    def _build_animation_prompt(
        self, 
        scene_description: str,
        animation_type: str = "default"
    ) -> str:
        """Construit le prompt d'animation."""
        base_prompt = self.ANIMATION_PROMPTS.get(
            animation_type, 
            self.ANIMATION_PROMPTS["default"]
        )
        return f"{base_prompt}, {scene_description}"
    
    async def animate_image(
        self,
        image_path: str,
        output_path: Path,
        scene_id: int,
        duration: float = 4.0,
        scene_description: str = "",
        animation_type: str = "default"
    ) -> Optional[str]:
        """
        Anime une image statique en clip vidéo avec retry sur rate limit.
        
        Args:
            image_path: Chemin de l'image source
            output_path: Dossier de sortie
            scene_id: ID de la scène
            duration: Durée du clip (3-5s recommandé)
            scene_description: Description pour guider l'animation
            animation_type: Type d'animation (default, talking, nature, etc.)
            
        Returns:
            Chemin du fichier vidéo ou None en cas d'erreur
        """
        image_file = Path(image_path)
        if not image_file.exists():
            logger.error("image_not_found", path=image_path)
            return None
        
        animation_prompt = self._build_animation_prompt(scene_description, animation_type)
        
        for attempt in range(self.MAX_RETRIES):
            try:
                logger.info(
                    "animating_image",
                    scene_id=scene_id,
                    attempt=attempt + 1,
                    duration=duration
                )
                
                # Ouvrir le fichier image pour l'envoi
                with open(image_path, "rb") as f:
                    output = await asyncio.to_thread(
                        replicate.run,
                        self.settings.replicate_video_model,
                        input={
                            "image": f,
                            "prompt": animation_prompt,
                            "go_fast": True,              # Mode rapide activé
                            "num_frames": 81,             # ~5 secondes à 16fps
                            "resolution": "480p",         # Résolution 480p
                            "sample_shift": 12,           # Décalage d'échantillonnage
                            "frames_per_second": 16,      # 16 FPS pour animation fluide
                            "interpolate_output": False,
                            "lora_scale_transformer": 1,
                            "lora_scale_transformer_2": 1,
                        }
                    )
                
                if not output:
                    logger.error("no_video_output", scene_id=scene_id)
                    return None
                
                # Télécharger la vidéo
                video_url = str(output)
                video_filename = output_path / f"clip_{scene_id:03d}.mp4"
                
                async with httpx.AsyncClient(timeout=180.0) as client:
                    response = await client.get(video_url)
                    response.raise_for_status()
                    video_filename.write_bytes(response.content)
                
                logger.info(
                    "image_animated",
                    scene_id=scene_id,
                    path=str(video_filename)
                )
                
                return str(video_filename)
                
            except ReplicateError as e:
                if "429" in str(e) or "throttled" in str(e).lower():
                    wait_time = self.RETRY_DELAY_BASE * (attempt + 1)
                    logger.warning(
                        "animation_rate_limited_retrying",
                        scene_id=scene_id,
                        attempt=attempt + 1,
                        wait_seconds=wait_time
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error("animation_failed", scene_id=scene_id, error=str(e))
                    return None
            except Exception as e:
                logger.error("animation_failed", scene_id=scene_id, error=str(e))
                return None
        
        logger.error("animation_max_retries", scene_id=scene_id)
        return None
    
    async def animate_batch(
        self,
        scenes: list[dict],
        output_path: Path
    ) -> list[Optional[str]]:
        """
        Anime plusieurs images SÉQUENTIELLEMENT pour respecter les rate limits.
        
        Args:
            scenes: Liste de scènes avec 'id', 'image_path', 'visual_description'
            output_path: Dossier de sortie
            
        Returns:
            Liste des chemins vidéo (ou None pour les échecs)
        """
        output_path.mkdir(parents=True, exist_ok=True)
        results: list[Optional[str]] = []
        
        total = len(scenes)
        for idx, scene in enumerate(scenes):
            logger.info(
                "animation_batch_progress",
                current=idx + 1,
                total=total,
                scene_id=scene["id"]
            )
            
            result = await self.animate_image(
                image_path=scene["image_path"],
                output_path=output_path,
                scene_id=scene["id"],
                duration=scene.get("duration", 4.0),
                scene_description=scene.get("visual_description", ""),
                animation_type=scene.get("animation_type", "default")
            )
            results.append(result)
            
            # Délai entre chaque requête
            if idx < total - 1:
                logger.info("animation_rate_limit_delay", delay_seconds=self.REQUEST_DELAY)
                await asyncio.sleep(self.REQUEST_DELAY)
        
        return results


class VideoAnimatorFallback:
    """
    Fallback: crée une vidéo statique à partir d'une image
    si l'animation n'est pas disponible.
    """
    
    @staticmethod
    async def create_static_video(
        image_path: str,
        output_path: Path,
        scene_id: int,
        duration: float = 4.0
    ) -> Optional[str]:
        """
        Crée une vidéo statique à partir d'une image avec un léger effet Ken Burns.
        Utilise MoviePy localement.
        """
        try:
            from moviepy import ImageClip
            
            video_filename = output_path / f"clip_{scene_id:03d}.mp4"
            
            # Créer un clip à partir de l'image
            clip = ImageClip(image_path).with_duration(duration)
            
            # Ajouter un léger effet de zoom (Ken Burns)
            # resize progressif de 100% à 105%
            def zoom_effect(get_frame, t):
                frame = get_frame(t)
                zoom_factor = 1 + 0.05 * (t / duration)
                # Zoom center crop
                h, w = frame.shape[:2]
                new_h, new_w = int(h / zoom_factor), int(w / zoom_factor)
                y_start = (h - new_h) // 2
                x_start = (w - new_w) // 2
                cropped = frame[y_start:y_start+new_h, x_start:x_start+new_w]
                # Resize back to original
                from PIL import Image
                import numpy as np
                img = Image.fromarray(cropped)
                img = img.resize((w, h), Image.Resampling.LANCZOS)
                return np.array(img)
            
            clip = clip.transform(zoom_effect)
            
            # Écrire le fichier
            await asyncio.to_thread(
                clip.write_videofile,
                str(video_filename),
                fps=24,
                codec="libx264",
                audio=False,
                logger=None
            )
            
            clip.close()
            
            return str(video_filename)
            
        except Exception as e:
            logger.error(
                "static_video_failed",
                scene_id=scene_id,
                error=str(e)
            )
            return None

