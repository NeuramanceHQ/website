import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import Link from 'next/link';
import { Clock } from '@/components/clock';
import { cta } from '@/components/styles';
import { WORDMARK } from '@/lib/logotype';
import { ACCESS_HREF, BACKGROUND_VIDEO_URL } from '@/lib/site';
import { colors, fonts } from '@/lib/tokens.stylex';

const EXTEND = 2.1;

export function Nav() {
  return (
    <header {...stylex.props(styles.header)}>
      <Link
        href="/"
        aria-label="Neuramance Metaltech home"
        {...stylex.props(styles.lockup)}
      >
        <Image src="/hand.svg" alt="" width={12} height={15} />
        <svg
          aria-hidden
          viewBox={`0 0 ${WORDMARK.width * EXTEND} ${WORDMARK.height}`}
          {...stylex.props(styles.logotype)}
        >
          <g transform={`scale(${EXTEND} 1)`}>
            <path d={WORDMARK.name.join('')} />
            <path
              d={WORDMARK.division.join('')}
              {...stylex.props(styles.division)}
            />
          </g>
        </svg>
      </Link>
      <div {...stylex.props(styles.group)}>
        <p {...stylex.props(styles.onAir)}>
          <span aria-hidden {...stylex.props(styles.dot)} />
          On air
          <Clock {...stylex.props(styles.clock)} />
        </p>
        <a
          href={BACKGROUND_VIDEO_URL}
          target="_blank"
          rel="noopener noreferrer"
          {...stylex.props(styles.credit)}
        >
          Video — yaego, Eye to Eye ↗
        </a>
        <a
          href={ACCESS_HREF}
          {...stylex.props(cta.base, cta.primary, cta.small, styles.access)}
        >
          Request access ↗
        </a>
      </div>
    </header>
  );
}

const blink = stylex.keyframes({ '50%': { opacity: 0.25 } });

const styles = stylex.create({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    height: 48,
    paddingInline: { default: '1rem', '@media (min-width: 48rem)': '2rem' },
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },
  lockup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    minWidth: 0,
    color: colors.foreground,
  },
  logotype: {
    flexShrink: 0,
    height: 12,
    width: 'auto',
    fill: 'currentColor',
  },
  division: {
    fill: colors.muted,
  },
  access: {
    display: { default: 'none', '@media (min-width: 30rem)': 'inline-flex' },
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  onAir: {
    display: { default: 'none', '@media (min-width: 48rem)': 'flex' },
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  credit: {
    display: { default: 'none', '@media (min-width: 64rem)': 'inline' },
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
    textTransform: 'uppercase',
    color: colors.muted,
    textDecorationLine: {
      default: 'none',
      '@media (hover: hover)': { default: null, ':hover': 'underline' },
    },
    textUnderlineOffset: '0.25em',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: colors.signal,
    boxShadow: `0 0 6px ${colors.signal}`,
    animationName: blink,
    animationDuration: '1.6s',
    animationTimingFunction: 'steps(1)',
    animationIterationCount: 'infinite',
  },
  clock: {
    minWidth: '9ch',
    color: colors.foreground,
    fontVariantNumeric: 'tabular-nums',
  },
});
