import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "./components/theme-toggle";

export const metadata: Metadata = {
  title: "Will Grannis",
  description: "Arts & Crafts",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Will Grannis",
    description: "Arts & Crafts",
    siteName: "grannis.xyz",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Will Grannis",
    description: "Arts & Crafts",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Will Grannis — Arts"
          href="/rss.xml"
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}})()`,
          }}
        />
        {children}
        <ThemeToggle />
        <footer className="w-full py-6 text-center">
          <a
            href="mailto:contact@grannis.xyz"
            className="text-xs text-text-soft/40 hover:text-text-soft transition-colors font-mono"
          >
            contact@grannis.xyz
          </a>
        </footer>
      </body>
    </html>
  );
}
