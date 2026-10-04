import * as stylex from '@stylexjs/stylex';
import { colors, fonts } from '@/lib/tokens.stylex';

const PROMPT = '40 of bracket.step, 6061, black anodize';
const TYPE_MS = 1800;
const START_MS = 600;

const OUTPUT = [
  { mark: '●', text: 'neuramance.quote(bracket.step × 40)', tone: 'tool' },
  { mark: '└', text: 'cnc 3-axis + type II anodize', tone: 'dim' },
  { mark: ' ', text: '6 business days · $1,284.00', tone: 'value' },
  { mark: '●', text: 'neuramance.order(quote: q_8f2k)', tone: 'tool' },
  { mark: '└', text: '✓ NM-24817 · ships to Austin, TX', tone: 'value' },
] as const;

export function AgentSession() {
  return (
    <div {...stylex.props(styles.window)}>
      <div {...stylex.props(styles.titlebar)}>
        <span aria-hidden {...stylex.props(styles.lights)}>
          <span {...stylex.props(styles.light('#ff5f57'))} />
          <span {...stylex.props(styles.light('#febc2e'))} />
          <span {...stylex.props(styles.light('#28c840'))} />
        </span>
        <span {...stylex.props(styles.title)}>claude — ~/rover</span>
        <span {...stylex.props(styles.tag)}>Example</span>
      </div>
      <pre {...stylex.props(styles.body)}>
        <span {...stylex.props(styles.line)}>
          <span {...stylex.props(styles.prompt)}>❯ </span>
          <span {...stylex.props(styles.typed)}>{PROMPT}</span>
        </span>
        {OUTPUT.map((line, index) => (
          <span
            key={line.text}
            {...stylex.props(
              styles.line,
              styles.reveal(`${START_MS + TYPE_MS + 450 * (index + 1)}ms`),
            )}
          >
            <span
              {...stylex.props(styles[line.tone === 'tool' ? 'tool' : 'dim'])}
            >
              {line.mark}{' '}
            </span>
            <span {...stylex.props(styles[line.tone])}>{line.text}</span>
          </span>
        ))}
        <span
          {...stylex.props(
            styles.line,
            styles.reveal(
              `${START_MS + TYPE_MS + 450 * (OUTPUT.length + 1)}ms`,
            ),
          )}
        >
          <span {...stylex.props(styles.prompt)}>❯ </span>
          <span {...stylex.props(styles.caret)} />
        </span>
      </pre>
    </div>
  );
}

const type = stylex.keyframes({
  from: { clipPath: 'inset(0 100% 0 0)' },
  to: { clipPath: 'inset(0 0 0 0)' },
});

const appear = stylex.keyframes({ from: { opacity: 0 } });

const blink = stylex.keyframes({ '50%': { opacity: 0 } });

const styles = stylex.create({
  window: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#07080c',
    backgroundImage:
      'repeating-linear-gradient(180deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 3px)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(0 0 0 / 0.9)',
    borderRadius: 6,
    boxShadow:
      '0 28px 60px -24px rgb(0 0 0 / 0.95), 0 0 0 1px rgb(255 255 255 / 0.12), 0 0 40px -10px rgb(54 70 217 / 0.35)',
  },
  titlebar: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    height: 26,
    paddingInline: '0.625rem',
    fontFamily: fonts.mono,
    fontSize: 11,
    color: '#1d2028',
    backgroundImage:
      'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 2px), linear-gradient(180deg, #e9edf2 0%, #c9cfd8 48%, #b4bbc6 52%, #d3d8df 100%)',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgb(0 0 0 / 0.7)',
    boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.12)',
  },
  lights: {
    display: 'flex',
    gap: 6,
  },
  light: (color: string) => ({
    width: 11,
    height: 11,
    borderRadius: '50%',
    backgroundColor: color,
    backgroundImage:
      'radial-gradient(circle at 50% 30%, rgb(255 255 255 / 0.85), rgb(255 255 255 / 0) 55%)',
    boxShadow:
      'inset 0 0 0 0.5px rgb(0 0 0 / 0.45), 0 1px 0 rgb(255 255 255 / 0.6)',
  }),
  title: {
    textShadow: '0 1px 0 rgb(255 255 255 / 0.7)',
  },
  tag: {
    justifySelf: 'end',
    paddingInline: '0.375rem',
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: '0.875rem',
    textTransform: 'uppercase',
    color: '#2a2e38',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(0 0 0 / 0.25)',
    borderRadius: 2,
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    paddingBlock: '0.75rem',
    paddingInline: '0.875rem',
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: '1.25rem',
    whiteSpace: 'pre',
    overflow: 'hidden',
    color: colors.foreground,
  },
  line: {
    display: 'flex',
  },
  prompt: {
    flexShrink: 0,
    color: colors.periwinkle,
  },
  typed: {
    animationName: type,
    animationDuration: `${TYPE_MS}ms`,
    animationDelay: `${START_MS}ms`,
    animationTimingFunction: `steps(${PROMPT.length})`,
    animationFillMode: 'both',
  },
  reveal: (delay: string) => ({
    animationName: appear,
    animationDuration: '1ms',
    animationDelay: delay,
    animationFillMode: 'both',
  }),
  tool: {
    color: colors.neon,
  },
  dim: {
    color: colors.muted,
  },
  value: {
    color: colors.foreground,
  },
  caret: {
    width: '0.6em',
    height: '1.1em',
    marginTop: '0.075em',
    backgroundColor: colors.foreground,
    animationName: blink,
    animationDuration: '1.1s',
    animationTimingFunction: 'steps(1)',
    animationIterationCount: 'infinite',
  },
});
