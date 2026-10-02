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
        <span>claude — ~/rover</span>
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
    backgroundColor: 'rgb(10 11 16 / 0.82)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(255 255 255 / 0.1)',
    borderRadius: 8,
    boxShadow:
      '0 24px 60px -24px rgb(0 0 0 / 0.9), 0 0 0 1px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.06)',
    backdropFilter: 'blur(12px)',
  },
  titlebar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
    paddingInline: '0.75rem',
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    backgroundImage:
      'linear-gradient(180deg, #2a2d36 0%, #1a1c23 52%, #15171d 100%)',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgb(0 0 0 / 0.7)',
    boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.12)',
  },
  tag: {
    paddingInline: '0.375rem',
    fontSize: 10,
    lineHeight: '1rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.periwinkle,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(170 182 255 / 0.3)',
    borderRadius: 3,
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
    color: colors.faint,
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
