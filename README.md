# 🎓 EducAIKids

> Application web qui génère automatiquement des vidéos éducatives animées complètes à partir d'une simple requête en langage naturel.

![EducAIKids Banner](https://via.placeholder.com/800x400?text=EducAIKids+-+Vid%C3%A9os+%C3%89ducatives+IA)

## ✨ Fonctionnalités

- 📝 **Script automatique** : Génération du script narratif éducatif par IA
- 🎨 **Images cartoon** : Création d'illustrations style cartoon pour chaque scène
- 🎙️ **Voix off naturelle** : Synthèse vocale expressive et naturelle
- 🎵 **Musique de fond** : Génération de musique instrumentale adaptée au sujet
- 🎬 **Animation vidéo** : Animation des images avec effets subtils
- 🔧 **Montage automatique** : Assemblage synchronisé de tous les éléments

## 🛠️ Stack Technique

### Backend (Python 3.12+)
- **FastAPI** : API REST haute performance
- **LangGraph** : Orchestration multi-agents
- **OpenRouter** : LLM (Claude 3.5 Sonnet)
- **Replicate API** : Génération multimodale (images, voix, musique, vidéo)
- **MoviePy** : Montage vidéo local
- **uv** : Gestionnaire de paquets ultra-rapide

### Frontend (Next.js 15)
- **React 19** avec TypeScript
- **Tailwind CSS v4** avec shadcn/ui
- **App Router** : Routing moderne

### Modèles IA utilisés (via Replicate)
| Fonction | Modèle |
|----------|--------|
| Images | Flux.1 Schnell |
| Voix | XTTS-v2 |
| Musique | MusicGen (Meta) |
| Vidéo | Wan 2.1/2.2 Image-to-Video |

## 🚀 Installation

### Prérequis
- Python 3.12+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (gestionnaire de paquets Python)
- FFmpeg (pour MoviePy)

### Installation de uv

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Ou avec Homebrew
brew install uv

# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 1. Backend

```bash
cd backend

# Créer l'environnement et installer les dépendances (automatique avec uv)
uv sync

# Ou avec les dépendances de développement
uv sync --all-extras

# Configurer les variables d'environnement
cp env.example.txt .env
# Éditer .env avec vos clés API

# Lancer le serveur
uv run uvicorn app.main:app --reload --port 8000

# Ou directement
uv run python -m app.main
```

### 2. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'environnement
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Lancer le serveur de développement
npm run dev
```

### 3. Accéder à l'application

- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

## 🔑 Configuration des Clés API

Créez un fichier `.env` dans le dossier `backend/` avec :

```env
# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Replicate (Génération multimédia)
REPLICATE_API_TOKEN=r8_xxxxx
```

### Obtenir les clés :
- **OpenRouter** : https://openrouter.ai/keys
- **Replicate** : https://replicate.com/account/api-tokens

## 📁 Structure du Projet

```
EducAIKids/
├── backend/
│   ├── app/
│   │   ├── api/           # Routes FastAPI
│   │   ├── agents/        # Agents LangGraph
│   │   ├── graph/         # Workflow principal
│   │   ├── tools/         # Outils Replicate
│   │   ├── utils/         # Helpers (MoviePy)
│   │   ├── models/        # Modèles Pydantic
│   │   ├── config.py      # Configuration
│   │   └── main.py        # Point d'entrée
│   ├── pyproject.toml     # Dépendances (uv)
│   └── uv.lock            # Lock file
│
├── frontend/
│   ├── src/
│   │   ├── app/           # Pages Next.js
│   │   ├── components/    # Composants React
│   │   ├── hooks/         # Hooks personnalisés
│   │   └── lib/           # Utilitaires
│   └── package.json
│
└── README.md
```

## 📦 Commandes uv utiles

```bash
# Installer les dépendances
uv sync

# Ajouter une dépendance
uv add package-name

# Ajouter une dépendance de dev
uv add --dev package-name

# Mettre à jour les dépendances
uv lock --upgrade

# Lancer un script
uv run python script.py

# Lancer le serveur
uv run uvicorn app.main:app --reload

# Voir les dépendances installées
uv pip list

# Créer un environnement avec une version Python spécifique
uv venv --python 3.12
```

## 🔄 Workflow de Génération

```mermaid
graph LR
    A[Requête Utilisateur] --> B[Agent Script]
    B --> C[Agent Narration]
    C --> D[Agent Images]
    D --> E[Agent Voix]
    E --> F[Agent Musique]
    F --> G[Agent Vidéo]
    G --> H[Assemblage]
    H --> I[Vidéo Finale]
```

1. **Agent Script** : Génère le script narratif éducatif
2. **Agent Narration** : Découpe en scènes avec descriptions visuelles
3. **Agent Images** : Génère une image cartoon par scène
4. **Agent Voix** : Synthétise la voix off complète
5. **Agent Musique** : Crée une musique de fond adaptée
6. **Agent Vidéo** : Anime les images en clips
7. **Assemblage** : Monte la vidéo finale avec MoviePy

## 📡 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/generate` | Démarre une génération |
| GET | `/api/v1/status/{job_id}` | Statut de progression |
| GET | `/api/v1/video/{job_id}` | Télécharge la vidéo |
| GET | `/api/v1/videos` | Liste des vidéos |
| DELETE | `/api/v1/video/{job_id}` | Supprime une vidéo |
| GET | `/api/v1/health` | Vérification santé |

## 💡 Exemples de Prompts

- "Explique-moi comment les abeilles font du miel"
- "Comment fonctionne le cycle de l'eau dans la nature ?"
- "Pourquoi le ciel est-il bleu pendant la journée ?"
- "Comment les dinosaures ont-ils disparu de la Terre ?"
- "Qu'est-ce que la photosynthèse ?"

## ⚙️ Configuration Avancée

### Paramètres de génération (backend/.env)

```env
# Durée des scènes
SCENE_DURATION_MIN=3.0
SCENE_DURATION_MAX=5.0

# Nombre max de scènes
MAX_SCENES=10

# Résolution vidéo
VIDEO_RESOLUTION=480p
```

### Modèles Replicate personnalisés

```env
REPLICATE_IMAGE_MODEL=black-forest-labs/flux-schnell
REPLICATE_TTS_MODEL=lucataco/xtts-v2
REPLICATE_MUSIC_MODEL=meta/musicgen
REPLICATE_VIDEO_MODEL=wan-video/wan2.1-i2v-480p-14b
```

## 🧪 Développement

```bash
cd backend

# Installer avec les dépendances de dev
uv sync --extra dev

# Lancer les tests
uv run pytest

# Lancer le linter
uv run ruff check .

# Formater le code
uv run ruff format .

# Vérification de types
uv run mypy app/
```

## 🚧 Roadmap

- [ ] Support multi-langues
- [ ] Historique avec base de données
- [ ] Upload de voix personnalisée
- [ ] Templates de styles visuels
- [ ] Export en différentes résolutions
- [ ] Mode batch (plusieurs vidéos)

## 📝 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une PR.

---

<p align="center">
  Créé avec ❤️ et 🤖 par l'équipe EducAIKids
</p>
