import type { Metadata } from 'next';
import { Lexend, Public_Sans } from 'next/font/google';
import './globals.css';

const lexend = Lexend({
  variable: '--font-lexend',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EducAIKids — Vidéos éducatives par IA',
  description:
    "Transformez n'importe quelle idée en vidéo éducative animée pour les enfants. Script, images, voix et musique générés par IA en quelques minutes.",
  keywords: [
    'éducation',
    'enfants',
    'vidéo',
    'IA',
    'intelligence artificielle',
    'animation',
    'pédagogique',
    'Hestia',
  ],
  authors: [{ name: 'EducAIKids Team' }],
  creator: 'EducAIKids',
  openGraph: {
    title: 'EducAIKids — Vidéos éducatives par IA',
    description:
      'Créez des vidéos éducatives captivantes pour les enfants en quelques clics.',
    type: 'website',
    locale: 'fr_FR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Material Symbols Outlined — police icône variable Google (pas de next/font car fonte variable à 4 axes) */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${lexend.variable} ${publicSans.variable} font-body bg-background text-foreground antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
