"""
Request and Response models for API endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field

from .state import GenerationStatus


class GenerateVideoRequest(BaseModel):
    """Requête pour générer une vidéo éducative."""
    
    prompt: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Description en langage naturel de la vidéo souhaitée",
        examples=["Explique-moi comment les abeilles font du miel"]
    )
    target_audience: str = Field(
        default="enfants 6-10 ans",
        description="Public cible de la vidéo"
    )
    target_duration: float = Field(
        default=60.0,
        ge=30.0,
        le=180.0,
        description="Durée cible en secondes (30-180s)"
    )


class GenerationStatusResponse(BaseModel):
    """Réponse avec le statut de génération."""
    
    job_id: str
    status: GenerationStatus
    progress: float = Field(ge=0.0, le=100.0)
    current_step: str
    error_message: Optional[str] = None
    video_url: Optional[str] = None
    title: Optional[str] = None
    
    class Config:
        use_enum_values = True


class JobCreatedResponse(BaseModel):
    """Réponse après création d'un job."""
    
    job_id: str
    message: str = "Génération démarrée"
    status: GenerationStatus = GenerationStatus.PENDING


class VideoListItem(BaseModel):
    """Item de la liste des vidéos générées."""
    
    job_id: str
    title: Optional[str]
    status: GenerationStatus
    created_at: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


class ErrorResponse(BaseModel):
    """Réponse d'erreur standard."""
    
    detail: str
    error_code: Optional[str] = None

