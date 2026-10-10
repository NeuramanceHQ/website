import type { Metadata } from 'next';

export const EMAIL = 'austin@neuramance.com';

export const ACCESS_HREF = `mailto:${EMAIL}?subject=Neuramance%20access`;

export const LLMS_HREF = '/llms.txt';

export const AGENT_PROMPT = `Read https://neuramance.com/llms.txt, then draft an email to ${EMAIL} requesting Neuramance beta access, describing the physical parts this project needs.`;

export const BACKGROUND_VIDEO_ID = 'AA3ixfYtq1g';

export const MUSIC = {
  src: 'https://media.neuramance.com/audio/ill-watch-you-burn-us.f606d76ed6.m4a',
  title: 'ill watch you burn us',
  artist: 'yaego',
};

export const OPEN_GRAPH = {
  type: 'website',
  locale: 'en_US',
  siteName: 'Neuramance',
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
} satisfies Metadata['openGraph'];
