"""
Video Agent: Anime les images et assemble la vidéo finale.
"""

from pathlib import Path
from typing import Any
import structlog

from .base import BaseAgent
from ..models.state import VideoGenerationState, GenerationStatus
from ..tools.video_animator import VideoAnimator, VideoAnimatorFallback
from ..utils.video_assembler import VideoAssembler

logger = structlog.get_logger()


class VideoAgent(BaseAgent):
    """Agent responsable de l'animation et du montage final."""
    
    def __init__(self):
        super().__init__()
        self.video_animator = VideoAnimator()
        self.video_assembler = VideoAssembler()
    
    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """Anime les images et assemble la vidéo."""
        try:
            logger.info(
                "video_agent_start",
                job_id=state.job_id,
                num_scenes=len(state.scenes)
            )
            
            # Créer le dossier de sortie
            clips_path = self.settings.temp_dir / state.job_id / "clips"
            clips_path.mkdir(parents=True, exist_ok=True)
            
            output_path = self.settings.output_dir / state.job_id
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Préparer les scènes pour l'animation
            scenes_with_images = [
                scene for scene in state.scenes 
                if scene.image_path
            ]
            
            if not scenes_with_images:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Aucune image disponible pour l'animation"
                }
            
            # Animer les images
            scenes_data = [
                {
                    "id": scene.id,
                    "image_path": scene.image_path,
                    "visual_description": scene.visual_description,
                    "duration": scene.duration,
                    "animation_type": "default"
                }
                for scene in scenes_with_images
            ]
            
            # Tentative d'animation via Replicate
            video_paths = await self.video_animator.animate_batch(
                scenes_data,
                clips_path
            )
            
            # Fallback: utiliser des vidéos statiques pour les échecs
            updated_scenes = []
            for scene, video_path in zip(scenes_with_images, video_paths):
                if video_path:
                    scene.video_clip_path = video_path
                else:
                    # Fallback: créer une vidéo statique
                    logger.info(
                        "using_static_fallback",
                        scene_id=scene.id
                    )
                    static_path = await VideoAnimatorFallback.create_static_video(
                        scene.image_path,
                        clips_path,
                        scene.id,
                        scene.duration
                    )
                    scene.video_clip_path = static_path
                updated_scenes.append(scene)
            
            # Vérifier qu'on a au moins un clip
            clips_available = [s for s in updated_scenes if s.video_clip_path]
            if not clips_available:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Aucun clip vidéo généré"
                }
            
            logger.info(
                "clips_generated",
                job_id=state.job_id,
                count=len(clips_available)
            )
            
            # Mettre à jour pour le montage
            return {
                "scenes": updated_scenes,
                "status": GenerationStatus.ASSEMBLING,
                "progress": 80.0,
                "current_step": f"Clips générés ({len(clips_available)}), assemblage final...",
                "messages": [
                    {"role": "assistant", "content": f"{len(clips_available)} clips prêts"}
                ]
            }
            
        except Exception as e:
            logger.error("video_agent_error", error=str(e))
            return {
                "status": GenerationStatus.FAILED,
                "error_message": f"Erreur animation vidéo: {str(e)}"
            }


class AssemblyAgent(BaseAgent):
    """Agent responsable de l'assemblage final."""
    
    def __init__(self):
        super().__init__()
        self.video_assembler = VideoAssembler()
    
    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """Assemble tous les éléments en vidéo finale."""
        try:
            logger.info(
                "assembly_agent_start",
                job_id=state.job_id
            )
            
            output_path = self.settings.output_dir / state.job_id
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Préparer les clips
            clips = [
                {
                    "path": scene.video_clip_path,
                    "duration": scene.duration,
                    "start_time": scene.start_time
                }
                for scene in state.scenes
                if scene.video_clip_path
            ]
            
            if not clips:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Aucun clip à assembler"
                }
            
            # Assembler la vidéo finale
            final_path = await self.video_assembler.assemble(
                clips=clips,
                voice_path=state.voice_path,
                music_path=state.music_path,
                output_path=output_path,
                title=state.script_title or "Vidéo Éducative"
            )
            
            if not final_path:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Échec de l'assemblage vidéo"
                }
            
            logger.info(
                "assembly_complete",
                job_id=state.job_id,
                path=final_path
            )
            
            return {
                "final_video_path": final_path,
                "status": GenerationStatus.COMPLETED,
                "progress": 100.0,
                "current_step": "Vidéo terminée !",
                "messages": [
                    {"role": "assistant", "content": "Vidéo éducative générée avec succès !"}
                ]
            }
            
        except Exception as e:
            logger.error("assembly_agent_error", error=str(e))
            return {
                "status": GenerationStatus.FAILED,
                "error_message": f"Erreur assemblage: {str(e)}"
            }

