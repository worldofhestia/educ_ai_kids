"""
Base Agent class for all LangGraph agents.
"""

from abc import ABC, abstractmethod
from typing import Any
import structlog

from langchain_openai import ChatOpenAI

from ..config import get_settings
from ..models.state import VideoGenerationState

logger = structlog.get_logger()


class BaseAgent(ABC):
    """Classe de base pour tous les agents LangGraph."""
    
    def __init__(self):
        self.settings = get_settings()
        self._llm = None
    
    @property
    def llm(self) -> ChatOpenAI:
        """Lazy loading du LLM via OpenRouter."""
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=self.settings.openrouter_model,
                openai_api_key=self.settings.openrouter_api_key,
                openai_api_base=self.settings.openrouter_base_url,
                temperature=0.7,
                max_tokens=4096,
            )
        return self._llm
    
    @abstractmethod
    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        """
        Traite l'état actuel et retourne les mises à jour.
        
        Args:
            state: État actuel du workflow
            
        Returns:
            Dictionnaire des champs à mettre à jour dans l'état
        """
        pass
    
    async def __call__(self, state: VideoGenerationState) -> dict[str, Any]:
        """Permet d'utiliser l'agent comme un callable pour LangGraph."""
        return await self.process(state)

