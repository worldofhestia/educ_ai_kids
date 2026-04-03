# EducAIKids Backend

Backend API pour la génération automatique de vidéos éducatives animées.

## Installation

```bash
# Avec uv
uv sync

# Lancer le serveur
uv run uvicorn app.main:app --reload --port 8000
```

## Configuration

Créez un fichier `.env` avec vos clés API :

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
REPLICATE_API_TOKEN=r8_xxxxx
```

## Documentation API

Accédez à http://localhost:8000/docs après le démarrage.

