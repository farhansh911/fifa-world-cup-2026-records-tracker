import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LiveScoresProvider } from "@/components/providers/LiveScoresProvider";
import { ConditionalShell } from "@/components/layout/ConditionalShell";
import { SiteBackground } from "@/components/layout/SiteBackground";
import { createMetadata, websiteJsonLd, sportsEventJsonLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = createMetadata({});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("wc2026_theme");if(t==="light")document.documentElement.classList.add("light-mode");}catch(e){}})();`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={websiteJsonLd()} />
        <script type="application/ld+json" dangerouslySetInnerHTML={sportsEventJsonLd()} />
      </head>
      <body suppressHydrationWarning>
        <SiteBackground />
        <ThemeProvider>
          <LiveScoresProvider>
            <ConditionalShell>{children}</ConditionalShell>
          </LiveScoresProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
