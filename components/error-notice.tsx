import * as stylex from '@stylexjs/stylex';
import { panel } from '@/components/styles';
import { colors } from '@/lib/tokens.stylex';

export function ErrorNotice() {
  return (
    <main {...stylex.props(panel.page)}>
      <section {...stylex.props(panel.card)}>
        <p {...stylex.props(panel.label)}>
          <span aria-hidden {...stylex.props(styles.dot)} />
          Signal lost
        </p>
        <h1 {...stylex.props(panel.title)}>Oops, something went wrong. 😭</h1>
        <p {...stylex.props(panel.body)}>
          Please try whatever you were doing again.
        </p>
        <p {...stylex.props(panel.body)}>
          If you continue to see this error, please reach out to us.
        </p>
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
});
