"""
Voice Agent: Génère la voix off du script.
"""

from pathlib import Path
from typing import Any
import structlog

from .base import BaseAgent
from ..models.state import VideoGenerationState, GenerationStatus
from ..tools.voice_generator import VoiceGenerator

logger = structlog.get_logger()


class VoiceAgent(BaseAgent):
    """Agent responsable de la génération de la voix off."""
    
    def __init__(self):
        super().__init__()
        self.voice_generator = VoiceGenerator()
    
    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """Génère la voix off complète."""
        try:
            logger.info(
                "voice_agent_start",
                job_id=state.job_id
            )
            
            if not state.script_full:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Pas de script pour la voix off"
                }
            
            # Créer le dossier de sortie
            output_path = self.settings.temp_dir / state.job_id / "audio"
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Générer la voix off
            result = await self.voice_generator.generate_voice(
                text=state.script_full,
                output_path=output_path,
                language="fr"
            )
            
            if not result:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Échec de génération de la voix off"
                }
            
            voice_path, voice_duration = result
            
            logger.info(
                "voice_agent_complete",
                job_id=state.job_id,
                duration=voice_duration
            )
            
            return {
                "voice_path": voice_path,
                "voice_duration": voice_duration,
                "status": GenerationStatus.GENERATING_MUSIC,
                "progress": 55.0,
                "current_step": "Voix off générée, génération musique de fond...",
                "messages": [
                    {"role": "assistant", "content": f"Voix off générée ({voice_duration:.1f}s)"}
                ]
            }
            
        except Exception as e:
            logger.error("voice_agent_error", error=str(e))
            return {
                "status": GenerationStatus.FAILED,
                "error_message": f"Erreur génération voix off: {str(e)}"
            }

