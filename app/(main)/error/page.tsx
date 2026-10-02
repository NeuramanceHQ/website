import * as stylex from '@stylexjs/stylex';
import { colors } from '@/lib/tokens.stylex';

export default function ErrorPage() {
  return (
    <main {...stylex.props(styles.main)}>
      <p {...stylex.props(styles.title)}>Oops, something went wrong. 😭</p>
      <p {...stylex.props(styles.muted)}>
        Please try whatever you were doing again.
      </p>
      <p {...stylex.props(styles.muted)}>
        If you continue to see this error, please reach out to us.
      </p>
    </main>
  );
}

const styles = stylex.create({
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    minHeight: '100vh',
    overflow: 'hidden',
  },
  title: {
    marginBottom: '1rem',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontWeight: 500,
  },
  muted: {
    color: colors.muted,
  },
});
