import * as stylex from '@stylexjs/stylex';
import { Copy, Terminal } from 'lucide-react';
import { CopyButton } from '@/components/copy-button';
import { Marquee } from '@/components/marquee';
import { Showcase } from '@/components/showcase';
import { button, frame, tag, text } from '@/components/styles';
import { AGENT_PROMPT } from '@/lib/site';
import { colors, fonts } from '@/lib/tokens.stylex';

const FACTS = [
  ['Agent guide', '/llms.txt'],
  ['CAD formats', 'STEP · DXF'],
  ['Quotes return as', 'Structured data'],
  ['Order status', 'In code'],
  ['Shop', 'Austin, TX'],
];

const SECTION = '@media (min-width: 64rem)';
const STACK = '@media (max-width: 39.99rem)';

export function Hero() {
  return (
    <div {...stylex.props(styles.hero)}>
      <div aria-hidden {...stylex.props(styles.dots)} />
      <div {...stylex.props(frame.base, styles.intro)}>
        <p {...stylex.props(tag.kicker)}>
          Metal parts ordered by AI agents
          <span {...stylex.props(tag.chip)}>Private beta</span>
        </p>
        <h1 {...stylex.props(styles.title)}>
          <span {...stylex.props(styles.line)}>
            Your agent sends the CAD file.
          </span>{' '}
          <span {...stylex.props(styles.line)}>We ship the metal part.</span>
        </h1>
        <p {...stylex.props(text.lead)}>
          CNC machining, sheet metal, laser cutting, and finishing, ordered by
          your agent in code.
        </p>
        <div {...stylex.props(styles.form)}>
          <p {...stylex.props(styles.field)}>
            <Terminal aria-hidden {...stylex.props(styles.fieldIcon)} />
            <span {...stylex.props(styles.fieldText)}>{AGENT_PROMPT}</span>
          </p>
          <CopyButton
            text={AGENT_PROMPT}
            data-metal
            {...stylex.props(
              button.base,
              button.metal,
              button.large,
              styles.submit,
            )}
          >
            <Copy aria-hidden {...stylex.props(button.icon, button.etched)} />
            Copy agent prompt
          </CopyButton>
        </div>
        <p {...stylex.props(styles.note)}>
          Paste it into Claude Code, Codex, or any agent. It drafts your access
          request.
        </p>
      </div>
      <div {...stylex.props(frame.base)}>
        <Showcase />
      </div>
      <div {...stylex.props(styles.ticker)}>
        <div {...stylex.props(frame.base, styles.tickerRow)}>
          <Marquee label="At a glance">
            {FACTS.map(([label, value]) => (
              <li key={label} {...stylex.props(styles.fact)}>
                {label}:<span {...stylex.props(tag.chip)}>{value}</span>
              </li>
            ))}
          </Marquee>
        </div>
      </div>
    </div>
  );
}

const DOT_GRID =
  'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.16) 1px, transparent 0)';

const styles = stylex.create({
  hero: {
    position: 'relative',
    isolation: 'isolate',
  },
  dots: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
    width: '100%',
    height: '100%',
    backgroundImage: DOT_GRID,
    backgroundSize: '18px 18px',
    maskImage: 'linear-gradient(to bottom, black, black 35%, transparent 75%)',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: { default: '3.5rem', [SECTION]: '4.5rem' },
    paddingBottom: { default: '3rem', [SECTION]: '3.5rem' },
  },
  title: {
    marginTop: '1.5rem',
    fontSize: 'clamp(2.5rem, 6vw, 4.75rem)',
    fontWeight: 500,
    lineHeight: 1.02,
    letterSpacing: '-0.032em',
    textWrap: 'balance',
    color: colors.foreground,
  },
  line: {
    display: { default: 'inline', [SECTION]: 'block' },
  },
  form: {
    display: 'flex',
    flexDirection: { default: 'row', [STACK]: 'column' },
    gap: '0.375rem',
    width: '100%',
    maxWidth: '44rem',
    marginTop: '2rem',
    padding: '0.375rem',
    borderRadius: 14,
    cornerShape: 'bevel',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(255 255 255 / 0.14)',
    backgroundColor: 'rgb(255 255 255 / 0.05)',
  },
  field: {
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
    minHeight: 56,
    paddingInline: '1.125rem',
    fontFamily: fonts.mono,
    fontSize: 15,
    color: colors.muted,
  },
  fieldIcon: {
    flexShrink: 0,
    width: 18,
    height: 18,
    color: colors.faint,
  },
  fieldText: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    maskImage: 'linear-gradient(to right, black 70%, transparent)',
  },
  submit: {
    borderRadius: { default: 7, '@supports (corner-shape: bevel)': 10 },
  },
  note: {
    marginTop: '1rem',
    fontSize: 15,
    lineHeight: '1.375rem',
    color: colors.muted,
  },
  ticker: {
    position: 'sticky',
    bottom: 0,
    zIndex: 5,
    backgroundColor: 'rgb(5 5 6 / 0.82)',
    backdropFilter: 'blur(16px)',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  tickerRow: {
    display: 'flex',
    alignItems: 'center',
    height: 56,
  },
  fact: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '0.625rem',
    paddingInline: '1.25rem',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    color: colors.muted,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: colors.line,
  },
});
