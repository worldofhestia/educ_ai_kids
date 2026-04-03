import { VideoGeneratorSection } from '@/components/video-generator/VideoGeneratorSection';

// Features affichées dans le hero (données statiques, rendues côté serveur)
const FEATURES = [
  { emoji: '✨', text: 'Script automatique' },
  { emoji: '🎨', text: 'Images cartoon' },
  { emoji: '🎙️', text: 'Voix off naturelle' },
  { emoji: '🎵', text: 'Musique de fond' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header (Server Component — statique, SEO-friendly) */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎓</span>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                EducAIKids
              </h1>
              <p className="text-xs text-muted-foreground">
                Vidéos éducatives générées par IA
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Section Hero (Server Component — statique, SEO-friendly) */}
        <section className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Créez des vidéos éducatives
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              en quelques clics
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transformez n'importe quel sujet en vidéo animée captivante pour
            les enfants. Propulsé par l'intelligence artificielle.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm"
              >
                <span>{feature.emoji}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section interactive (Client Component) */}
        <VideoGeneratorSection />
      </div>

      {/* Footer (Server Component — statique) */}
      <footer className="border-t mt-auto py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 EducAIKids — Généré avec ❤️ et IA
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Utilise OpenRouter, Replicate et LangGraph pour la génération
          </p>
        </div>
      </footer>
    </main>
  );
}
