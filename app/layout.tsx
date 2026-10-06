import * as stylex from '@stylexjs/stylex';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { VideoBackground } from '@/components/video-background';
import { BACKGROUND_VIDEO_ID } from '@/lib/site';
import { colors, fonts } from '@/lib/tokens.stylex';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Neuramance®',
    default: 'Neuramance® - Metal Parts for AI Agents',
  },
  description:
    'Neuramance lets AI agents like Claude Code and Codex quote, order, and track real metal parts and fabrication, programmatically.',
  keywords: [
    'AI agents',
    'Claude Code',
    'Codex',
    'manufacturing API',
    'metal fabrication',
    'metal parts',
    'CNC machining',
    'sheet metal',
    'laser cutting',
    'finishing',
  ],
  authors: [{ name: 'Neuramance' }],
  creator: 'Neuramance',
  publisher: 'Neuramance',
  metadataBase: new URL('https://neuramance.com'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
  alternates: {
    canonical: 'https://neuramance.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://neuramance.com',
    siteName: 'Neuramance',
    title: 'Neuramance® - Metal Parts for AI Agents',
    description:
      'Your agent sends the CAD file; we ship the metal part. CNC machining, sheet metal, laser cutting, and finishing for Claude Code, Codex, and any AI agent.',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Neuramance - Metal Parts for AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neuramance® - Metal Parts for AI Agents',
    description:
      'Your agent sends the CAD file; we ship the metal part. CNC machining, sheet metal, laser cutting, and finishing for Claude Code, Codex, and any AI agent.',
    images: ['/opengraph-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#050506',
  colorScheme: 'dark',
};

const fontSans = localFont({
  src: '../lib/fonts/InterVariable.woff2',
  variable: '--font-sans',
  weight: '400 600',
});

const fontMono = localFont({
  src: '../lib/fonts/BerkeleyMono-Regular.otf',
  variable: '--font-mono',
});

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Neuramance',
  url: 'https://neuramance.com',
  logo: 'https://neuramance.com/opengraph-image.jpg',
  description:
    'Neuramance lets AI agents like Claude Code and Codex quote, order, and track real metal parts and fabrication, programmatically.',
  foundingDate: '2025',
  sameAs: ['https://twitter.com/neuramance', 'https://github.com/neuramance'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'austin@neuramance.com',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body {...stylex.props(styles.body)} suppressHydrationWarning>
        <VideoBackground videoId={BACKGROUND_VIDEO_ID} />
        {children}
      </body>
    </html>
  );
}

const styles = stylex.create({
  body: {
    minHeight: '100dvh',
    overflowX: 'clip',
    fontFamily: fonts.sans,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    color: colors.foreground,
    backgroundColor: colors.background,
  },
});
