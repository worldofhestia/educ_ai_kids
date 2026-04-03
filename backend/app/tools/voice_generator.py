"""
Voice Generator Tool using multiple TTS models on Replicate.
Génère la voix off naturelle pour le script narratif.
Utilise plusieurs modèles avec fallback automatique.
"""

import asyncio
import wave
from pathlib import Path
from typing import Optional
import httpx
import replicate
from replicate.exceptions import ReplicateError
import structlog

from ..config import get_settings

logger = structlog.get_logger()


# Modèles TTS disponibles avec leurs configurations
TTS_MODELS = {
    # MiniMax Speech-02-Turbo - Rapide et haute qualité, multilingue
    # Configuration optimisée avec voix French_MaleNarrator pour le français
    "minimax/speech-02-turbo": {
        "model": "minimax/speech-02-turbo",
        "input_builder": lambda text, lang: {
            "text": text,
            "voice_id": "French_MaleNarrator",  # Voix narrateur français
            "speed": 1.2,           # Vitesse légèrement accélérée
            "pitch": 0,             # Tonalité normale
            "volume": 1,            # Volume normal
            "bitrate": 128000,      # Bitrate haute qualité
            "sample_rate": 32000,   # Fréquence d'échantillonnage 32kHz
            "channel": "mono",      # Canal mono (suffisant pour voix)
            "audio_format": "wav",  # Format WAV pour MoviePy
            "language_boost": "French" if lang == "fr" else lang.title() if lang in ["en", "es", "de", "it", "pt", "zh", "ja", "ko"] else "French",
            "emotion": "auto",      # Émotion automatique selon le contexte
            "subtitle_enable": False,
            "english_normalization": False,
        },
        "output_key": None,
    },
    # Kokoro TTS - Haute qualité, supporte français
    "kokoro": {
        "model": "jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13",
        "input_builder": lambda text, lang: {
            "text": text,
            "speed": 1.0,
            "voice": "af_heart",  # Voix féminine naturelle
        },
        "output_key": None,
    },
    # Parler TTS - Simple et efficace
    "parler": {
        "model": "cjwbw/parler-tts:6dce1ae37d5f7e8d47d0f26427e85bccf7a52572167eeae12f5a1c3e0a2fbb2b",
        "input_builder": lambda text, lang: {
            "prompt": text,
            "description": "A female speaker with a soft, calm, and friendly voice, speaking at a moderate pace with clear pronunciation.",
        },
        "output_key": None,
    },
    # StyleTTS2 - Très haute qualité
    "styletts2": {
        "model": "adirik/styletts2:989cb5ea6d2401314eb30685740cb9f6fd1c9001b8940659b406f952837ab5ac",
        "input_builder": lambda text, lang: {
            "text": text,
            "alpha": 0.3,
            "beta": 0.7,
            "diffusion_steps": 5,
            "embedding_scale": 1,
        },
        "output_key": None,
    },
    # Bark - Génération avec émotions (fallback)
    "bark": {
        "model": "suno-ai/bark:b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787",
        "input_builder": lambda text, lang: {
            "prompt": text,
            "text_temp": 0.7,
            "waveform_temp": 0.7,
        },
        "output_key": "audio_out",
    },
}


class VoiceGenerator:
    """Générateur de voix off utilisant plusieurs modèles TTS via Replicate."""
    
    # Rate limiting settings
    MAX_RETRIES = 3
    RETRY_DELAY_BASE = 15
    
    # Ordre de préférence des modèles
    MODEL_PRIORITY = ["minimax/speech-02-turbo", "kokoro", "parler", "styletts2", "bark"]
    
    def __init__(self):
        self.settings = get_settings()
    
    async def _try_model(
        self,
        model_key: str,
        text: str,
        language: str,
        output_path: Path
    ) -> Optional[tuple[str, float]]:
        """Essaie de générer avec un modèle spécifique."""
        if model_key not in TTS_MODELS:
            return None
        
        model_config = TTS_MODELS[model_key]
        
        for attempt in range(self.MAX_RETRIES):
            try:
                logger.info(
                    "trying_tts_model",
                    model=model_key,
                    attempt=attempt + 1,
                    text_length=len(text)
                )
                
                # Construire les paramètres d'entrée
                input_params = model_config["input_builder"](text, language)
                
                # Appel Replicate avec timeout de 5 minutes
                output = await asyncio.wait_for(
                    asyncio.to_thread(
                        replicate.run,
                        model_config["model"],
                        input=input_params
                    ),
                    timeout=300.0
                )
                
                if not output:
                    logger.warning("no_output", model=model_key)
                    return None
                
                # Extraire l'URL audio selon la config du modèle
                output_key = model_config.get("output_key")
                if output_key:
                    audio_url = output.get(output_key) if isinstance(output, dict) else output
                else:
                    audio_url = output if isinstance(output, str) else str(output)
                
                if not audio_url:
                    logger.warning("no_audio_url", model=model_key)
                    return None
                
                # Télécharger l'audio
                audio_filename = output_path / "voiceover.wav"
                
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.get(str(audio_url))
                    response.raise_for_status()
                    audio_filename.write_bytes(response.content)
                
                # Calculer la durée réelle du fichier WAV
                try:
                    with wave.open(str(audio_filename), 'rb') as wf:
                        frames = wf.getnframes()
                        rate = wf.getframerate()
                        estimated_duration = frames / float(rate)
                except Exception:
                    # Fallback : estimation par taille de fichier
                    file_size = audio_filename.stat().st_size
                    estimated_duration = max(file_size / 44000, len(text) / 5 / 150 * 60)
                
                logger.info(
                    "voice_generated",
                    model=model_key,
                    path=str(audio_filename),
                    estimated_duration=estimated_duration
                )
                
                return str(audio_filename), estimated_duration
                
            except asyncio.TimeoutError:
                logger.error("tts_timeout", model=model_key, attempt=attempt + 1)
                return None
            except ReplicateError as e:
                error_str = str(e)
                if "429" in error_str or "throttled" in error_str.lower():
                    wait_time = self.RETRY_DELAY_BASE * (attempt + 1)
                    logger.warning(
                        "rate_limited",
                        model=model_key,
                        attempt=attempt + 1,
                        wait_seconds=wait_time
                    )
                    await asyncio.sleep(wait_time)
                elif "404" in error_str:
                    logger.warning("model_not_found", model=model_key)
                    return None  # Passer au modèle suivant
                else:
                    logger.error("model_error", model=model_key, error=error_str)
                    return None
            except Exception as e:
                logger.error("unexpected_error", model=model_key, error=str(e))
                return None
        
        return None
    
    async def generate_voice(
        self,
        text: str,
        output_path: Path,
        language: str = "fr",
        speaker_url: Optional[str] = None
    ) -> Optional[tuple[str, float]]:
        """
        Génère la voix off avec fallback automatique entre modèles.
        
        Args:
            text: Texte à synthétiser
            output_path: Chemin de sortie pour le fichier audio
            language: Code langue (défaut: français)
            speaker_url: Non utilisé (conservé pour compatibilité)
            
        Returns:
            Tuple (chemin du fichier audio, durée en secondes) ou None
        """
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Essayer chaque modèle dans l'ordre de priorité
        for model_key in self.MODEL_PRIORITY:
            logger.info("trying_model", model=model_key)
            
            result = await self._try_model(model_key, text, language, output_path)
            
            if result:
                return result
            
            # Délai entre les tentatives de modèles différents
            await asyncio.sleep(2)
        
        logger.error("all_tts_models_failed")
        return None


# Alias pour la compatibilité
VoiceGeneratorCoqui = VoiceGenerator
