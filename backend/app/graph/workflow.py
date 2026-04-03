"""
LangGraph Workflow: Orchestration du pipeline de génération vidéo.
"""

from typing import Any
import uuid
import structlog
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from ..models.state import VideoGenerationState, GenerationStatus
from ..agents import (
    ScriptAgent,
    NarrationAgent,
    ImageAgent,
    VoiceAgent,
    MusicAgent,
    VideoAgent,
    SupervisorAgent,
)
from ..agents.video_agent import AssemblyAgent

logger = structlog.get_logger()


class VideoGenerationWorkflow:
    """
    Workflow LangGraph pour la génération de vidéos éducatives.
    Orchestre l'exécution séquentielle des agents.
    """
    
    def __init__(self):
        self.graph = self._build_graph()
        self.memory = MemorySaver()
        self.compiled = self.graph.compile(checkpointer=self.memory)
        
        # Instancier les agents
        self.script_agent = ScriptAgent()
        self.narration_agent = NarrationAgent()
        self.image_agent = ImageAgent()
        self.voice_agent = VoiceAgent()
        self.music_agent = MusicAgent()
        self.video_agent = VideoAgent()
        self.assembly_agent = AssemblyAgent()
    
    def _build_graph(self) -> StateGraph:
        """Construit le graphe de workflow."""
        
        # Créer le graphe avec le type d'état
        graph = StateGraph(VideoGenerationState)
        
        # Ajouter les nœuds (agents)
        graph.add_node("script", self._run_script_agent)
        graph.add_node("narration", self._run_narration_agent)
        graph.add_node("images", self._run_image_agent)
        graph.add_node("voice", self._run_voice_agent)
        graph.add_node("music", self._run_music_agent)
        graph.add_node("video", self._run_video_agent)
        graph.add_node("assembly", self._run_assembly_agent)
        
        # Définir les transitions
        graph.add_edge(START, "script")
        # Transitions conditionnelles : continuer ou stopper en cas d'échec
        transitions = [
            ("script", "narration"),
            ("narration", "images"),
            ("images", "voice"),
            ("voice", "music"),
        ]
        for source, target in transitions:
            graph.add_conditional_edges(
                source,
                self._route_or_fail(target),
                {target: target, "end": END}
            )

        # La musique continue toujours (même en échec)
        graph.add_conditional_edges(
            "music",
            self._route_after_music,
            {"video": "video", "end": END}
        )
        graph.add_conditional_edges(
            "video",
            self._route_or_fail("assembly"),
            {"assembly": "assembly", "end": END}
        )
        graph.add_edge("assembly", END)
        
        return graph
    
    # Wrappers pour les agents (convertissent en async)
    async def _run_script_agent(self, state: VideoGenerationState) -> dict[str, Any]:
        return await self.script_agent.process(state)
    
    async def _run_narration_agent(self, state: VideoGenerationState) -> dict[str, Any]:
        return await self.narration_agent.process(state)
    
    async def _run_image_agent(self, state: VideoGenerationState) -> dict[str, Any]:
        return await self.image_agent.process(state)
    
    async def _run_voice_agent(self, state: VideoGenerationState) -> dict[str, Any]:
        return await self.voice_agent.process(state)
    
    async def _run_music_agent(self, state: VideoGenerationState) -> dict[str, Any]:
        return await self.music_agent.process(state)
    
    async def _run_video_agent(self, state: VideoGenerationState) -> dict[str, Any]:
        return await self.video_agent.process(state)
    
    async def _run_assembly_agent(self, state: VideoGenerationState) -> dict[str, Any]:
        return await self.assembly_agent.process(state)
    
    # Fonctions de routage
    @staticmethod
    def _route_or_fail(next_step: str):
        """Crée une fonction de routage qui continue vers next_step ou stoppe en cas d'échec."""
        def router(state: VideoGenerationState) -> str:
            if state.status == GenerationStatus.FAILED:
                return "end"
            return next_step
        return router

    @staticmethod
    def _route_after_music(state: VideoGenerationState) -> str:
        # Continuer même si la musique échoue
        return "video"
    
    async def run(
        self,
        user_request: str,
        target_audience: str = "enfants 6-10 ans",
        target_duration: float = 60.0,
        job_id: str | None = None
    ) -> VideoGenerationState:
        """
        Exécute le workflow complet de génération.
        
        Args:
            user_request: Demande de l'utilisateur
            target_audience: Public cible
            target_duration: Durée cible en secondes
            job_id: ID du job (généré si non fourni)
            
        Returns:
            État final du workflow
        """
        job_id = job_id or str(uuid.uuid4())
        
        initial_state = VideoGenerationState(
            job_id=job_id,
            user_request=user_request,
            target_audience=target_audience,
            target_duration=target_duration,
            status=GenerationStatus.PENDING,
            progress=0.0,
            current_step="Démarrage de la génération..."
        )
        
        logger.info(
            "workflow_starting",
            job_id=job_id,
            request=user_request[:100]
        )
        
        config = {"configurable": {"thread_id": job_id}}
        
        try:
            # Exécuter le graphe
            final_state = await self.compiled.ainvoke(
                initial_state.model_dump(),
                config=config
            )
            
            logger.info(
                "workflow_completed",
                job_id=job_id,
                status=final_state.get("status"),
                video_path=final_state.get("final_video_path")
            )
            
            return VideoGenerationState(**final_state)
            
        except Exception as e:
            logger.error(
                "workflow_error",
                job_id=job_id,
                error=str(e)
            )
            initial_state.set_error(str(e))
            return initial_state
    
    async def stream(
        self,
        user_request: str,
        target_audience: str = "enfants 6-10 ans",
        target_duration: float = 60.0,
        job_id: str | None = None
    ):
        """
        Exécute le workflow avec streaming des événements.
        Permet de suivre la progression en temps réel.
        """
        job_id = job_id or str(uuid.uuid4())
        
        initial_state = VideoGenerationState(
            job_id=job_id,
            user_request=user_request,
            target_audience=target_audience,
            target_duration=target_duration,
            status=GenerationStatus.PENDING,
            progress=0.0,
            current_step="Démarrage de la génération..."
        )
        
        config = {"configurable": {"thread_id": job_id}}
        
        async for event in self.compiled.astream(
            initial_state.model_dump(),
            config=config
        ):
            yield event


def create_workflow() -> VideoGenerationWorkflow:
    """Factory function pour créer un workflow."""
    return VideoGenerationWorkflow()

