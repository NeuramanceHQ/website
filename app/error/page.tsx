import type { Metadata } from 'next';
import { ErrorNotice } from '@/components/error-notice';
import { OPEN_GRAPH } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Error',
  robots: { index: false },
  openGraph: { ...OPEN_GRAPH, url: '/error' },
};

export default function ErrorPage() {
  return <ErrorNotice />;
}
