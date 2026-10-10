import * as stylex from '@stylexjs/stylex';
import { button, panel } from '@/components/styles';
import { EMAIL } from '@/lib/site';
import { colors } from '@/lib/tokens.stylex';

export function ErrorNotice({ retry }: { retry?: () => void }) {
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
        {retry && (
          <button
            type="button"
            onClick={retry}
            {...stylex.props(button.base, button.ghost, button.small)}
          >
            Try again
          </button>
        )}
        <p {...stylex.props(panel.body)}>
          If you continue to see this error, please{' '}
          <a href={`mailto:${EMAIL}`} {...stylex.props(styles.contact)}>
            reach out to us
          </a>
          .
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
  contact: {
    textDecorationLine: 'underline',
    textUnderlineOffset: '0.2em',
  },
});
