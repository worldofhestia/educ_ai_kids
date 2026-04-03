"""
Configuration settings for EducAIKids backend.
Utilise pydantic-settings pour la gestion des variables d'environnement.
"""

import os
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # API Configuration
    app_name: str = "EducAIKids"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # OpenRouter Configuration (LLM principal)
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "anthropic/claude-3.5-sonnet"
    
    # Replicate Configuration
    replicate_api_token: str = ""
    
    # Modèles Replicate
    replicate_image_model: str = "black-forest-labs/flux-schnell"
    replicate_tts_model: str = "minimax/speech-02-turbo"  # Options: minimax/speech-02-turbo, kokoro, parler, styletts2, bark
    replicate_music_model: str = "meta/musicgen"
    replicate_video_model: str = "wan-video/wan-2.2-i2v-fast"  # Image-to-Video animation
    
    # Redis (pour Celery)
    redis_url: str = "redis://localhost:6379/0"
    
    # Stockage des fichiers générés
    output_dir: Path = Path("./outputs")
    temp_dir: Path = Path("./temp")
    
    # Paramètres de génération
    max_scenes: int = 10
    scene_duration_min: float = 3.0
    scene_duration_max: float = 5.0
    video_resolution: str = "480p"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Créer les dossiers s'ils n'existent pas
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Configurer les tokens API dans l'environnement
        self._configure_api_tokens()
    
    def _configure_api_tokens(self):
        """Configure les tokens API dans les variables d'environnement."""
        # Replicate utilise REPLICATE_API_TOKEN par défaut
        if self.replicate_api_token:
            os.environ["REPLICATE_API_TOKEN"] = self.replicate_api_token
        
        # OpenAI/OpenRouter
        if self.openrouter_api_key:
            os.environ["OPENAI_API_KEY"] = self.openrouter_api_key


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

