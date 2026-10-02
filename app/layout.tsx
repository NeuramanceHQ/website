import * as stylex from '@stylexjs/stylex';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { colors, fonts } from '@/lib/tokens.stylex';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Neuramance®',
    default: 'Neuramance® Metaltech - Metal Parts for AI Agents',
  },
  description:
    'Neuramance Metaltech lets AI agents like Claude Code and Codex quote, order, and track real metal parts and fabrication, programmatically.',
  keywords: [
    'AI agents',
    'Claude Code',
    'Codex',
    'manufacturing API',
    'metal fabrication',
    'metal parts',
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
    siteName: 'Neuramance Metaltech',
    title: 'Neuramance® Metaltech - Give Your Agents Hands',
    description:
      'Metal parts and fabrication, ordered by AI agents. Claude Code, Codex, and any agent can quote, order, and track real parts in code.',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Neuramance Metaltech - Give Your Agents Hands',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neuramance® Metaltech - Give Your Agents Hands',
    description:
      'Metal parts and fabrication, ordered by AI agents. Claude Code, Codex, and any agent can quote, order, and track real parts in code.',
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

const fontDisplay = localFont({
  src: '../lib/fonts/ShareTechMono-Regular.woff2',
  variable: '--font-display',
});

const fontMicro = localFont({
  src: '../lib/fonts/Silkscreen-Regular.woff2',
  variable: '--font-micro',
});

const fontMono = localFont({
  src: '../lib/fonts/BerkeleyMono-Regular.otf',
  variable: '--font-mono',
});

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Neuramance Metaltech Corporation',
  alternateName: 'Neuramance',
  url: 'https://neuramance.com',
  logo: 'https://neuramance.com/opengraph-image.jpg',
  description:
    'Neuramance Metaltech lets AI agents like Claude Code and Codex quote, order, and track real metal parts and fabrication, programmatically.',
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
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontMicro.variable} ${fontMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body {...stylex.props(styles.body)}>{children}</body>
    </html>
  );
}

const styles = stylex.create({
  body: {
    minHeight: '100dvh',
    overflowX: 'hidden',
    fontFamily: fonts.display,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    color: colors.foreground,
    backgroundColor: colors.background,
  },
});
