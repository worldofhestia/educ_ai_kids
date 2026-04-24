import { AppShell } from '@/components/layout/AppShell';
import { HeroSection } from '@/components/landing/HeroSection';
import { EcosystemSection } from '@/components/landing/EcosystemSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { FinalCTA } from '@/components/landing/FinalCTA';

/**
 * Page d'accueil "Découvrir" — style Hestia.
 * Server Component par défaut pour le SEO et la performance.
 * Le chatbot flottant est géré par <AppShell />.
 */
export default function LandingPage() {
  return (
    <AppShell>
      <HeroSection />
      <EcosystemSection />
      <FeaturesSection />
      <FinalCTA />
    </AppShell>
  );
}
