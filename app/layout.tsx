import * as stylex from '@stylexjs/stylex';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Announcement } from '@/components/announcement';
import { Footer } from '@/components/footer';
import { MetalLight } from '@/components/metal-light';
import { Nav } from '@/components/nav';
import { VideoBackground } from '@/components/video-background';
import { BACKGROUND_VIDEO_ID, EMAIL, LLMS_HREF, OPEN_GRAPH } from '@/lib/site';
import { colors, fonts } from '@/lib/tokens.stylex';
import './globals.css';

const DESCRIPTION =
  'Neuramance lets AI agents like Claude Code and Codex quote, order, and track real metal parts and fabrication, programmatically.';

export const metadata: Metadata = {
  title: {
    template: '%s | Neuramance®',
    default: 'Neuramance® - Metal Parts for AI Agents',
  },
  description: DESCRIPTION,
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
  openGraph: OPEN_GRAPH,
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
  logo: 'https://neuramance.com/logo.svg',
  description: DESCRIPTION,
  foundingDate: '2025',
  sameAs: ['https://twitter.com/neuramance', 'https://github.com/NeuramanceHQ'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: EMAIL,
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
        <Announcement>
          New: your AI agent can now request beta access for you.{' '}
          <a href={LLMS_HREF} {...stylex.props(styles.link)}>
            Read the agent guide
          </a>
        </Announcement>
        <Nav />
        {children}
        <Footer />
        <MetalLight />
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
  link: {
    marginLeft: '0.5rem',
    textDecorationLine: 'underline',
    textUnderlineOffset: '0.2em',
    whiteSpace: 'nowrap',
  },
});
