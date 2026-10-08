import type { Metadata } from 'next';
import { OPEN_GRAPH } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Error',
  robots: { index: false },
  openGraph: { ...OPEN_GRAPH, title: 'Error | Neuramance®', url: '/error' },
};

export { ErrorNotice as default } from '@/components/error-notice';
