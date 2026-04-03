import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EducAIKids - Vidéos Éducatives IA",
  description:
    "Générez automatiquement des vidéos éducatives animées pour enfants grâce à l'intelligence artificielle. Script, images, voix et musique générés en un clic.",
  keywords: [
    "éducation",
    "enfants",
    "vidéo",
    "IA",
    "intelligence artificielle",
    "animation",
    "pédagogique",
  ],
  authors: [{ name: "EducAIKids Team" }],
  creator: "EducAIKids",
  openGraph: {
    title: "EducAIKids - Vidéos Éducatives IA",
    description:
      "Créez des vidéos éducatives captivantes pour enfants en quelques clics",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
