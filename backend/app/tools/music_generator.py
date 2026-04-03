"""
Music Generator Tool using Replicate MusicGen model.
Génère une musique de fond neutre et instrumentale.
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


class MusicGenerator:
    """Générateur de musique utilisant MusicGen (Meta) via Replicate."""
    
    # Prompts optimisés pour musique éducative
    MUSIC_PROMPTS = {
        "default": (
            "calm instrumental background music, educational video, "
            "soft piano and strings, gentle melody, child-friendly, "
            "positive mood, 80 bpm, ambient, no lyrics"
        ),
        "science": (
            "curious and wonder-filled instrumental music, discovery theme, "
            "light electronic elements with orchestral, educational documentary style, "
            "inspiring, 90 bpm, no lyrics"
        ),
        "nature": (
            "peaceful nature documentary music, soft flutes and acoustic guitar, "
            "birds and forest atmosphere, calm and relaxing, educational, "
            "70 bpm, no lyrics"
        ),
        "history": (
            "epic yet gentle orchestral music, storytelling theme, "
            "soft strings and woodwinds, educational documentary, "
            "adventurous but calm, 85 bpm, no lyrics"
        ),
        "math": (
            "playful and logical instrumental music, light xylophone and piano, "
            "educational puzzle-solving mood, cheerful, child-friendly, "
            "100 bpm, no lyrics"
        ),
    }
    
    # Rate limiting settings
    MAX_RETRIES = 3
    RETRY_DELAY_BASE = 15
    
    def __init__(self):
        self.settings = get_settings()
        
    def _select_prompt(self, topic: str) -> str:
        """Sélectionne le prompt musical approprié selon le sujet."""
        topic_lower = topic.lower()
        
        for key, prompt in self.MUSIC_PROMPTS.items():
            if key in topic_lower:
                return prompt
        
        return self.MUSIC_PROMPTS["default"]
    
    async def generate_music(
        self,
        output_path: Path,
        duration: float = 60.0,
        topic: str = "",
        custom_prompt: Optional[str] = None
    ) -> Optional[str]:
        """
        Génère une piste musicale de fond avec retry sur rate limit.
        
        Args:
            output_path: Chemin de sortie pour le fichier audio
            duration: Durée souhaitée en secondes (max ~30s par génération)
            topic: Sujet de la vidéo pour adapter le style musical
            custom_prompt: Prompt personnalisé (optionnel)
            
        Returns:
            Chemin du fichier audio ou None en cas d'erreur
        """
        prompt = custom_prompt or self._select_prompt(topic)
        generation_duration = min(duration, 30)
        
        for attempt in range(self.MAX_RETRIES):
            try:
                logger.info(
                    "generating_music",
                    duration=generation_duration,
                    topic=topic[:50] if topic else "default",
                    attempt=attempt + 1
                )
                
                # Appel Replicate async avec timeout de 5 minutes
                output = await asyncio.wait_for(
                    asyncio.to_thread(
                        replicate.run,
                        self.settings.replicate_music_model,
                        input={
                            "prompt": prompt,
                            "model_version": "stereo-large",
                            "output_format": "wav",
                            "duration": int(generation_duration),
                            "top_k": 250,
                            "top_p": 0,
                            "temperature": 1,
                            "continuation": False,
                            "normalization_strategy": "peak",
                            "classifier_free_guidance": 3,
                        }
                    ),
                    timeout=300.0
                )
                
                if not output:
                    logger.error("no_music_output")
                    return None
                
                # Télécharger l'audio
                audio_url = str(output)
                music_filename = output_path / "background_music.wav"
                
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.get(audio_url)
                    response.raise_for_status()
                    music_filename.write_bytes(response.content)
                
                logger.info(
                    "music_generated",
                    path=str(music_filename),
                    duration=generation_duration
                )
                
                return str(music_filename)
                
            except asyncio.TimeoutError:
                logger.error("music_generation_timeout", attempt=attempt + 1)
                return None
            except ReplicateError as e:
                error_str = str(e)
                if "429" in error_str or "throttled" in error_str.lower():
                    wait_time = self.RETRY_DELAY_BASE * (attempt + 1)
                    logger.warning(
                        "music_rate_limited_retrying",
                        attempt=attempt + 1,
                        wait_seconds=wait_time
                    )
                    await asyncio.sleep(wait_time)
                elif "404" in error_str or "not found" in error_str.lower():
                    logger.error(
                        "music_model_not_found",
                        model=self.settings.replicate_music_model,
                        error=error_str
                    )
                    return None
                else:
                    logger.error("music_generation_failed", error=error_str)
                    return None
            except Exception as e:
                logger.error("music_generation_failed", error=str(e))
                return None
        
        logger.error("music_generation_max_retries")
        return None
    
    async def generate_extended_music(
        self,
        output_path: Path,
        target_duration: float,
        topic: str = ""
    ) -> Optional[str]:
        """
        Génère une piste musicale longue en combinant plusieurs segments.
        
        Pour les vidéos de plus de 30s, génère et boucle la musique.
        
        Args:
            output_path: Dossier de sortie
            target_duration: Durée cible en secondes
            topic: Sujet pour adapter le style
            
        Returns:
            Chemin du fichier audio final ou None
        """
        # Générer un segment de base (30s max)
        base_path = await self.generate_music(
            output_path, 
            min(30, target_duration),
            topic
        )
        
        if not base_path:
            return None
        
        # Si la durée cible est <= 30s, on retourne directement
        if target_duration <= 30:
            return base_path
        
        # Sinon, on bouclera la musique dans le montage final
        # Le looping sera géré par MoviePy
        logger.info(
            "music_will_loop",
            base_duration=30,
            target_duration=target_duration
        )
        
        return base_path

