import * as stylex from '@stylexjs/stylex';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { colors, fonts } from '@/lib/tokens.stylex';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Neuramance®',
    default: 'Neuramance® - Official Website',
  },
  description:
    'Neuramance builds software from the future: superintelligent optimization & improvement of processes, operations, strategic plans, & growth campaigns.',
  keywords: [
    'AI',
    'artificial intelligence',
    'process optimization',
    'turbocognition',
    'hyperanalysis',
    'multimedia',
    'operations',
    'productivity',
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
    title: 'Neuramance® - Software From the Future',
    description:
      'Superintelligent Optimization & Improvement of Processes, Operations, Strategic Plans, & Growth Campaigns.',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Neuramance - Software From the Future',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neuramance® - Software From the Future',
    description:
      'Superintelligent Optimization & Improvement of Processes, Operations, Strategic Plans, & Growth Campaigns.',
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

const fontSans = localFont({
  src: '../lib/fonts/InterVariable.woff2',
  variable: '--font-sans',
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
    'Software From the Future. Superintelligent Optimization & Improvement of Processes, Operations, Strategic Plans, & Growth Campaigns.',
  foundingDate: '2025',
  sameAs: ['https://twitter.com/neuramance', 'https://github.com/neuramance'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    url: 'https://neuramance.com/contact',
  },
  offers: {
    '@type': 'Offer',
    name: 'Software From the Future',
    description:
      'Access to Neuramance AI platform for superintelligent process & productivity optimization.',
    category: 'Software',
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
      <body {...stylex.props(styles.body)}>{children}</body>
    </html>
  );
}

const styles = stylex.create({
  body: {
    minHeight: '100vh',
    overflowX: 'hidden',
    fontFamily: fonts.sans,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    color: colors.foreground,
    backgroundColor: colors.background,
  },
});
