import * as stylex from '@stylexjs/stylex';
import type { Metadata } from 'next';
import { panel } from '@/components/styles';
import { OPEN_GRAPH } from '@/lib/site';
import { colors, fonts } from '@/lib/tokens.stylex';

export const metadata: Metadata = {
  title: 'Waitlist',
  robots: { index: false },
  openGraph: {
    ...OPEN_GRAPH,
    url: '/waitlist',
  },
};

export default function Page() {
  return (
    <main {...stylex.props(panel.page)}>
      <section {...stylex.props(panel.card)}>
        <p {...stylex.props(panel.label)}>
          <span aria-hidden {...stylex.props(styles.dot)} />
          Status — confirmed
        </p>
        <h1 {...stylex.props(panel.title)}>You are on the waitlist.</h1>
        <p {...stylex.props(panel.body)}>
          Thank you very much for your interest in Neuramance.
        </p>
        <p {...stylex.props(panel.body)}>
          <strong {...stylex.props(styles.strong)}>Neuramance</strong> is
          currently in private beta, as we are still working on building the
          product.
        </p>
        <p {...stylex.props(panel.body)}>
          Look out for emails containing updates & news, including beta access.
        </p>
        <p {...stylex.props(panel.body)}>Thank you for your support,</p>
        <p {...stylex.props(styles.signature)}>- Austin @ Neuramance</p>
      </section>
    </main>
  );
}

const styles = stylex.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: colors.lime,
  },
  strong: {
    color: colors.foreground,
  },
  signature: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.foreground,
  },
});
