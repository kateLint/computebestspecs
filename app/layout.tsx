import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F17" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "ComputeBestSpecs — Find the Right PC for Your Workload",
    template: "%s — ComputeBestSpecs",
  },
  description:
    "Check whether a PC can handle your real workload, identify bottlenecks, and find the hardware that fits how you actually work.",
};

const themeBootstrapScript = `
  (function() {
    try {
      var PREFS_KEY = 'cbs_display_preferences_v1';
      var theme = 'system';
      var storedPrefs = localStorage.getItem(PREFS_KEY);
      
      if (storedPrefs) {
        try {
          var parsed = JSON.parse(storedPrefs);
          var val = parsed && parsed.theme;
          if (val === 'light' || val === 'dark' || val === 'system') {
            theme = val;
          }
        } catch(e) {}
      } else {
        var legacy = localStorage.getItem('theme');
        if (legacy === 'light' || legacy === 'dark' || legacy === 'system') {
          theme = legacy;
          try {
            localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: legacy }));
            localStorage.removeItem('theme');
          } catch(e) {}
        }
      }

      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
      var effectiveTheme = isDark ? 'dark' : 'light';

      document.documentElement.dataset.theme = effectiveTheme;
      document.documentElement.style.colorScheme = effectiveTheme;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { ComparisonIndicator } from "@/components/comparison/ComparisonIndicator";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} app-shell font-sans antialiased bg-surface-main text-content-body`}>
        {/* Accessible Skip to Main Content Link (WCAG 2.2 AA) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-[var(--on-brand)] focus:font-sans focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <ConsentProvider>
            <Navbar />
            <main id="main-content" className="flex-grow">
              {children}
            </main>
            <ComparisonIndicator />
            <Footer />
            <MobileBottomNav />
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
