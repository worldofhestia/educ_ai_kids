"""
API Routes for EducAIKids.
"""

import shutil
import uuid
from typing import Optional
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
import structlog

from ..models.requests import (
    GenerateVideoRequest,
    GenerationStatusResponse,
    JobCreatedResponse,
    VideoListItem,
    ErrorResponse,
)
from ..models.state import GenerationStatus, VideoGenerationState
from ..graph.workflow import create_workflow
from ..config import get_settings

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1", tags=["video-generation"])

# Store en mémoire pour les jobs (remplacer par Redis/DB en production)
jobs_store: dict[str, VideoGenerationState] = {}


def validate_job_id(job_id: str) -> None:
    """Valide que le job_id est un UUID valide (protection path traversal)."""
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de job invalide")


def get_job(job_id: str) -> Optional[VideoGenerationState]:
    """Récupère un job par son ID."""
    return jobs_store.get(job_id)


def update_job(job_id: str, state: VideoGenerationState):
    """Met à jour un job."""
    jobs_store[job_id] = state


async def run_generation_task(job_id: str, request: GenerateVideoRequest):
    """
    Tâche de fond pour la génération de vidéo.
    """
    try:
        logger.info("generation_task_started", job_id=job_id)
        
        workflow = create_workflow()
        
        # Exécuter avec streaming pour mettre à jour le statut
        async for event in workflow.stream(
            user_request=request.prompt,
            target_audience=request.target_audience,
            target_duration=request.target_duration,
            job_id=job_id
        ):
            # Mettre à jour le store avec chaque événement
            for node_name, node_output in event.items():
                if isinstance(node_output, dict):
                    current = get_job(job_id)
                    if current:
                        for key, value in node_output.items():
                            if hasattr(current, key):
                                setattr(current, key, value)
                        update_job(job_id, current)
        
        logger.info("generation_task_completed", job_id=job_id)
        
    except Exception as e:
        logger.error("generation_task_failed", job_id=job_id, error=str(e))
        job = get_job(job_id)
        if job:
            job.set_error(str(e))
            update_job(job_id, job)


@router.post(
    "/generate",
    response_model=JobCreatedResponse,
    responses={400: {"model": ErrorResponse}}
)
async def generate_video(
    request: GenerateVideoRequest,
    background_tasks: BackgroundTasks
):
    """
    Démarre la génération d'une vidéo éducative.
    
    La génération s'exécute en arrière-plan. Utilisez l'endpoint
    /status/{job_id} pour suivre la progression.
    """
    job_id = str(uuid.uuid4())
    
    # Créer l'état initial
    initial_state = VideoGenerationState(
        job_id=job_id,
        user_request=request.prompt,
        target_audience=request.target_audience,
        target_duration=request.target_duration,
        status=GenerationStatus.PENDING,
        progress=0.0,
        current_step="En attente de traitement..."
    )
    
    update_job(job_id, initial_state)
    
    # Lancer la tâche en arrière-plan
    background_tasks.add_task(run_generation_task, job_id, request)
    
    logger.info(
        "generation_started",
        job_id=job_id,
        prompt=request.prompt[:100]
    )
    
    return JobCreatedResponse(
        job_id=job_id,
        message="Génération démarrée",
        status=GenerationStatus.PENDING
    )


@router.get(
    "/status/{job_id}",
    response_model=GenerationStatusResponse,
    responses={404: {"model": ErrorResponse}}
)
async def get_status(job_id: str):
    """
    Récupère le statut de génération d'une vidéo.

    Utilisez cet endpoint en polling pour suivre la progression.
    """
    validate_job_id(job_id)
    job = get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job non trouvé")

    video_url = None
    
    if job.final_video_path and Path(job.final_video_path).exists():
        video_url = f"/api/v1/video/{job_id}"
    
    return GenerationStatusResponse(
        job_id=job_id,
        status=job.status,
        progress=job.progress,
        current_step=job.current_step,
        error_message=job.error_message,
        video_url=video_url,
        title=job.script_title
    )


@router.get(
    "/video/{job_id}",
    responses={
        200: {"content": {"video/mp4": {}}},
        404: {"model": ErrorResponse}
    }
)
async def get_video(job_id: str):
    """
    Télécharge la vidéo générée.

    Disponible uniquement après que le statut soit 'completed'.
    """
    validate_job_id(job_id)
    job = get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job non trouvé")
    
    if job.status != GenerationStatus.COMPLETED:
        raise HTTPException(
            status_code=400, 
            detail=f"Vidéo non prête. Statut actuel: {job.status}"
        )
    
    if not job.final_video_path or not Path(job.final_video_path).exists():
        raise HTTPException(status_code=404, detail="Fichier vidéo non trouvé")
    
    return FileResponse(
        job.final_video_path,
        media_type="video/mp4",
        filename=f"{job.script_title or 'video'}.mp4"
    )


@router.get("/videos", response_model=list[VideoListItem])
async def list_videos():
    """
    Liste toutes les vidéos générées.
    """
    settings = get_settings()
    videos = []
    
    for job_id, job in jobs_store.items():
        video_url = None
        if job.final_video_path and Path(job.final_video_path).exists():
            video_url = f"/api/v1/video/{job_id}"
        
        videos.append(VideoListItem(
            job_id=job_id,
            title=job.script_title,
            status=job.status,
            created_at=job.created_at.isoformat(),
            video_url=video_url
        ))
    
    return videos


@router.delete(
    "/video/{job_id}",
    responses={404: {"model": ErrorResponse}}
)
async def delete_video(job_id: str):
    """
    Supprime une vidéo et ses fichiers associés.
    """
    validate_job_id(job_id)
    job = get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job non trouvé")
    
    settings = get_settings()
    
    # Supprimer les fichiers
    if job.final_video_path and Path(job.final_video_path).exists():
        Path(job.final_video_path).unlink()
    
    # Supprimer le dossier temp
    temp_dir = settings.temp_dir / job_id
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    # Supprimer le dossier output
    output_dir = settings.output_dir / job_id
    if output_dir.exists():
        shutil.rmtree(output_dir)
    
    # Supprimer du store
    del jobs_store[job_id]
    
    logger.info("video_deleted", job_id=job_id)
    
    return {"message": "Vidéo supprimée"}


@router.get("/health")
async def health_check():
    """Vérifie que l'API est opérationnelle."""
    return {
        "status": "healthy",
        "version": get_settings().app_version
    }

