"""
Supervisor Agent: Orchestre le workflow et gère les décisions.
"""

from typing import Any, Literal
import structlog

from .base import BaseAgent
from ..models.state import VideoGenerationState, GenerationStatus

logger = structlog.get_logger()


# Types pour le routage
AgentName = Literal[
    "script",
    "narration", 
    "images",
    "voice",
    "music",
    "video",
    "assembly",
    "end"
]


class SupervisorAgent(BaseAgent):
    """Agent superviseur qui orchestre le workflow."""
    
    # Mapping statut -> prochain agent
    STATUS_TO_AGENT: dict[GenerationStatus, AgentName] = {
        GenerationStatus.PENDING: "script",
        GenerationStatus.GENERATING_SCRIPT: "script",
        GenerationStatus.GENERATING_NARRATION: "narration",
        GenerationStatus.GENERATING_IMAGES: "images",
        GenerationStatus.GENERATING_VOICE: "voice",
        GenerationStatus.GENERATING_MUSIC: "music",
        GenerationStatus.GENERATING_VIDEO_CLIPS: "video",
        GenerationStatus.ASSEMBLING: "assembly",
        GenerationStatus.COMPLETED: "end",
        GenerationStatus.FAILED: "end",
    }
    
    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """
        Détermine le prochain agent à exécuter.
        Utilisé pour le routage conditionnel dans LangGraph.
        """
        logger.info(
            "supervisor_routing",
            job_id=state.job_id,
            current_status=state.status,
            progress=state.progress
        )
        
        return {"status": state.status}
    
    @staticmethod
    def route(state: VideoGenerationState) -> AgentName:
        """
        Fonction de routage pour LangGraph.
        Retourne le nom du prochain nœud à exécuter.
        """
        if state.status == GenerationStatus.FAILED:
            logger.error(
                "workflow_failed",
                job_id=state.job_id,
                error=state.error_message
            )
            return "end"
        
        if state.status == GenerationStatus.COMPLETED:
            logger.info(
                "workflow_completed",
                job_id=state.job_id
            )
            return "end"
        
        next_agent = SupervisorAgent.STATUS_TO_AGENT.get(
            state.status, 
            "end"
        )
        
        logger.info(
            "routing_to",
            job_id=state.job_id,
            next_agent=next_agent
        )
        
        return next_agent
    
    @staticmethod
    def should_continue(state: VideoGenerationState) -> bool:
        """Vérifie si le workflow doit continuer."""
        return state.status not in [
            GenerationStatus.COMPLETED,
            GenerationStatus.FAILED
        ]

