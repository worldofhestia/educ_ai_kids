"""
Music Agent: Génère la musique de fond.
"""

from pathlib import Path
from typing import Any
import structlog

from .base import BaseAgent
from ..models.state import VideoGenerationState, GenerationStatus
from ..tools.music_generator import MusicGenerator

logger = structlog.get_logger()


class MusicAgent(BaseAgent):
    """Agent responsable de la génération de la musique."""
    
    def __init__(self):
        super().__init__()
        self.music_generator = MusicGenerator()
    
    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """Génère la musique de fond."""
        try:
            logger.info(
                "music_agent_start",
                job_id=state.job_id
            )
            
            # Créer le dossier de sortie
            output_path = self.settings.temp_dir / state.job_id / "audio"
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Calculer la durée nécessaire
            target_duration = state.voice_duration or state.target_duration
            
            # Générer la musique
            music_path = await self.music_generator.generate_extended_music(
                output_path=output_path,
                target_duration=target_duration,
                topic=state.user_request
            )
            
            if not music_path:
                # La musique est optionnelle, on continue sans
                logger.warning(
                    "music_generation_failed_continuing",
                    job_id=state.job_id
                )
                return {
                    "music_path": None,
                    "status": GenerationStatus.GENERATING_VIDEO_CLIPS,
                    "progress": 65.0,
                    "current_step": "Musique non disponible, animation des images...",
                    "messages": [
                        {"role": "assistant", "content": "Musique ignorée, continuation..."}
                    ]
                }
            
            logger.info(
                "music_agent_complete",
                job_id=state.job_id,
                path=music_path
            )
            
            return {
                "music_path": music_path,
                "status": GenerationStatus.GENERATING_VIDEO_CLIPS,
                "progress": 65.0,
                "current_step": "Musique générée, animation des images...",
                "messages": [
                    {"role": "assistant", "content": "Musique de fond générée"}
                ]
            }
            
        except Exception as e:
            logger.error("music_agent_error", error=str(e))
            # La musique est optionnelle
            return {
                "music_path": None,
                "status": GenerationStatus.GENERATING_VIDEO_CLIPS,
                "progress": 65.0,
                "current_step": "Erreur musique, continuation sans...",
                "messages": [
                    {"role": "assistant", "content": f"Musique ignorée: {str(e)}"}
                ]
            }

