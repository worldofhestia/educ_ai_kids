'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/layout/Icon';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Boutons d'action contextuels (smart actions) */
  actions?: Array<{
    label: string;
    icon: string;
    variant: 'primary' | 'tertiary' | 'ghost';
    onClick?: () => void;
  }>;
  /** Label d'expert qui a répondu */
  expertLabel?: string;
  expertColor?: string;
  expertIcon?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      "Bonjour ! Je suis Hestia, votre assistante pédagogique. Dites-moi quel sujet vous aimeriez expliquer aux enfants, et je peux même générer une vidéo éducative complète pour vous.",
    expertLabel: 'Hestia',
    expertColor: 'text-primary',
    expertIcon: 'auto_awesome',
  },
];

const SUGGESTED_PROMPTS = [
  'Comment les abeilles font du miel ?',
  'Pourquoi le ciel est bleu ?',
  "Le cycle de l'eau expliqué simplement",
];

/**
 * Chatbot flottant signature du design Hestia.
 * - État rétracté = pastille ronde en bas à droite
 * - État ouvert = fenêtre de chat 384px
 * - État agrandi = ~65% viewport (pour une conversation longue)
 *
 * Déclenche la navigation vers `/utiliser` avec le prompt pré-rempli
 * quand l'utilisateur clique sur "Générer une vidéo".
 */
export function HestiaChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const conversationRef = useRef<HTMLDivElement>(null);

  // Scroll auto en bas à chaque nouveau message
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleGenerateVideo = (prompt: string) => {
    const encoded = encodeURIComponent(prompt);
    router.push(`/utiliser?prompt=${encoded}`);
    setIsOpen(false);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: `Excellente question ! Je peux transformer « ${trimmed.slice(0, 60)}${
        trimmed.length > 60 ? '…' : ''
      } » en une vidéo éducative animée, complète avec script, images cartoon, voix off et musique. Voulez-vous que je lance la génération ?`,
      expertLabel: 'Hestia',
      expertColor: 'text-primary',
      expertIcon: 'auto_awesome',
      actions: [
        {
          label: '🪄 Générer une vidéo pédagogique',
          icon: 'auto_videocam',
          variant: 'primary',
          onClick: () => handleGenerateVideo(trimmed),
        },
        {
          label: '📝 Demander plus de détails',
          icon: 'description',
          variant: 'tertiary',
        },
      ],
    };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput('');
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
  };

  const toggleOpen = () => {
    setIsOpen((v) => !v);
    if (isOpen) setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      {/* Fenêtre de chat */}
      <div
        className={cn(
          'chat-window pointer-events-auto flex flex-col shadow-2xl border border-[color:var(--color-outline-variant)]/20 overflow-hidden',
          'bg-[color:var(--color-hestia-cream)]',
          isExpanded
            ? 'fixed top-20 right-4 md:right-8 bottom-28 md:bottom-24 w-[calc(100vw-2rem)] md:w-[65vw] max-w-4xl h-auto rounded-[2rem]'
            : 'w-[calc(100vw-2rem)] sm:w-96 h-[540px] rounded-[2rem]',
          !isOpen && 'hidden-chat'
        )}
        role="dialog"
        aria-label="Assistant Hestia"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[color:var(--color-surface-container-high)] border-b border-[color:var(--color-outline-variant)]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary p-0.5 overflow-hidden flex items-center justify-center bg-card">
              <Icon name="auto_awesome" className="text-primary" size={22} />
            </div>
            <div>
              <h4 className="font-headline font-semibold leading-tight">Hestia</h4>
              <p className="text-xs text-[color:var(--color-hestia-sage-dark)] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Assistante pédagogique IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="p-2 hover:bg-[color:var(--color-surface-variant)] rounded-full transition-colors text-[color:var(--color-on-surface-variant)]"
              aria-label={isExpanded ? 'Réduire' : 'Agrandir'}
            >
              <Icon name={isExpanded ? 'close_fullscreen' : 'open_in_full'} size={20} />
            </button>
            <button
              type="button"
              onClick={toggleOpen}
              className="p-2 hover:bg-[color:var(--color-surface-variant)] rounded-full transition-colors text-[color:var(--color-on-surface-variant)]"
              aria-label="Fermer"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Conversation */}
        <div
          ref={conversationRef}
          className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 bg-[color:var(--color-surface)]/30"
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isExpanded={isExpanded}
            />
          ))}

          {/* Suggestions initiales */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTED_PROMPTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className="px-3 py-1.5 text-xs rounded-full bg-card border border-[color:var(--color-outline-variant)]/40 hover:border-primary hover:text-primary transition-all font-body"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 pt-0 shrink-0">
          <div className="bg-[color:var(--color-surface-container-low)] rounded-[1.5rem] p-2 flex items-center gap-2 border border-[color:var(--color-outline-variant)]/30 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Posez votre question à Hestia…"
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-body py-3 px-3 text-foreground placeholder:text-[color:var(--color-on-surface-variant)]/70"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-hestia-gradient text-primary-foreground flex items-center justify-center hover:shadow-lg transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Envoyer"
            >
              <Icon name="send" size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-[color:var(--color-on-surface-variant)] mt-2 uppercase tracking-tighter opacity-60">
            Propulsé par Hestia Orchestrator • Réponses générées par IA
          </p>
        </div>
      </div>

      {/* Pastille flottante */}
      <button
        type="button"
        onClick={toggleOpen}
        className="pointer-events-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-card p-1 shadow-2xl hover:scale-105 transition-transform active:scale-90 relative editorial-shadow-lg border border-[color:var(--color-outline-variant)]/30 flex items-center justify-center"
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir Hestia'}
      >
        <div className="w-full h-full rounded-full bg-hestia-gradient flex items-center justify-center">
          <Icon
            name={isOpen ? 'close' : 'auto_awesome'}
            className="text-white"
            size={26}
          />
        </div>
        {!isOpen && (
          <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bulle de message isolée pour rester lisible                         */
/* ------------------------------------------------------------------ */
interface MessageBubbleProps {
  message: Message;
  isExpanded: boolean;
}

function MessageBubble({ message, isExpanded }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[color:var(--color-hestia-sage-dark)] text-white p-4 rounded-3xl rounded-tr-sm editorial-shadow">
          <p className="font-body text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="hidden md:flex w-9 h-9 rounded-full bg-primary/10 items-center justify-center text-primary shrink-0 border border-primary/20">
        <Icon name={message.expertIcon ?? 'auto_awesome'} size={18} />
      </div>
      <div className="space-y-3 max-w-[90%] md:max-w-[85%]">
        <div className="bg-card p-5 rounded-3xl rounded-tl-sm editorial-shadow border border-[color:var(--color-outline-variant)]/30">
          {message.expertLabel && (
            <div className="flex items-center gap-2 mb-2">
              <div className="md:hidden w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name={message.expertIcon ?? 'auto_awesome'} size={12} />
              </div>
              <span
                className={cn(
                  'font-headline font-bold text-sm',
                  message.expertColor ?? 'text-primary'
                )}
              >
                {message.expertLabel}
              </span>
              <span className="text-[10px] text-[color:var(--color-on-surface-variant)] uppercase tracking-widest font-bold">
                Instantané
              </span>
            </div>
          )}
          <p className="font-body text-sm text-foreground leading-relaxed">
            {message.content}
          </p>
        </div>

        {message.actions && message.actions.length > 0 && (
          <div
            className={cn(
              'flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500',
              !isExpanded && 'flex-col items-start'
            )}
          >
            {message.actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={cn(
                  'px-4 py-2.5 rounded-full font-headline text-xs font-semibold flex items-center gap-2 transition-all active:scale-95',
                  action.variant === 'primary' &&
                    'bg-hestia-gradient text-white hover:shadow-lg',
                  action.variant === 'tertiary' &&
                    'bg-[color:var(--color-hestia-gold-soft)] text-[color:var(--color-hestia-gold-on)] hover:shadow-md',
                  action.variant === 'ghost' &&
                    'bg-[color:var(--color-surface-container-high)] text-foreground hover:bg-[color:var(--color-surface-variant)]'
                )}
              >
                <Icon name={action.icon} size={16} />
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
