import * as stylex from '@stylexjs/stylex';
import type { Metadata } from 'next';
import Link from 'next/link';
import { panel } from '@/components/styles';
import { colors } from '@/lib/tokens.stylex';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main {...stylex.props(panel.page)}>
      <section {...stylex.props(panel.card)}>
        <p {...stylex.props(panel.label)}>
          <span aria-hidden {...stylex.props(styles.dot)} />
          Error 404
        </p>
        <h1 {...stylex.props(panel.title)}>This page could not be found.</h1>
        <p {...stylex.props(panel.body)}>
          The link may be broken, or the page may have moved.
        </p>
        <Link href="/" {...stylex.props(styles.home)}>
          Back to the home page
        </Link>
      </section>
    </main>
  );
}

const styles = stylex.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: colors.signal,
  },
  home: {
    alignSelf: 'flex-start',
    fontSize: 16,
    lineHeight: '1.625rem',
    color: colors.foreground,
    textDecorationLine: 'underline',
    textDecorationColor: colors.faint,
    textUnderlineOffset: '0.25em',
  },
});
