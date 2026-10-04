import * as stylex from '@stylexjs/stylex';
import { ArrowUpRight, Copy } from 'lucide-react';
import Link from 'next/link';
import { CopyButton } from '@/components/copy-button';
import { GlitchWordmark } from '@/components/glitch-wordmark';
import { SoundButton } from '@/components/sound-button';
import { access, accessSize, panel } from '@/components/styles';
import { WORDMARK } from '@/lib/logotype';
import { ACCESS_HREF } from '@/lib/site';
import { clips, colors, fonts } from '@/lib/tokens.stylex';

const AGENT_PROMPT =
  'Read https://neuramance.com/llms.txt, then draft an email to austin@neuramance.com requesting Neuramance Metaltech beta access, describing the physical parts this project needs.';

const SERVICES = ['CNC machining', 'Sheet metal', 'Laser cutting', 'Finishing'];

const STEPS = [
  {
    title: 'Send file',
    detail: 'Your agent sends a CAD file (STEP, DXF), material, and quantity.',
  },
  {
    title: 'Get quote',
    detail: 'Price and lead time come back as structured data.',
  },
  {
    title: 'Parts ship',
    detail: 'We fabricate, inspect, and ship. Status arrives in code.',
  },
];

const WORDMARK_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${WORDMARK.width} ${WORDMARK.height}'><path d='${[...WORDMARK.name, ...WORDMARK.division].join('')}'/></svg>`,
)}")`;

const SPLIT = '@media (min-width: 40rem) and (min-aspect-ratio: 1 / 1)';
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
        <div {...stylex.props(styles.offer)}>
          <p {...stylex.props(styles.eyebrow)}>
            Private beta — metal parts for AI agents
          </p>
          <h2 {...stylex.props(styles.headline)}>
            <span>Your agent sends the CAD file.</span>{' '}
            <span {...stylex.props(styles.second)}>
              We ship the metal part.
            </span>
          </h2>
          <p {...stylex.props(styles.lead)}>
            Claude Code, Codex, or any AI agent quotes, orders, and tracks real
            fabrication in code.
          </p>
          <ul {...stylex.props(styles.services)}>
            {SERVICES.map((service, index) => (
              <li key={service} {...stylex.props(styles.service)}>
                <span aria-hidden {...stylex.props(styles.number)}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{service}</span>
              </li>
            ))}
          </ul>
          <div {...stylex.props(styles.actions)}>
            <a
              href={ACCESS_HREF}
              {...stylex.props(
                stylex.defaultMarker(),
                access.link,
                accessSize.large,
              )}
            >
              <span aria-hidden {...stylex.props(access.swatches)} />
              <span aria-hidden {...stylex.props(access.note)}>
                Private beta
              </span>
              <span>Request access</span>
              <span aria-hidden {...stylex.props(access.arrow)}>
                <ArrowUpRight {...stylex.props(access.glyph)} />
              </span>
            </a>
            <CopyButton text={AGENT_PROMPT} {...stylex.props(styles.copy)}>
              <Copy aria-hidden {...stylex.props(styles.icon)} />
              Copy agent prompt
            </CopyButton>
          </div>
        </div>
        <section
          aria-label="How it works"
          {...stylex.props(panel.card, styles.steps)}
        >
          <p {...stylex.props(panel.label)}>How it works</p>
          <ol {...stylex.props(styles.list)}>
            {STEPS.map((step, index) => (
              <li key={step.title} {...stylex.props(styles.step)}>
                <span aria-hidden {...stylex.props(styles.stepNumber)}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span {...stylex.props(styles.stepText)}>
                  <span {...stylex.props(styles.stepTitle)}>{step.title}</span>
                  <span {...stylex.props(styles.stepDetail)}>
                    {step.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
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
      [SPLIT]: 'minmax(0, 1fr) minmax(16rem, 24rem)',
      [SHORT]: 'minmax(0, 1fr)',
    },
    alignItems: 'center',
    columnGap: { default: '2rem', '@media (min-width: 80rem)': '4rem' },
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 0,
  },
  offer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: {
      default: 'center',
      [SPLIT]: 'flex-start',
    },
    gap: { default: '0.9rem', [SPLIT]: '1.25rem', [COMPACT]: '0.9rem' },
    minWidth: 0,
    textAlign: { default: 'center', [SPLIT]: 'start' },
  },
  eyebrow: {
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
    textTransform: 'uppercase',
    color: colors.ice,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: {
      default: 'clamp(1.25rem, 6.2vw, 2rem)',
      [SPLIT]: 'clamp(1.25rem, min(3.4vw, 5.2dvh), 3.25rem)',
    },
    lineHeight: 1.05,
    letterSpacing: '0.01em',
    textTransform: 'uppercase',
    textWrap: 'balance',
    color: colors.foreground,
  },
  second: {
    display: 'block',
    color: colors.ice,
  },
  lead: {
    display: { default: 'block', [COMPACT]: 'none' },
    maxWidth: '34rem',
    fontFamily: fonts.display,
    fontSize: { default: 14, [SPLIT]: 15 },
    lineHeight: 1.5,
    color: colors.muted,
  },
  services: {
    display: { default: 'flex', [SHORT]: 'none' },
    flexWrap: 'wrap',
    justifyContent: { default: 'center', [SPLIT]: 'flex-start' },
    gap: '0.375rem',
    listStyleType: 'none',
  },
  service: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '0.45rem',
    paddingBlock: '0.35rem',
    paddingInline: '0.7rem',
    fontFamily: fonts.display,
    fontSize: 12,
    lineHeight: 1,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.foreground,
    backgroundImage:
      'linear-gradient(180deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02))',
    boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.12)',
  },
  number: {
    fontFamily: fonts.micro,
    fontSize: 8,
    color: colors.ice,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: {
      default: 'center',
      [SPLIT]: 'flex-start',
    },
    gap: '0.75rem',
    width: { default: '100%', '@media (min-width: 40rem)': 'auto' },
    marginTop: { default: 0, [SPLIT]: '0.25rem' },
  },
  copy: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    width: { default: '100%', '@media (min-width: 40rem)': 'auto' },
    height: {
      default: 64,
      [COMPACT]: 56,
      '@media (max-width: 39.99rem)': 56,
    },
    paddingInline: '1.5rem',
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    color: colors.foreground,
    backgroundImage: {
      default:
        'linear-gradient(180deg, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.03))',
      '@media (hover: hover)': {
        default: null,
        ':hover':
          'linear-gradient(180deg, rgb(255 255 255 / 0.16), rgb(255 255 255 / 0.05))',
      },
    },
    boxShadow:
      'inset 0 1px 0 rgb(255 255 255 / 0.18), inset 0 0 0 1px rgb(255 255 255 / 0.12)',
    clipPath: clips.chamfer,
  },
  icon: {
    width: '0.9rem',
    height: '0.9rem',
  },
  steps: {
    display: { default: 'none', [SPLIT]: 'flex', [SHORT]: 'none' },
    maxWidth: 'none',
    padding: '1.5rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: '1rem', [COMPACT]: '0.75rem' },
    listStyleType: 'none',
  },
  step: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    alignItems: 'start',
    columnGap: '1rem',
    paddingTop: { default: '1rem', [COMPACT]: '0.75rem' },
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  stepNumber: {
    fontFamily: fonts.display,
    fontSize: { default: '2.5rem', [COMPACT]: '1.75rem' },
    lineHeight: 0.9,
    color: 'transparent',
    WebkitTextStrokeWidth: 1,
    WebkitTextStrokeColor: colors.ice,
  },
  stepText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  stepTitle: {
    fontFamily: fonts.display,
    fontSize: { default: 16, [COMPACT]: 14 },
    lineHeight: 1.1,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  stepDetail: {
    display: { default: 'block', [COMPACT]: 'none' },
    fontFamily: fonts.display,
    fontSize: 13,
    lineHeight: 1.45,
    color: colors.muted,
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
    color: colors.muted,
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
