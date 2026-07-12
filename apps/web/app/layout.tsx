import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SmoothScroll } from "@/components/SmoothScroll";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL('https://playcheckmate.app'),
  title: {
    default: "Play Checkmate Africa | Elite Competitive Chess",
    template: "%s | Play Checkmate Africa"
  },
  description: "Join the elite competitive skill chess platform. Play for stakes, climb the ranks, and prove your mastery in bullet, blitz, and rapid formats.",
  keywords: ["chess", "competitive chess", "play chess online", "chess stakes", "chess rewards", "blitz chess", "esports chess"],
  openGraph: {
    title: "Play Checkmate Africa | Elite Competitive Chess",
    description: "Join the elite competitive skill chess platform. Play for stakes, climb the ranks, and prove your mastery.",
    url: "https://playcheckmate.app",
    siteName: "Play Checkmate Africa",
    images: [
      {
        url: "/og-image.jpg", // We can add an actual image later or fallback
        width: 1200,
        height: 630,
        alt: "CheckMate Platform Preview"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Checkmate Africa | Elite Competitive Chess",
    description: "Join the elite competitive skill chess platform. Play for stakes, climb the ranks, and prove your mastery.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Play Checkmate Africa",
              "url": "https://playcheckmate.app/"
            })
          }}
        />
      </head>
      <body className="font-body-md text-white bg-[#0A0B0F] antialiased">
        <Providers>
          <SmoothScroll>{children}</SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
