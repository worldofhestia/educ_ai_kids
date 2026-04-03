"""
Image Agent: Génère les images pour chaque scène.
"""

from pathlib import Path
from typing import Any
import structlog

from .base import BaseAgent
from ..models.state import VideoGenerationState, GenerationStatus
from ..tools.image_generator import ImageGenerator

logger = structlog.get_logger()


class ImageAgent(BaseAgent):
    """Agent responsable de la génération des images."""
    
    def __init__(self):
        super().__init__()
        self.image_generator = ImageGenerator()
    
    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """Génère les images pour toutes les scènes."""
        try:
            logger.info(
                "image_agent_start",
                job_id=state.job_id,
                num_scenes=len(state.scenes)
            )
            
            if not state.scenes:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Pas de scènes définies"
                }
            
            # Créer le dossier de sortie
            output_path = self.settings.temp_dir / state.job_id / "images"
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Préparer les données pour la génération batch
            scenes_data = [
                {
                    "id": scene.id,
                    "visual_description": scene.visual_description
                }
                for scene in state.scenes
            ]
            
            # Générer les images
            image_paths = await self.image_generator.generate_batch(
                scenes_data, 
                output_path
            )
            
            # Mettre à jour les scènes avec les chemins d'images
            updated_scenes = []
            success_count = 0
            
            for scene, image_path in zip(state.scenes, image_paths):
                if image_path:
                    scene.image_path = image_path
                    success_count += 1
                updated_scenes.append(scene)
            
            if success_count == 0:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Échec de génération de toutes les images"
                }
            
            logger.info(
                "image_agent_complete",
                job_id=state.job_id,
                success_count=success_count,
                total=len(state.scenes)
            )
            
            return {
                "scenes": updated_scenes,
                "status": GenerationStatus.GENERATING_VOICE,
                "progress": 40.0,
                "current_step": f"Images générées ({success_count}/{len(state.scenes)}), génération voix off...",
                "messages": [
                    {"role": "assistant", "content": f"{success_count} images générées"}
                ]
            }
            
        except Exception as e:
            logger.error("image_agent_error", error=str(e))
            return {
                "status": GenerationStatus.FAILED,
                "error_message": f"Erreur génération images: {str(e)}"
            }

