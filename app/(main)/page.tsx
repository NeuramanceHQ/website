import * as stylex from '@stylexjs/stylex';
import { Copy } from 'lucide-react';
import localFont from 'next/font/local';
import Link from 'next/link';
import { AgentSession } from '@/components/agent-session';
import { Broadcast } from '@/components/broadcast';
import { CopyButton } from '@/components/copy-button';
import { GlitchWordmark } from '@/components/glitch-wordmark';
import { SoundButton } from '@/components/sound-button';
import { shared } from '@/components/styles';
import { colors, fonts } from '@/lib/tokens.stylex';

const ACCESS_HREF =
  'mailto:austin@neuramance.com?subject=Neuramance%20Metaltech%20access';

const AGENT_PROMPT =
  'Read https://neuramance.com/llms.txt, then draft an email to austin@neuramance.com requesting Neuramance Metaltech beta access, describing the physical parts this project needs.';

const wordmark = localFont({
  src: '../../lib/fonts/SairaWordmark.woff2',
  weight: '200',
  declarations: [{ prop: 'font-stretch', value: '125%' }],
});

const SPLIT = '@media (min-width: 40rem) and (min-aspect-ratio: 1 / 1)';
const ROOMY =
  '@media (min-width: 60rem) and (min-height: 40rem) and (min-aspect-ratio: 1 / 1)';
const COMPACT = '@media (max-height: 46rem)';
const SHORT = '@media (max-height: 36rem)';
const TINY = '@media (max-height: 30rem)';

export default function Page() {
  return (
    <main {...stylex.props(styles.main)}>
      <div aria-hidden {...stylex.props(styles.frame)} />
      <div {...stylex.props(styles.grid)}>
        <div {...stylex.props(styles.intro)}>
          <p {...stylex.props(styles.status)}>
            <span {...stylex.props(styles.led)} />
            Private beta · Austin, TX
          </p>
          <p aria-hidden {...stylex.props(styles.aero)}>
            <span className={wordmark.className}>neuramance</span>
          </p>
          <GlitchWordmark />
        </div>
        <div {...stylex.props(styles.stage)}>
          <div {...stylex.props(styles.screen)}>
            <div {...stylex.props(styles.ticks)}>
              <Broadcast>
                <h2>Give your agents hands.</h2>
              </Broadcast>
            </div>
            <div aria-hidden {...stylex.props(styles.legend)}>
              <span>FIG. 01 — Austin, Texas</span>
              <span {...stylex.props(styles.catalog)}>
                <span {...stylex.props(styles.barcode)} />
                NMT-001
              </span>
            </div>
          </div>
        </div>
        <div {...stylex.props(styles.details)}>
          <p {...stylex.props(styles.lead)}>
            Physical parts and metal work for AI agents.{' '}
            <span {...stylex.props(styles.leadMuted)}>
              Claude Code, Codex, and any agent can quote, order, and track real
              fabrication, programmatically.
            </span>
          </p>
          <div {...stylex.props(styles.actions)}>
            <a href={ACCESS_HREF} {...stylex.props(styles.primary)}>
              Request access
            </a>
            <CopyButton text={AGENT_PROMPT} {...stylex.props(styles.secondary)}>
              <Copy aria-hidden {...stylex.props(styles.icon)} />
              Copy agent prompt
            </CopyButton>
          </div>
          <Link
            href="/llms.txt"
            prefetch={false}
            {...stylex.props(styles.agents)}
          >
            For agents: /llms.txt
          </Link>
        </div>
        <div {...stylex.props(styles.session)}>
          <AgentSession />
        </div>
      </div>
      <SoundButton
        sound="/audio/dune1-intro.mp3"
        aria-label="Play audio quote"
        {...stylex.props(shared.gradientText, shared.quote, styles.quote)}
      >
        A company&apos;s excellence is conveyed in everything it does.
      </SoundButton>
    </main>
  );
}

const glow = stylex.keyframes({ '50%': { opacity: 0.45 } });

const styles = stylex.create({
  main: {
    position: 'relative',
    display: 'grid',
    alignItems: 'center',
    width: '100%',
    height: '100dvh',
    overflowX: 'clip',
    overflowY: 'auto',
    paddingTop: '3.5rem',
    paddingBottom: { default: '3.5rem', [SPLIT]: '2.75rem', [TINY]: '1rem' },
    backgroundImage:
      'radial-gradient(60% 50% at 64% 50%, rgb(54 70 217 / 0.13), transparent 70%)',
  },
  frame: {
    display: { default: 'none', [SPLIT]: 'block' },
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: {
      default: 'min(100% - 2rem, 86rem)',
      '@media (min-width: 100rem)': '98rem',
    },
    translate: '-50%',
    pointerEvents: 'none',
    borderInlineWidth: 1,
    borderInlineStyle: 'solid',
    borderInlineColor: colors.line,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [SPLIT]: 'minmax(16rem, min(27rem, 42%)) minmax(0, 1fr)',
    },
    gridTemplateRows: {
      default: 'auto minmax(0, 1fr) auto',
      [SPLIT]: '1fr auto auto auto 1fr',
    },
    columnGap: { default: '3rem', '@media (min-width: 80rem)': '4.5rem' },
    rowGap: { default: '1.25rem', [SPLIT]: 0 },
    width: '100%',
    height: '100%',
    maxWidth: { default: '84rem', '@media (min-width: 100rem)': '96rem' },
    marginInline: 'auto',
    paddingInline: { default: '1rem', '@media (min-width: 48rem)': '2.5rem' },
  },
  intro: {
    gridColumnStart: { default: 'auto', [SPLIT]: 1 },
    gridRowStart: { default: 'auto', [SPLIT]: 2 },
    display: 'flex',
    flexDirection: 'column',
    alignItems: { default: 'center', [SPLIT]: 'flex-start' },
    gap: '0.75rem',
    textAlign: { default: 'center', [SPLIT]: 'start' },
  },
  status: {
    display: { default: 'inline-flex', [COMPACT]: 'none' },
    alignItems: 'center',
    gap: '0.5rem',
    height: 22,
    paddingInline: '0.625rem',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: colors.ice,
    backgroundImage:
      'linear-gradient(180deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02))',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(255 255 255 / 0.1)',
    borderRadius: 999,
    boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.08)',
  },
  led: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: colors.neon,
    boxShadow: `0 0 6px ${colors.neon}, 0 0 12px rgb(157 255 214 / 0.5)`,
    animationName: glow,
    animationDuration: '2.8s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
  aero: {
    display: { default: 'block', [SHORT]: 'none' },
    marginTop: '0.25rem',
    fontSize: { default: '2.25rem', '@media (min-width: 64rem)': '3rem' },
    lineHeight: 1,
    letterSpacing: '0.02em',
    color: colors.frost,
    textShadow:
      '0 0 1px rgb(255 255 255 / 0.6), 0 0 14px rgb(165 207 216 / 0.45), 0 0 34px rgb(90 127 243 / 0.3)',
  },
  stage: {
    gridColumnStart: { default: 'auto', [SPLIT]: 2 },
    gridRowStart: { default: 'auto', [SPLIT]: 1 },
    gridRowEnd: { default: 'auto', [SPLIT]: -1 },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
    containerType: 'size',
  },
  screen: {
    width: {
      default: 'min(100cqw, 100cqh * 4 / 3)',
      [SPLIT]: 'min(100cqw, (100cqh - 2.5rem) * 4 / 3)',
    },
  },
  ticks: {
    position: 'relative',
    '::before': {
      content: '""',
      display: { default: 'none', [SPLIT]: 'block' },
      position: 'absolute',
      top: -12,
      right: -12,
      bottom: -12,
      left: -12,
      pointerEvents: 'none',
      color: 'rgb(219 242 244 / 0.4)',
      backgroundImage:
        'linear-gradient(currentColor, currentColor), linear-gradient(currentColor, currentColor), linear-gradient(currentColor, currentColor), linear-gradient(currentColor, currentColor), linear-gradient(currentColor, currentColor), linear-gradient(currentColor, currentColor), linear-gradient(currentColor, currentColor), linear-gradient(currentColor, currentColor)',
      backgroundSize:
        '12px 1px, 1px 12px, 12px 1px, 1px 12px, 12px 1px, 1px 12px, 12px 1px, 1px 12px',
      backgroundPosition:
        'top left, top left, top right, top right, bottom left, bottom left, bottom right, bottom right',
      backgroundRepeat: 'no-repeat',
    },
  },
  legend: {
    display: {
      default: 'none',
      [SPLIT]: { default: 'none', '@container (min-width: 28rem)': 'flex' },
    },
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '1.25rem',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: colors.faint,
  },
  catalog: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  barcode: {
    width: 54,
    height: 10,
    opacity: 0.55,
    backgroundImage:
      'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 3px, currentColor 3px 5px, transparent 5px 6px, currentColor 6px 7px, transparent 7px 10px)',
  },
  details: {
    gridColumnStart: { default: 'auto', [SPLIT]: 1 },
    gridRowStart: { default: 'auto', [SPLIT]: 3 },
    marginTop: { default: 0, [SPLIT]: '1.75rem' },
    display: 'flex',
    flexDirection: 'column',
    alignItems: { default: 'center', [SPLIT]: 'flex-start' },
    gap: '1.25rem',
    textAlign: { default: 'center', [SPLIT]: 'start' },
  },
  lead: {
    maxWidth: '26rem',
    fontSize: {
      default: '1.0625rem',
      '@media (min-width: 64rem)': '1.3125rem',
    },
    lineHeight: { default: '1.5rem', '@media (min-width: 64rem)': '1.875rem' },
    fontWeight: 500,
    letterSpacing: '-0.015em',
    textWrap: 'pretty',
    color: colors.foreground,
  },
  leadMuted: {
    color: colors.faint,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: { default: 'center', [SPLIT]: 'flex-start' },
    gap: '0.625rem',
  },
  primary: {
    display: 'inline-flex',
    alignItems: 'center',
    height: 40,
    paddingInline: '1.25rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    color: '#05070f',
    backgroundImage:
      'linear-gradient(180deg, #ffffff 0%, #eef1f5 44%, #c4cad0 52%, #e3e8ee 100%)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(255 255 255 / 0.9)',
    borderRadius: 999,
    boxShadow: {
      default:
        'inset 0 1px 0 #fff, inset 0 -1px 0 rgb(61 64 81 / 0.45), 0 0 22px rgb(165 207 216 / 0.25)',
      '@media (hover: hover)': {
        default: null,
        ':hover':
          'inset 0 1px 0 #fff, inset 0 -1px 0 rgb(61 64 81 / 0.45), 0 0 32px rgb(165 207 216 / 0.5)',
      },
    },
    transitionProperty: 'box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  secondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    minWidth: '11.25rem',
    height: 40,
    paddingInline: '1rem',
    fontFamily: fonts.mono,
    fontSize: '0.75rem',
    cursor: 'pointer',
    color: colors.foreground,
    backgroundImage: {
      default:
        'linear-gradient(180deg, rgb(255 255 255 / 0.09), rgb(255 255 255 / 0.03))',
      '@media (hover: hover)': {
        default: null,
        ':hover':
          'linear-gradient(180deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.05))',
      },
    },
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(255 255 255 / 0.14)',
    borderRadius: 999,
    boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.1)',
  },
  icon: {
    width: '0.875rem',
    height: '0.875rem',
  },
  agents: {
    display: { default: 'inline', [COMPACT]: 'none' },
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: '0.02em',
    color: colors.faint,
    textDecorationLine: {
      default: 'none',
      '@media (hover: hover)': { default: null, ':hover': 'underline' },
    },
    textUnderlineOffset: '0.2em',
  },
  session: {
    gridColumnStart: { default: 'auto', [SPLIT]: 1 },
    gridRowStart: { default: 'auto', [SPLIT]: 4 },
    display: { default: 'none', [ROOMY]: 'block' },
    marginTop: '1.75rem',
    width: '100%',
    maxWidth: '24rem',
  },
  quote: {
    display: { default: 'block', [TINY]: 'none' },
  },
});
