"""
Image Generator Tool using Replicate Flux.1 model.
Génère des images cartoon éducatives pour chaque scène.
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


class ImageGenerator:
    """Générateur d'images utilisant Flux.1 via Replicate."""
    
    # Style forcé pour images éducatives cartoon
    STYLE_PROMPT = (
        "cartoon style, simple educational illustration, clean lines, "
        "bright colors, child-friendly, professional quality, "
        "digital art, cute characters, soft lighting"
    )
    
    # Prompt négatif pour éviter le contenu inapproprié
    NEGATIVE_PROMPT = (
        "realistic, photorealistic, scary, violent, dark, "
        "complex details, adult content, text, watermark, signature"
    )
    
    # Rate limiting settings (pour comptes avec < $5 crédit)
    MAX_RETRIES = 3
    RETRY_DELAY_BASE = 15  # secondes
    REQUEST_DELAY = 12  # délai entre chaque requête (6 req/min = 10s min)
    
    def __init__(self):
        self.settings = get_settings()
        # Le token est configuré automatiquement via get_settings()
        
    def _build_prompt(self, scene_description: str) -> str:
        """Construit le prompt complet avec le style éducatif."""
        return f"{self.STYLE_PROMPT}, {scene_description}"
    
    async def generate_image(
        self,
        scene_description: str,
        output_path: Path,
        scene_id: int,
        aspect_ratio: str = "16:9"
    ) -> Optional[str]:
        """
        Génère une image pour une scène donnée avec retry sur rate limit.
        
        Args:
            scene_description: Description visuelle de la scène
            output_path: Chemin de sortie pour sauvegarder l'image
            scene_id: ID de la scène pour le nommage
            aspect_ratio: Ratio d'aspect (défaut 16:9 pour vidéo)
            
        Returns:
            Chemin du fichier image ou None en cas d'erreur
        """
        prompt = self._build_prompt(scene_description)
        
        for attempt in range(self.MAX_RETRIES):
            try:
                logger.info(
                    "generating_image",
                    scene_id=scene_id,
                    attempt=attempt + 1,
                    description=scene_description[:80]
                )
                
                # Appel Replicate async avec timeout de 5 minutes
                output = await asyncio.wait_for(
                    asyncio.to_thread(
                        replicate.run,
                        self.settings.replicate_image_model,
                        input={
                            "prompt": prompt,
                            "aspect_ratio": aspect_ratio,
                            "output_format": "png",
                            "output_quality": 90,
                            "num_outputs": 1,
                            "disable_safety_checker": False,
                        }
                    ),
                    timeout=300.0
                )
                
                if not output:
                    logger.error("no_image_output", scene_id=scene_id)
                    return None
                
                # Télécharger l'image
                image_url = output[0] if isinstance(output, list) else output
                image_filename = output_path / f"scene_{scene_id:03d}.png"
                
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.get(str(image_url))
                    response.raise_for_status()
                    image_filename.write_bytes(response.content)
                
                logger.info(
                    "image_generated",
                    scene_id=scene_id,
                    path=str(image_filename)
                )
                
                return str(image_filename)
                
            except ReplicateError as e:
                if "429" in str(e) or "throttled" in str(e).lower():
                    wait_time = self.RETRY_DELAY_BASE * (attempt + 1)
                    logger.warning(
                        "rate_limited_retrying",
                        scene_id=scene_id,
                        attempt=attempt + 1,
                        wait_seconds=wait_time
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(
                        "image_generation_failed",
                        scene_id=scene_id,
                        error=str(e)
                    )
                    return None
            except asyncio.TimeoutError:
                logger.error("image_generation_timeout", scene_id=scene_id)
                return None
            except Exception as e:
                logger.error(
                    "image_generation_failed",
                    scene_id=scene_id,
                    error=str(e)
                )
                return None
        
        logger.error("image_generation_max_retries", scene_id=scene_id)
        return None
    
    async def generate_batch(
        self,
        scenes: list[dict],
        output_path: Path
    ) -> list[Optional[str]]:
        """
        Génère les images pour plusieurs scènes SÉQUENTIELLEMENT.
        
        Utilise un délai entre chaque requête pour respecter les rate limits
        de Replicate (6 req/min pour comptes < $5 crédit).
        
        Args:
            scenes: Liste de scènes avec 'id' et 'visual_description'
            output_path: Dossier de sortie
            
        Returns:
            Liste des chemins d'images (ou None pour les échecs)
        """
        output_path.mkdir(parents=True, exist_ok=True)
        results: list[Optional[str]] = []
        
        total = len(scenes)
        for idx, scene in enumerate(scenes):
            logger.info(
                "batch_progress",
                current=idx + 1,
                total=total,
                scene_id=scene["id"]
            )
            
            # Générer l'image
            result = await self.generate_image(
                scene["visual_description"],
                output_path,
                scene["id"]
            )
            results.append(result)
            
            # Attendre entre chaque requête (sauf pour la dernière)
            if idx < total - 1:
                logger.info(
                    "rate_limit_delay",
                    delay_seconds=self.REQUEST_DELAY
                )
                await asyncio.sleep(self.REQUEST_DELAY)
        
        return results

