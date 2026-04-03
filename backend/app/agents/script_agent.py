"""
Script Agent: Génère le script narratif éducatif.
"""

from typing import Any
import structlog
from langchain_core.messages import HumanMessage, SystemMessage

from .base import BaseAgent
from ..models.state import VideoGenerationState, GenerationStatus

logger = structlog.get_logger()


class ScriptAgent(BaseAgent):
    """Agent responsable de la génération du script narratif."""
    
    SYSTEM_PROMPT = """Tu es un scénariste spécialisé dans les vidéos éducatives pour enfants.
    
Ton rôle est de créer un script narratif engageant et pédagogique basé sur la demande de l'utilisateur.

Règles:
- Utilise un langage simple et accessible adapté au public cible
- Explique les concepts de manière progressive et claire
- Ajoute des éléments amusants et mémorables
- Structure le contenu de façon logique
- La durée totale doit correspondre au temps demandé (environ 120-150 mots par minute)

Format de réponse attendu:
---
TITRE: [Titre accrocheur de la vidéo]

SCRIPT:
[Texte complet du script narratif, écrit pour être lu à voix haute]
---

Le script doit être fluide et naturel à l'oral, sans indications techniques."""

    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """Génère le script narratif."""
        try:
            logger.info(
                "script_agent_start",
                job_id=state.job_id,
                request=state.user_request[:100]
            )
            
            # Calculer le nombre de mots cible
            words_per_minute = 130
            target_words = int((state.target_duration / 60) * words_per_minute)
            
            user_prompt = f"""Crée un script narratif pour une vidéo éducative.

Sujet demandé: {state.user_request}

Public cible: {state.target_audience}

Durée cible: environ {state.target_duration} secondes (environ {target_words} mots)

Génère un script complet, engageant et adapté au public."""

            messages = [
                SystemMessage(content=self.SYSTEM_PROMPT),
                HumanMessage(content=user_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            content = response.content
            
            # Parser la réponse pour extraire titre et script
            title = "Vidéo Éducative"
            script = content
            
            if "TITRE:" in content:
                parts = content.split("SCRIPT:")
                title_part = parts[0]
                title = title_part.split("TITRE:")[-1].strip().strip("-").strip()
                if len(parts) > 1:
                    script = parts[1].strip().strip("-").strip()
            
            logger.info(
                "script_agent_complete",
                job_id=state.job_id,
                title=title,
                script_length=len(script)
            )
            
            return {
                "script_title": title,
                "script_full": script,
                "status": GenerationStatus.GENERATING_NARRATION,
                "progress": 15.0,
                "current_step": "Script généré, découpage en scènes...",
                "messages": [
                    {"role": "assistant", "content": f"Script généré: {title}"}
                ]
            }
            
        except Exception as e:
            logger.error("script_agent_error", error=str(e))
            return {
                "status": GenerationStatus.FAILED,
                "error_message": f"Erreur génération script: {str(e)}"
            }

