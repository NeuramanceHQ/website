import * as stylex from '@stylexjs/stylex';
import { Copy } from 'lucide-react';
import Link from 'next/link';
import { AgentSession } from '@/components/agent-session';
import { Broadcast } from '@/components/broadcast';
import { CopyButton } from '@/components/copy-button';
import { GlitchWordmark } from '@/components/glitch-wordmark';
import { SoundButton } from '@/components/sound-button';
import { cta } from '@/components/styles';
import { WORDMARK } from '@/lib/logotype';
import { ACCESS_HREF } from '@/lib/site';
import { colors, fonts } from '@/lib/tokens.stylex';

const AGENT_PROMPT =
  'Read https://neuramance.com/llms.txt, then draft an email to austin@neuramance.com requesting Neuramance Metaltech beta access, describing the physical parts this project needs.';

const SPEC = [
  'Metal parts',
  'For AI agents',
  'Quote / order / track',
  'In code',
  'Private beta',
];

const WORDMARK_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${WORDMARK.width} ${WORDMARK.height}'><path d='${[...WORDMARK.name, ...WORDMARK.division].join('')}'/></svg>`,
)}")`;

const SPLIT = '@media (min-width: 40rem) and (min-aspect-ratio: 1 / 1)';
const ROOMY =
  '@media (min-width: 72rem) and (min-height: 44rem) and (min-aspect-ratio: 1 / 1)';
const COMPACT = '@media (max-height: 46rem)';
const SHORT = '@media (max-height: 36rem)';
const TINY = '@media (max-height: 30rem)';

export default function Page() {
  return (
    <main {...stylex.props(styles.main)}>
      <div aria-hidden {...stylex.props(styles.grain)} />
      <div {...stylex.props(styles.caption)}>
        <span>Fig. 00 — Metal parts for AI agents</span>
        <span {...stylex.props(styles.wide)}>Est. 2025 — Austin, Texas</span>
      </div>
      <h1
        aria-label="Neuramance® Metaltech Corporation"
        {...stylex.props(styles.heading)}
      >
        <div {...stylex.props(styles.plate)}>
          <svg
            aria-hidden
            viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
            {...stylex.props(styles.logotype)}
          >
            <defs>
              <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.2" stopColor="#e2ebf4" />
                <stop offset="0.46" stopColor="#93a6c8" />
                <stop offset="0.5" stopColor="#1b2756" />
                <stop offset="0.53" stopColor="#5a6fa8" />
                <stop offset="0.62" stopColor="#bfdde4" />
                <stop offset="0.8" stopColor="#f3f8fa" />
                <stop offset="1" stopColor="#8494b6" />
              </linearGradient>
            </defs>
            {[...WORDMARK.name, ...WORDMARK.division].map((d, index) => (
              <path
                key={d}
                d={d}
                fill="url(#steel)"
                {...stylex.props(styles.letter(`${120 + index * 55}ms`))}
              />
            ))}
          </svg>
          <div aria-hidden {...stylex.props(styles.shine(WORDMARK_MASK))}>
            <div {...stylex.props(styles.glint)} />
          </div>
        </div>
      </h1>
      <div {...stylex.props(styles.meta)}>
        <GlitchWordmark />
        <p {...stylex.props(styles.beta)}>
          <span aria-hidden {...stylex.props(styles.led)} />
          No. 001 — 2026
        </p>
      </div>
      <div {...stylex.props(styles.content)}>
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
        <div {...stylex.props(styles.spec)}>
          <ul {...stylex.props(styles.list)}>
            {SPEC.map((line, index) => (
              <li key={line} {...stylex.props(styles.item)}>
                <span aria-hidden {...stylex.props(styles.index)}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                {line}
              </li>
            ))}
          </ul>
          <p {...stylex.props(styles.lead)}>
            Claude Code, Codex, and any agent can quote, order, and track real
            fabrication, programmatically.
          </p>
          <div {...stylex.props(styles.actions)}>
            <a
              href={ACCESS_HREF}
              {...stylex.props(cta.base, cta.primary, styles.button)}
            >
              Request access ↗
            </a>
            <CopyButton
              text={AGENT_PROMPT}
              {...stylex.props(cta.base, cta.secondary, styles.button)}
            >
              <Copy aria-hidden {...stylex.props(styles.icon)} />
              Copy agent prompt
            </CopyButton>
          </div>
        </div>
        <div {...stylex.props(styles.session)}>
          <AgentSession />
        </div>
      </div>
      <footer {...stylex.props(styles.footer)}>
        <span>www.neuramance.com</span>
        <Link href="/llms.txt" prefetch={false} {...stylex.props(styles.link)}>
          For agents: /llms.txt
        </Link>
        <SoundButton
          sound="/audio/dune1-intro.mp3"
          aria-label="Play audio quote"
          {...stylex.props(styles.quote)}
        >
          A company&apos;s excellence is conveyed in everything it does.
        </SoundButton>
        <span {...stylex.props(styles.wide)}>30.27°N 97.74°W</span>
      </footer>
    </main>
  );
}

const powerOn = stylex.keyframes({
  '0%': { opacity: 0 },
  '30%': { opacity: 0.7 },
  '45%': { opacity: 0.15 },
  '70%': { opacity: 1 },
  '82%': { opacity: 0.6 },
  '100%': { opacity: 1 },
});

const glow = stylex.keyframes({ '50%': { opacity: 0.45 } });

const sweep = stylex.keyframes({
  '0%': { transform: 'translateX(-110%)' },
  '22%, 100%': { transform: 'translateX(470%)' },
});

const styles = stylex.create({
  main: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: { default: '0.75rem', [SPLIT]: '1rem' },
    width: '100%',
    maxWidth: '120rem',
    height: '100%',
    marginInline: 'auto',
    overflowX: 'clip',
    overflowY: 'auto',
    paddingTop: { default: '0.875rem', [SPLIT]: '1.25rem' },
    paddingBottom: '0.75rem',
    paddingInline: { default: '1rem', '@media (min-width: 48rem)': '2rem' },
    backgroundImage:
      'radial-gradient(55% 45% at 30% 72%, rgb(54 70 217 / 0.14), transparent 70%)',
  },
  grain: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    opacity: 0.05,
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
  },
  caption: {
    display: { default: 'flex', [COMPACT]: 'none' },
    justifyContent: 'space-between',
    gap: '1rem',
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  wide: {
    display: { default: 'none', '@media (min-width: 40rem)': 'inline' },
  },
  heading: {
    display: 'flex',
  },
  plate: {
    position: 'relative',
    width: 'clamp(16rem, (100dvh - 12.5rem) * 2.8, 100%)',
  },
  logotype: {
    display: 'block',
    width: '100%',
    height: 'auto',
    overflow: 'visible',
    filter:
      'drop-shadow(0 1px 0 rgb(0 0 0 / 0.9)) drop-shadow(0 0 28px rgb(165 207 216 / 0.16))',
  },
  shine: (mask: string) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    maskImage: mask,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  }),
  glint: {
    width: '22%',
    height: '100%',
    transform: 'translateX(-110%)',
    mixBlendMode: 'screen',
    backgroundImage:
      'linear-gradient(105deg, transparent 20%, rgb(255 255 255 / 0.15) 40%, rgb(255 255 255 / 0.95) 50%, rgb(219 242 244 / 0.15) 60%, transparent 80%)',
    animationName: sweep,
    animationDuration: '7s',
    animationDelay: '1.4s',
    animationTimingFunction: 'cubic-bezier(0.45, 0, 0.2, 1)',
    animationIterationCount: 'infinite',
    animationFillMode: 'both',
  },
  letter: (delay: string) => ({
    animationName: powerOn,
    animationDuration: '560ms',
    animationDelay: delay,
    animationTimingFunction: 'steps(1, end)',
    animationFillMode: 'both',
  }),
  meta: {
    display: { default: 'flex', [SHORT]: 'none' },
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingTop: '0.625rem',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  beta: {
    display: { default: 'none', '@media (min-width: 40rem)': 'flex' },
    flexShrink: 0,
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
    textTransform: 'uppercase',
    color: colors.ice,
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
  content: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [SPLIT]: 'minmax(0, 1fr) minmax(15rem, min(24rem, 40%))',
      [ROOMY]: 'minmax(0, 1fr) minmax(15rem, 21rem) minmax(18rem, 21rem)',
    },
    gridTemplateRows: {
      default: 'minmax(0, 1fr) auto',
      [SPLIT]: 'minmax(0, 1fr)',
    },
    columnGap: { default: '2rem', '@media (min-width: 80rem)': '3rem' },
    rowGap: '1rem',
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 0,
    paddingTop: { default: '0.25rem', [SPLIT]: '0.75rem' },
  },
  stage: {
    display: 'flex',
    alignItems: { default: 'center', [SPLIT]: 'flex-start' },
    justifyContent: { default: 'center', [SPLIT]: 'flex-start' },
    minHeight: 0,
    containerType: 'size',
  },
  screen: {
    width: {
      default: 'min(100cqw, 100cqh * 4 / 3)',
      [SPLIT]: 'min(100cqw - 24px, (100cqh - 2.75rem) * 4 / 3)',
    },
    marginInline: { default: 0, [SPLIT]: '12px' },
    marginTop: { default: 0, [SPLIT]: '12px' },
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
      [SPLIT]: { default: 'none', '@container (min-width: 26rem)': 'flex' },
    },
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '1.25rem',
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
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
    opacity: 0.6,
    backgroundImage:
      'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 3px, currentColor 3px 5px, transparent 5px 6px, currentColor 6px 7px, transparent 7px 10px)',
  },
  spec: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: { default: 'center', [SPLIT]: 'flex-start' },
    gap: { default: '0.875rem', [SPLIT]: '1.25rem' },
    textAlign: { default: 'center', [SPLIT]: 'start' },
  },
  list: {
    listStyleType: 'none',
    fontFamily: fonts.display,
    fontSize: {
      default: '1.125rem',
      [SPLIT]: '1.5rem',
      '@media (min-width: 80rem) and (min-height: 62rem)': '1.875rem',
      [TINY]: '1.125rem',
    },
    lineHeight: 1.08,
    letterSpacing: '0.01em',
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  item: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.625rem',
    paddingInline: '0.25rem',
    marginInline: '-0.25rem',
    transitionProperty: 'background-color, color',
    transitionDuration: '80ms',
    backgroundColor: {
      default: 'transparent',
      '@media (hover: hover)': { default: null, ':hover': colors.frost },
    },
    color: {
      default: null,
      '@media (hover: hover)': { default: null, ':hover': colors.background },
    },
  },
  index: {
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
    color: colors.faint,
  },
  lead: {
    display: { default: 'block', [COMPACT]: 'none' },
    maxWidth: '22rem',
    fontFamily: fonts.display,
    fontSize: 13,
    lineHeight: '1.25rem',
    color: colors.muted,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: { default: 'center', [SPLIT]: 'flex-start' },
    gap: '0.625rem',
  },
  button: {
    minWidth: '13.5rem',
  },
  icon: {
    width: '0.875rem',
    height: '0.875rem',
  },
  session: {
    display: { default: 'none', [ROOMY]: 'block' },
  },
  footer: {
    display: { default: 'flex', [TINY]: 'none' },
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: '1.5rem',
    rowGap: '0.375rem',
    paddingTop: '0.625rem',
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
    textTransform: 'uppercase',
    color: colors.faint,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  link: {
    color: colors.muted,
    textDecorationLine: {
      default: 'none',
      '@media (hover: hover)': { default: null, ':hover': 'underline' },
    },
    textUnderlineOffset: '0.25em',
  },
  quote: {
    display: { default: 'none', '@media (min-width: 64rem)': 'inline' },
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: '0.04em',
    textTransform: 'none',
    color: colors.muted,
    cursor: 'pointer',
  },
});
