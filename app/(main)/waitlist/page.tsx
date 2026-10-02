import * as stylex from '@stylexjs/stylex';
import { Terminal } from 'lucide-react';
import { colors, fonts } from '@/lib/tokens.stylex';

export default function Page() {
  return (
    <main {...stylex.props(styles.main)}>
      <div role="alert" {...stylex.props(styles.alert)}>
        <Terminal {...stylex.props(styles.icon)} />
        <h5 {...stylex.props(styles.title)}>You are on the waitlist.</h5>
        <div {...stylex.props(styles.description)}>
          Thank you very much for your interest in Neuramance.
          <br />
          <br />
          <strong>Neuramance</strong> is currently in private beta, as we are
          still working on building the product.
          <br />
          <br />
          Look out for emails containing updates & news, including beta access.
          <br />
          <br />
          Thank you for your support,
          <br />
          <p {...stylex.props(styles.signature)}>- Austin @ Neuramance</p>
        </div>
      </div>
    </main>
  );
}

const styles = stylex.create({
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  alert: {
    position: 'relative',
    width: 600,
    padding: '1rem',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    borderRadius: '0.375rem',
  },
  icon: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    width: '1rem',
    height: '1rem',
  },
  title: {
    marginBottom: '0.25rem',
    paddingLeft: '1.75rem',
    fontWeight: 500,
    lineHeight: 1,
    letterSpacing: '-0.025em',
  },
  description: {
    paddingLeft: '1.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  signature: {
    fontFamily: fonts.mono,
    lineHeight: 1.625,
  },
});
