"""
EducAIKids Backend - FastAPI Application
Point d'entrée principal de l'application.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import structlog

from .config import get_settings
from .api.routes import router as api_router

# Configuration du logging structuré
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.dev.ConsoleRenderer(colors=True)
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application."""
    settings = get_settings()
    
    logger.info(
        "application_starting",
        app_name=settings.app_name,
        version=settings.app_version,
        debug=settings.debug
    )
    
    # Créer les dossiers nécessaires
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    settings.temp_dir.mkdir(parents=True, exist_ok=True)
    
    yield
    
    logger.info("application_shutting_down")


def create_app() -> FastAPI:
    """Factory function pour créer l'application FastAPI."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        description="""
        🎬 **EducAIKids API** - Génération automatique de vidéos éducatives animées
        
        Cette API permet de transformer une requête en langage naturel en une 
        vidéo éducative complète avec:
        - Script narratif généré par IA
        - Images cartoon générées
        - Voix off naturelle
        - Musique de fond
        - Animation et montage final
        """,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    
    # Configuration CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Monter les fichiers statiques (vidéos générées)
    if settings.output_dir.exists():
        app.mount(
            "/outputs",
            StaticFiles(directory=str(settings.output_dir)),
            name="outputs"
        )
    
    # Inclure les routes API
    app.include_router(api_router)
    
    @app.get("/")
    async def root():
        """Page d'accueil de l'API."""
        return {
            "message": f"Bienvenue sur {settings.app_name}",
            "version": settings.app_version,
            "docs": "/docs",
            "health": "/api/v1/health"
        }
    
    return app


# Instance de l'application
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )

