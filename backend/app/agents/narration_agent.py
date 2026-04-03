"""
Narration Agent: Découpe le script en scènes avec descriptions visuelles.
"""

import json
from typing import Any
import structlog
from langchain_core.messages import HumanMessage, SystemMessage

from .base import BaseAgent
from ..models.state import VideoGenerationState, GenerationStatus, Scene

logger = structlog.get_logger()


class NarrationAgent(BaseAgent):
    """Agent responsable du découpage en scènes."""
    
    SYSTEM_PROMPT = """Tu es un réalisateur de vidéos éducatives animées pour enfants.

Ton rôle est de découper un script narratif en scènes visuelles distinctes.

Pour chaque scène, tu dois fournir:
1. Le texte de narration correspondant
2. Une description visuelle détaillée pour générer une image cartoon
3. La durée estimée de la scène (3-5 secondes)

Règles pour les descriptions visuelles:
- Style cartoon, simple et coloré
- Adapté aux enfants
- Personnages mignons et expressifs
- Décors clairs et reconnaissables
- Pas de texte dans les images

Réponds UNIQUEMENT avec un JSON valide au format suivant:
{
    "scenes": [
        {
            "id": 1,
            "narration_text": "Texte de narration pour cette scène",
            "visual_description": "Description détaillée de l'image à générer",
            "duration": 4.0
        }
    ]
}"""

    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """Découpe le script en scènes."""
        try:
            logger.info(
                "narration_agent_start",
                job_id=state.job_id
            )
            
            if not state.script_full:
                return {
                    "status": GenerationStatus.FAILED,
                    "error_message": "Pas de script à découper"
                }
            
            # Calculer le nombre de scènes cible
            avg_scene_duration = 4.0
            target_scenes = min(
                int(state.target_duration / avg_scene_duration),
                self.settings.max_scenes
            )
            
            user_prompt = f"""Découpe ce script en {target_scenes} scènes visuelles.

TITRE: {state.script_title}

SCRIPT:
{state.script_full}

Durée totale cible: {state.target_duration} secondes
Nombre de scènes souhaité: {target_scenes}

Génère le JSON avec les scènes."""

            messages = [
                SystemMessage(content=self.SYSTEM_PROMPT),
                HumanMessage(content=user_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            content = response.content
            
            # Extraire le JSON de la réponse
            json_str = content
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0]
            
            data = json.loads(json_str.strip())
            
            # Créer les objets Scene
            scenes = []
            current_time = 0.0
            
            for scene_data in data.get("scenes", []):
                scene = Scene(
                    id=scene_data["id"],
                    narration_text=scene_data["narration_text"],
                    visual_description=scene_data["visual_description"],
                    duration=scene_data.get("duration", 4.0),
                    start_time=current_time,
                    animation_prompt=f"gentle animation, {scene_data['visual_description'][:50]}"
                )
                scenes.append(scene)
                current_time += scene.duration
            
            logger.info(
                "narration_agent_complete",
                job_id=state.job_id,
                num_scenes=len(scenes),
                total_duration=current_time
            )
            
            return {
                "scenes": scenes,
                "status": GenerationStatus.GENERATING_IMAGES,
                "progress": 25.0,
                "current_step": f"Scènes définies ({len(scenes)} scènes), génération des images...",
                "messages": [
                    {"role": "assistant", "content": f"{len(scenes)} scènes créées"}
                ]
            }
            
        except json.JSONDecodeError as e:
            logger.error("narration_agent_json_error", error=str(e))
            return {
                "status": GenerationStatus.FAILED,
                "error_message": f"Erreur parsing JSON scènes: {str(e)}"
            }
        except Exception as e:
            logger.error("narration_agent_error", error=str(e))
            return {
                "status": GenerationStatus.FAILED,
                "error_message": f"Erreur découpage scènes: {str(e)}"
            }

