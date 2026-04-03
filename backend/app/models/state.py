"""
State models for LangGraph workflow.
Définit l'état partagé entre tous les agents du workflow.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Annotated, Optional
from pydantic import BaseModel, ConfigDict, Field
from langgraph.graph.message import add_messages


class GenerationStatus(str, Enum):
    """Statut de la génération vidéo."""
    PENDING = "pending"
    GENERATING_SCRIPT = "generating_script"
    GENERATING_NARRATION = "generating_narration"
    GENERATING_IMAGES = "generating_images"
    GENERATING_VOICE = "generating_voice"
    GENERATING_MUSIC = "generating_music"
    GENERATING_VIDEO_CLIPS = "generating_video_clips"
    ASSEMBLING = "assembling"
    COMPLETED = "completed"
    FAILED = "failed"


class Scene(BaseModel):
    """Représente une scène de la vidéo éducative."""
    
    id: int = Field(..., description="Identifiant unique de la scène")
    narration_text: str = Field(..., description="Texte de narration pour cette scène")
    visual_description: str = Field(..., description="Description visuelle pour la génération d'image")
    duration: float = Field(default=4.0, description="Durée de la scène en secondes")
    start_time: float = Field(default=0.0, description="Temps de début dans la vidéo finale")
    
    # Chemins des fichiers générés
    image_path: Optional[str] = Field(default=None, description="Chemin de l'image statique")
    video_clip_path: Optional[str] = Field(default=None, description="Chemin du clip vidéo animé")
    
    # Métadonnées
    animation_prompt: Optional[str] = Field(
        default=None, 
        description="Prompt pour l'animation de l'image"
    )


class VideoGenerationState(BaseModel):
    """
    État principal du workflow LangGraph.
    Partagé et mis à jour par tous les agents.
    """
    
    # Entrée utilisateur
    job_id: str = Field(..., description="Identifiant unique du job")
    user_request: str = Field(..., description="Requête originale de l'utilisateur")
    target_audience: str = Field(default="enfants 6-10 ans", description="Public cible")
    target_duration: float = Field(default=60.0, description="Durée cible en secondes")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Date de création")
    
    # Statut
    status: GenerationStatus = Field(default=GenerationStatus.PENDING)
    progress: float = Field(default=0.0, description="Progression 0-100")
    current_step: str = Field(default="Initialisation", description="Étape actuelle")
    error_message: Optional[str] = Field(default=None)
    
    # Script et narration
    script_title: Optional[str] = Field(default=None, description="Titre de la vidéo")
    script_full: Optional[str] = Field(default=None, description="Script narratif complet")
    scenes: list[Scene] = Field(default_factory=list, description="Liste des scènes")
    
    # Fichiers audio
    voice_path: Optional[str] = Field(default=None, description="Chemin du fichier voix off")
    music_path: Optional[str] = Field(default=None, description="Chemin de la musique de fond")
    voice_duration: Optional[float] = Field(default=None, description="Durée de la voix off")
    
    # Fichier final
    final_video_path: Optional[str] = Field(default=None, description="Chemin de la vidéo finale")
    
    # Messages pour le workflow (utilisé par LangGraph)
    messages: Annotated[list, add_messages] = Field(default_factory=list)
    
    def update_progress(self, status: GenerationStatus, progress: float, step: str):
        """Met à jour le statut de progression."""
        self.status = status
        self.progress = min(100.0, max(0.0, progress))
        self.current_step = step
    
    def set_error(self, error: str):
        """Marque le job comme échoué."""
        self.status = GenerationStatus.FAILED
        self.error_message = error
    
    model_config = ConfigDict(use_enum_values=True)

