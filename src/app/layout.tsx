import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://opportunityhunter.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Opportunity Hunter — AI Startup Discovery",
    template: "%s | Opportunity Hunter",
  },
  description:
    "Discover startup opportunities from Reddit, Hacker News, and Product Hunt. AI-powered pain-point detection, clustering, validation, and VC scoring.",
  keywords: [
    "startup ideas",
    "AI opportunity discovery",
    "pain point research",
    "market validation",
    "venture capital",
    "Reddit startup analysis",
  ],
  authors: [{ name: "Opportunity Hunter" }],
  creator: "Opportunity Hunter",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Opportunity Hunter",
    title: "Opportunity Hunter — AI Startup Discovery",
    description:
      "Discover startup opportunities from internet discussions. AI-powered pain-point detection, clustering, validation, and VC scoring.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Opportunity Hunter — AI Startup Discovery",
    description:
      "Discover startup opportunities from internet discussions. AI-powered pain-point detection, clustering, validation, and VC scoring.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Opportunity Hunter",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "AI-powered platform that discovers startup opportunities from internet discussions.",
    sameAs: [
      "https://github.com/hoangnvkog/opportunity-hunter",
    ],
  };

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
