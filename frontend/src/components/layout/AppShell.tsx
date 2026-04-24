import { ReactNode } from 'react';
import { TopAppBar } from './TopAppBar';
import { MobileNav } from './MobileNav';
import { SiteFooter } from './SiteFooter';
import { HestiaChatbot } from '@/components/hestia/HestiaChatbot';

interface AppShellProps {
  children: ReactNode;
  /** Si true, cache le footer (utile pour les pages "app" plein écran) */
  hideFooter?: boolean;
  /** Si true, cache le chatbot flottant (utile sur /utiliser où il y a déjà un chat) */
  hideChatbot?: boolean;
}

/**
 * Shell global de l'application Hestia.
 * Utilisé par toutes les pages pour garantir la cohérence TopAppBar / MobileNav / Footer / Chatbot.
 */
export function AppShell({ children, hideFooter = false, hideChatbot = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopAppBar />
      <div className="flex-1 flex flex-col pb-24 md:pb-0">{children}</div>
      {!hideFooter && <SiteFooter />}
      <MobileNav />
      {!hideChatbot && <HestiaChatbot />}
    </div>
  );
}
