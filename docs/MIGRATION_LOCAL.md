# 🖥️ Guide de Migration EducAIKids vers une Installation 100% Locale

> **Configuration cible** : PC fixe avec RTX 5070 Ti (16GB VRAM), 32GB DDR5, Intel i7 14700KF

Ce document recense toutes les modifications nécessaires pour migrer le projet EducAIKids d'une stack Cloud (OpenRouter + Replicate) vers une exécution entièrement locale.

---

## 📊 Vue d'ensemble de la migration

| Composant | Actuel (Cloud) | Futur (Local) | Impact |
|-----------|----------------|---------------|--------|
| **LLM** | OpenRouter (Claude) | Ollama (Qwen 2.5 / Mistral Nemo) | 🟡 Moyen |
| **Images** | Replicate (FLUX Schnell) | Diffusers (FLUX.1-dev) | 🟡 Moyen |
| **TTS** | Replicate (MiniMax) | Coqui XTTS v2 | 🟡 Moyen |
| **Musique** | Replicate (MusicGen) | AudioCraft Local | 🟢 Simple |
| **Vidéo I2V** | Replicate (Wan 2.2) | Diffusers (SVD-XT) | 🟡 Moyen |
| **Frontend** | React/Next.js | Aucun changement | 🟢 Aucun |
| **Backend** | FastAPI + LangGraph | Mêmes frameworks | 🟢 Minimal |

---

## 📁 Fichiers à modifier

```
backend/
├── app/
│   ├── config.py                    # [MODIFIER] Ajouter config locale
│   ├── agents/
│   │   └── base.py                  # [MODIFIER] Support Ollama
│   └── tools/
│       ├── image_generator.py       # [MODIFIER] Support FLUX local
│       ├── voice_generator.py       # [MODIFIER] Support XTTS v2
│       ├── music_generator.py       # [MODIFIER] Support AudioCraft
│       └── video_animator.py        # [MODIFIER] Support SVD local
├── .env                             # [MODIFIER] Variables locales
└── pyproject.toml                   # [MODIFIER] Nouvelles dépendances
```

---

## 🔧 Phase 1 : Configuration de base

### 1.1 Modification de `.env`

```env
# EducAIKids Backend Environment Variables - LOCAL MODE

# === MODE LOCAL ===
USE_LOCAL_MODELS=true

# === Ollama LLM ===
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b     # Excellent en français, ~9GB VRAM

# === Models Cache (important pour SSD/HDD) ===
HF_HOME=D:/models/huggingface
TORCH_HOME=D:/models/torch
TRANSFORMERS_CACHE=D:/models/transformers

# === GPU Settings ===
CUDA_VISIBLE_DEVICES=0

# === Paramètres locaux ===
LOCAL_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
LOCAL_TTS_MODEL=tts_models/multilingual/multi-dataset/xtts_v2
LOCAL_MUSIC_MODEL=facebook/musicgen-medium
LOCAL_VIDEO_MODEL=stabilityai/stable-video-diffusion-img2vid-xt
```

---

### 1.2 Modification de `config.py`

```python
# backend/app/config.py - AJOUTS

class Settings(BaseSettings):
    # ... config existante ...
    
    # === Mode Local ===
    use_local_models: bool = False
    
    # === Ollama Configuration ===
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:14b"
    
    # === Local Models ===
    local_image_model: str = "black-forest-labs/FLUX.1-dev"
    local_tts_model: str = "tts_models/multilingual/multi-dataset/xtts_v2"
    local_music_model: str = "facebook/musicgen-medium"
    local_video_model: str = "stabilityai/stable-video-diffusion-img2vid-xt"
    
    # === GPU Offloading ===
    enable_cpu_offload: bool = True  # Économise VRAM
    use_float16: bool = True         # Demi-précision pour vitesse
```

---

## 🧠 Phase 2 : Migration LLM (Ollama)

### 2.1 Installation Ollama

```bash
# Windows - Télécharger depuis https://ollama.ai/download
# Puis dans PowerShell :
ollama pull qwen2.5:14b       # ~9GB - Excellent français
ollama pull mistral-nemo:12b  # ~7GB - Alternative
```

### 2.2 Modification de `base.py`

```python
# backend/app/agents/base.py - VERSION COMPLÈTE

"""
Base Agent class for all LangGraph agents.
Supporte OpenRouter (Cloud) et Ollama (Local).
"""

from abc import ABC, abstractmethod
from typing import Any
import structlog

from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama  # <-- NOUVEAU

from ..config import get_settings
from ..models.state import VideoGenerationState

logger = structlog.get_logger()


class BaseAgent(ABC):
    """Classe de base pour tous les agents LangGraph."""
    
    def __init__(self):
        self.settings = get_settings()
        self._llm = None
    
    @property
    def llm(self):
        """Lazy loading du LLM - Cloud ou Local selon config."""
        if self._llm is None:
            if self.settings.use_local_models:
                # Mode LOCAL avec Ollama
                self._llm = ChatOllama(
                    model=self.settings.ollama_model,
                    base_url=self.settings.ollama_base_url,
                    temperature=0.7,
                )
                logger.info("llm_initialized", mode="local", model=self.settings.ollama_model)
            else:
                # Mode CLOUD avec OpenRouter
                self._llm = ChatOpenAI(
                    model=self.settings.openrouter_model,
                    openai_api_key=self.settings.openrouter_api_key,
                    openai_api_base=self.settings.openrouter_base_url,
                    temperature=0.7,
                    max_tokens=4096,
                )
                logger.info("llm_initialized", mode="cloud", model=self.settings.openrouter_model)
        return self._llm
    
    @abstractmethod
    async def process(self, state: VideoGenerationState) -> dict[str, Any]:
        pass
    
    def __call__(self, state: VideoGenerationState) -> dict[str, Any]:
        import asyncio
        return asyncio.run(self.process(state))
```

### 2.3 Dépendance à ajouter

```bash
uv add langchain-ollama
```

---

## 🖼️ Phase 3 : Migration Génération d'Images (FLUX Local)

### 3.1 Modification de `image_generator.py`

```python
# backend/app/tools/image_generator.py - VERSION AVEC SUPPORT LOCAL

"""
Image Generator Tool - Cloud (Replicate) et Local (Diffusers FLUX).
"""

import asyncio
from pathlib import Path
from typing import Optional
from uuid import uuid4
import httpx
import structlog
import torch

from ..config import get_settings

logger = structlog.get_logger()


class LocalImageGenerator:
    """Générateur d'images local utilisant FLUX.1-dev via Diffusers."""
    
    STYLE_PROMPT = (
        "cartoon style, simple educational illustration, clean lines, "
        "bright colors, child-friendly, professional quality, "
        "digital art, cute characters, soft lighting"
    )
    
    def __init__(self):
        self.settings = get_settings()
        self._pipe = None
    
    @property
    def pipe(self):
        """Lazy loading du pipeline FLUX."""
        if self._pipe is None:
            from diffusers import FluxPipeline
            
            logger.info("loading_flux_model", model=self.settings.local_image_model)
            
            self._pipe = FluxPipeline.from_pretrained(
                self.settings.local_image_model,
                torch_dtype=torch.float16 if self.settings.use_float16 else torch.float32,
            )
            
            if self.settings.enable_cpu_offload:
                self._pipe.enable_model_cpu_offload()
            else:
                self._pipe.to("cuda")
            
            logger.info("flux_model_loaded")
        return self._pipe
    
    def _build_prompt(self, scene_description: str) -> str:
        return f"{self.STYLE_PROMPT}, {scene_description}"
    
    async def generate_image(
        self,
        scene_description: str,
        output_path: Path,
        scene_id: int,
        aspect_ratio: str = "16:9"
    ) -> Optional[str]:
        """Génère une image localement avec FLUX."""
        prompt = self._build_prompt(scene_description)
        
        # Dimensions selon aspect ratio
        dimensions = {
            "16:9": (1024, 576),
            "4:3": (1024, 768),
            "1:1": (1024, 1024),
        }
        width, height = dimensions.get(aspect_ratio, (1024, 576))
        
        try:
            logger.info("generating_image_local", scene_id=scene_id)
            
            # Génération dans thread séparé (sync->async)
            def _generate():
                result = self.pipe(
                    prompt=prompt,
                    height=height,
                    width=width,
                    num_inference_steps=25,  # Balance vitesse/qualité
                    guidance_scale=7.5,
                    generator=torch.Generator("cuda").manual_seed(42 + scene_id),
                )
                return result.images[0]
            
            image = await asyncio.to_thread(_generate)
            
            # Sauvegarder
            output_path.mkdir(parents=True, exist_ok=True)
            image_filename = output_path / f"scene_{scene_id:03d}.png"
            image.save(str(image_filename))
            
            logger.info("image_generated_local", scene_id=scene_id, path=str(image_filename))
            return str(image_filename)
            
        except Exception as e:
            logger.error("local_image_generation_failed", scene_id=scene_id, error=str(e))
            return None
    
    async def generate_batch(
        self,
        scenes: list[dict],
        output_path: Path
    ) -> list[Optional[str]]:
        """Génère les images séquentiellement (GPU unique)."""
        results = []
        for idx, scene in enumerate(scenes):
            logger.info("batch_progress", current=idx + 1, total=len(scenes))
            result = await self.generate_image(
                scene["visual_description"],
                output_path,
                scene["id"]
            )
            results.append(result)
        return results


# Factory function pour choisir le bon générateur
def get_image_generator():
    """Retourne le générateur approprié selon la config."""
    settings = get_settings()
    if settings.use_local_models:
        return LocalImageGenerator()
    else:
        from .image_generator_cloud import ImageGenerator  # Renommer l'ancien
        return ImageGenerator()
```

### 3.2 Dépendances à ajouter

```bash
uv add diffusers accelerate transformers sentencepiece
```

---

## 🎤 Phase 4 : Migration TTS (Coqui XTTS v2)

### 4.1 Modification de `voice_generator.py`

```python
# backend/app/tools/voice_generator.py - VERSION AVEC SUPPORT LOCAL

"""
Voice Generator Tool - Cloud (Replicate) et Local (Coqui XTTS v2).
"""

import asyncio
from pathlib import Path
from typing import Optional
import structlog

from ..config import get_settings

logger = structlog.get_logger()


class LocalVoiceGenerator:
    """Générateur de voix local utilisant Coqui XTTS v2."""
    
    def __init__(self):
        self.settings = get_settings()
        self._tts = None
    
    @property
    def tts(self):
        """Lazy loading du modèle TTS."""
        if self._tts is None:
            from TTS.api import TTS
            
            logger.info("loading_xtts_model", model=self.settings.local_tts_model)
            
            self._tts = TTS(
                model_name=self.settings.local_tts_model,
                progress_bar=False,
                gpu=True
            )
            
            logger.info("xtts_model_loaded")
        return self._tts
    
    async def generate_voice(
        self,
        text: str,
        output_path: Path,
        language: str = "fr",
        speaker_wav: Optional[str] = None
    ) -> Optional[tuple[str, float]]:
        """
        Génère la voix off avec XTTS v2.
        
        Args:
            text: Texte à synthétiser
            output_path: Chemin de sortie
            language: Code langue (fr, en, etc.)
            speaker_wav: Fichier audio pour clonage vocal (optionnel)
        
        Returns:
            Tuple (chemin audio, durée estimée) ou None
        """
        output_path.mkdir(parents=True, exist_ok=True)
        audio_filename = output_path / "voiceover.wav"
        
        try:
            logger.info("generating_voice_local", text_length=len(text))
            
            # Génération dans thread séparé
            def _generate():
                if speaker_wav:
                    # Mode clonage vocal
                    self.tts.tts_to_file(
                        text=text,
                        file_path=str(audio_filename),
                        speaker_wav=speaker_wav,
                        language=language,
                        split_sentences=True,  # Meilleure qualité textes longs
                    )
                else:
                    # Mode voix par défaut (utilise speaker intégré)
                    self.tts.tts_to_file(
                        text=text,
                        file_path=str(audio_filename),
                        language=language,
                        split_sentences=True,
                    )
            
            await asyncio.to_thread(_generate)
            
            # Calculer durée estimée
            file_size = audio_filename.stat().st_size
            estimated_duration = max(file_size / 44000, len(text) / 5 / 150 * 60)
            
            logger.info(
                "voice_generated_local",
                path=str(audio_filename),
                duration=estimated_duration
            )
            
            return str(audio_filename), estimated_duration
            
        except Exception as e:
            logger.error("local_voice_generation_failed", error=str(e))
            return None


# Factory function
def get_voice_generator():
    settings = get_settings()
    if settings.use_local_models:
        return LocalVoiceGenerator()
    else:
        from .voice_generator_cloud import VoiceGenerator
        return VoiceGenerator()
```

### 4.2 Dépendance à ajouter

```bash
uv add TTS
```

> ⚠️ **Note** : La première exécution téléchargera le modèle XTTS v2 (~2GB).

---

## 🎵 Phase 5 : Migration Musique (AudioCraft Local)

### 5.1 Modification de `music_generator.py`

```python
# backend/app/tools/music_generator.py - VERSION AVEC SUPPORT LOCAL

"""
Music Generator Tool - Cloud (Replicate) et Local (AudioCraft MusicGen).
"""

import asyncio
from pathlib import Path
from typing import Optional
import structlog
import torch
import torchaudio

from ..config import get_settings

logger = structlog.get_logger()


class LocalMusicGenerator:
    """Générateur de musique local utilisant AudioCraft MusicGen."""
    
    MUSIC_PROMPTS = {
        "default": (
            "calm instrumental background music, educational video, "
            "soft piano and strings, gentle melody, child-friendly, "
            "positive mood, 80 bpm, ambient, no lyrics"
        ),
        "science": (
            "curious instrumental music, discovery theme, "
            "light electronic with orchestral, educational, "
            "inspiring, 90 bpm, no lyrics"
        ),
        "nature": (
            "peaceful nature music, soft flutes and acoustic guitar, "
            "calm and relaxing, educational, 70 bpm, no lyrics"
        ),
    }
    
    def __init__(self):
        self.settings = get_settings()
        self._model = None
    
    @property
    def model(self):
        """Lazy loading du modèle MusicGen."""
        if self._model is None:
            from audiocraft.models import MusicGen
            
            # Mapping des noms de modèles
            model_map = {
                "facebook/musicgen-small": "small",
                "facebook/musicgen-medium": "medium",
                "facebook/musicgen-large": "large",
            }
            model_size = model_map.get(self.settings.local_music_model, "medium")
            
            logger.info("loading_musicgen_model", size=model_size)
            
            self._model = MusicGen.get_pretrained(model_size)
            self._model.set_generation_params(duration=30)  # Max 30s
            
            logger.info("musicgen_model_loaded")
        return self._model
    
    def _select_prompt(self, topic: str) -> str:
        topic_lower = topic.lower()
        for key, prompt in self.MUSIC_PROMPTS.items():
            if key in topic_lower:
                return prompt
        return self.MUSIC_PROMPTS["default"]
    
    async def generate_music(
        self,
        output_path: Path,
        duration: float = 30.0,
        topic: str = "",
        custom_prompt: Optional[str] = None
    ) -> Optional[str]:
        """Génère une piste musicale avec MusicGen."""
        prompt = custom_prompt or self._select_prompt(topic)
        generation_duration = min(duration, 30)  # Max 30s par génération
        
        output_path.mkdir(parents=True, exist_ok=True)
        music_filename = output_path / "background_music.wav"
        
        try:
            logger.info("generating_music_local", duration=generation_duration)
            
            def _generate():
                self.model.set_generation_params(duration=int(generation_duration))
                wav = self.model.generate([prompt])
                return wav[0].cpu()
            
            wav = await asyncio.to_thread(_generate)
            
            # Sauvegarder
            torchaudio.save(
                str(music_filename),
                wav,
                sample_rate=self.model.sample_rate
            )
            
            logger.info("music_generated_local", path=str(music_filename))
            return str(music_filename)
            
        except Exception as e:
            logger.error("local_music_generation_failed", error=str(e))
            return None
    
    async def generate_extended_music(
        self,
        output_path: Path,
        target_duration: float,
        topic: str = ""
    ) -> Optional[str]:
        """Génère musique longue (sera bouclée par MoviePy)."""
        return await self.generate_music(
            output_path,
            min(30, target_duration),
            topic
        )


# Factory function
def get_music_generator():
    settings = get_settings()
    if settings.use_local_models:
        return LocalMusicGenerator()
    else:
        from .music_generator_cloud import MusicGenerator
        return MusicGenerator()
```

### 5.2 Dépendance à ajouter

```bash
uv add audiocraft
```

---

## 🎬 Phase 6 : Migration Vidéo I2V (Stable Video Diffusion)

### 6.1 Modification de `video_animator.py`

```python
# backend/app/tools/video_animator.py - VERSION AVEC SUPPORT LOCAL

"""
Video Animator Tool - Cloud (Replicate Wan) et Local (Stable Video Diffusion).
"""

import asyncio
from pathlib import Path
from typing import Optional
import structlog
import torch

from ..config import get_settings

logger = structlog.get_logger()


class LocalVideoAnimator:
    """Animateur d'images local utilisant Stable Video Diffusion."""
    
    def __init__(self):
        self.settings = get_settings()
        self._pipe = None
    
    @property
    def pipe(self):
        """Lazy loading du pipeline SVD."""
        if self._pipe is None:
            from diffusers import StableVideoDiffusionPipeline
            
            logger.info("loading_svd_model", model=self.settings.local_video_model)
            
            self._pipe = StableVideoDiffusionPipeline.from_pretrained(
                self.settings.local_video_model,
                torch_dtype=torch.float16,
                variant="fp16"
            )
            
            if self.settings.enable_cpu_offload:
                self._pipe.enable_model_cpu_offload()
            else:
                self._pipe.to("cuda")
            
            logger.info("svd_model_loaded")
        return self._pipe
    
    async def animate_image(
        self,
        image_path: str,
        output_path: Path,
        scene_id: int,
        duration: float = 4.0,
        scene_description: str = "",
        animation_type: str = "default"
    ) -> Optional[str]:
        """
        Anime une image avec Stable Video Diffusion.
        
        Note: SVD génère 25 frames (~3-4s à 7fps)
        """
        from diffusers.utils import load_image, export_to_video
        
        image_file = Path(image_path)
        if not image_file.exists():
            logger.error("image_not_found", path=image_path)
            return None
        
        output_path.mkdir(parents=True, exist_ok=True)
        video_filename = output_path / f"clip_{scene_id:03d}.mp4"
        
        try:
            logger.info("animating_image_local", scene_id=scene_id)
            
            def _animate():
                # Charger et redimensionner l'image
                image = load_image(str(image_path))
                image = image.resize((1024, 576))  # Format 16:9 requis par SVD
                
                # Générer les frames
                generator = torch.manual_seed(42 + scene_id)
                frames = self.pipe(
                    image,
                    decode_chunk_size=8,  # Économise VRAM
                    generator=generator,
                    motion_bucket_id=127,  # Mouvement modéré
                    noise_aug_strength=0.02,  # Peu de bruit pour stabilité
                ).frames[0]
                
                # Exporter en MP4
                export_to_video(frames, str(video_filename), fps=7)
                return str(video_filename)
            
            result = await asyncio.to_thread(_animate)
            
            logger.info("image_animated_local", scene_id=scene_id, path=result)
            return result
            
        except Exception as e:
            logger.error("local_animation_failed", scene_id=scene_id, error=str(e))
            return None
    
    async def animate_batch(
        self,
        scenes: list[dict],
        output_path: Path
    ) -> list[Optional[str]]:
        """Anime plusieurs images séquentiellement."""
        results = []
        for idx, scene in enumerate(scenes):
            logger.info("animation_batch_progress", current=idx + 1, total=len(scenes))
            result = await self.animate_image(
                image_path=scene["image_path"],
                output_path=output_path,
                scene_id=scene["id"],
                duration=scene.get("duration", 4.0),
                scene_description=scene.get("visual_description", ""),
            )
            results.append(result)
        return results


# Factory function
def get_video_animator():
    settings = get_settings()
    if settings.use_local_models:
        return LocalVideoAnimator()
    else:
        from .video_animator_cloud import VideoAnimator
        return VideoAnimator()
```

---

## 📦 Phase 7 : Dépendances complètes

### 7.1 Ajouts à `pyproject.toml`

```toml
[project.optional-dependencies]
local = [
    # LLM Local
    "langchain-ollama>=0.2.0",
    
    # Image Generation Local
    "diffusers>=0.31.0",
    "accelerate>=1.2.0",
    "transformers>=4.47.0",
    "sentencepiece>=0.2.0",
    
    # TTS Local
    "TTS>=0.22.0",
    
    # Music Generation Local
    "audiocraft>=1.3.0",
    
    # Common
    "torch>=2.4.0",
    "torchaudio>=2.4.0",
]
```

### 7.2 Installation

```bash
# Installation complète mode local
uv sync --extra local

# Ou installation individuelle
uv add langchain-ollama diffusers accelerate transformers TTS audiocraft
```

---

## 💾 Espace disque requis

| Modèle | Taille | Emplacement |
|--------|--------|-------------|
| Qwen 2.5 14B (Ollama) | ~9 GB | `%USERPROFILE%\.ollama\models` |
| FLUX.1-dev | ~12 GB | `HF_HOME` |
| XTTS v2 | ~2 GB | `HF_HOME` |
| MusicGen Medium | ~3.5 GB | `HF_HOME` |
| SVD-XT | ~8 GB | `HF_HOME` |
| **Total minimum** | **~35 GB** | - |

---

## ⚡ Performance estimée (RTX 5070 Ti 16GB)

| Tâche | Temps Cloud | Temps Local | Gain |
|-------|-------------|-------------|------|
| Script LLM (500 mots) | ~5s | ~3-8s | ±0 |
| Image FLUX (1024x576) | ~15s | ~8-12s | 🟢 +25% |
| TTS (30s audio) | ~10s | ~3-5s | 🟢 +100% |
| Musique (30s) | ~60s | ~20-30s | 🟢 +100% |
| Vidéo I2V (4s) | ~120s | ~45-60s | 🟢 +100% |

> **Note** : Les temps locaux dépendent de la charge GPU et des optimisations.

---

## 🚀 Checklist d'installation

### Jour 1 : Base système
- [ ] Installer NVIDIA Driver 570+ (pour RTX 50 series)
- [ ] Installer CUDA Toolkit 12.4+
- [ ] Installer Python 3.11 + uv
- [ ] Installer PyTorch avec CUDA

### Jour 2 : LLM Local
- [ ] Installer Ollama
- [ ] Télécharger modèle Qwen 2.5 14B
- [ ] Modifier `base.py`
- [ ] Tester génération de script

### Jour 3 : Images
- [ ] Installer diffusers + accelerate
- [ ] Premier run pour télécharger FLUX
- [ ] Modifier `image_generator.py`
- [ ] Tester génération d'image

### Jour 4 : TTS
- [ ] Installer Coqui TTS
- [ ] Premier run pour télécharger XTTS v2
- [ ] Modifier `voice_generator.py`
- [ ] Tester génération voix

### Jour 5 : Musique + Vidéo
- [ ] Installer audiocraft
- [ ] Modifier `music_generator.py`
- [ ] Modifier `video_animator.py`
- [ ] Tester génération musique et animation

### Jour 6-7 : Intégration
- [ ] Test end-to-end complet
- [ ] Optimisation VRAM (batch sizes, offloading)
- [ ] Documentation des performances

---

## 🔄 Mode hybride (optionnel)

Vous pouvez aussi utiliser un mode hybride où certains modèles sont locaux et d'autres en cloud :

```env
USE_LOCAL_LLM=true
USE_LOCAL_IMAGES=true
USE_LOCAL_TTS=true
USE_LOCAL_MUSIC=true
USE_LOCAL_VIDEO=false  # Garder Replicate pour la vidéo
```

Cela permet de commencer progressivement la migration.

---

## 📚 Ressources

- [Ollama Documentation](https://ollama.ai/library)
- [Diffusers FLUX](https://huggingface.co/docs/diffusers/main/en/api/pipelines/flux)
- [Coqui TTS XTTS v2](https://docs.coqui.ai/en/latest/models/xtts.html)
- [AudioCraft MusicGen](https://github.com/facebookresearch/audiocraft)
- [Stable Video Diffusion](https://huggingface.co/docs/diffusers/using-diffusers/svd)
