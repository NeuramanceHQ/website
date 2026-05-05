import { ErrorBoundary } from '@/components/error-boundary';
import { AudioProvider } from '@/lib/contexts/AudioContext';
import { cn } from '@/lib/utils';
import '@/styles/global.css';
import { Metadata } from 'next';
import localFont from 'next/font/local';

export const metadata: Metadata = {
  title: {
    template: '%s | Neuramance®',
    default: 'Neuramance® - Official Website',
  },
  description: 'Neuramance builds software from the future: superintelligent optimization & improvement of processes, operations, strategic plans, & growth campaigns.',
  keywords: ['AI', 'artificial intelligence', 'process optimization', 'turbocognition', 'hyperanalysis', 'multimedia', 'operations', 'productivity'],
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
    description: 'Superintelligent Optimization & Improvement of Processes, Operations, Strategic Plans, & Growth Campaigns.',
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
    description: 'Superintelligent Optimization & Improvement of Processes, Operations, Strategic Plans, & Growth Campaigns.',
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
  display: 'swap',
  variable: '--font-sans',
  preload: true,
});

const fontMono = localFont({
  src: '../lib/fonts/BerkeleyMono-Regular.otf',
  display: 'swap',
  variable: '--font-mono',
  preload: true,
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Neuramance",
  "url": "https://neuramance.com",
  "logo": "https://neuramance.com/opengraph-image.jpg",
  "description": "Software From the Future. Superintelligent Optimization & Improvement of Processes, Operations, Strategic Plans, & Growth Campaigns.",
  "foundingDate": "2025",
  "sameAs": [
    "https://twitter.com/neuramance",
    "https://github.com/neuramance"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "url": "https://neuramance.com/contact"
  },
  "offers": {
    "@type": "Offer",
    "name": "Software From the Future",
    "description": "Access to Neuramance AI platform for superintelligent process & productivity optimization.",
    "category": "Software"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/lib/fonts/InterVariable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/lib/fonts/BerkeleyMono-Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen font-sans antialiased',
          fontSans.variable,
          fontMono.variable,
        )}
      >
        <ErrorBoundary>
          <AudioProvider>
            <ErrorBoundary
              fallback={
                <div className="flex min-h-[100px] items-center justify-center p-4">
                  <p className="text-sm text-gray-600">Audio system temporarily unavailable</p>
                </div>
              }
            >
              {children}
            </ErrorBoundary>
          </AudioProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
