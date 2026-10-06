import * as stylex from '@stylexjs/stylex';
import { colors, fonts } from '@/lib/tokens.stylex';

const HOVER = '@media (hover: hover)';
const FOCUS_RING = `0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.foreground}`;
const METAL_EDGE =
  'inset 0 1px 0 #ffffff, inset 0 -1px 0 rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.5)';
const METAL_RAISED = `${METAL_EDGE}, 0 3px 0 #8f939b, 0 3px 0 1px rgb(0 0 0 / 0.55), 0 12px 24px -8px rgb(0 0 0 / 0.75)`;
const METAL_PRESSED = `${METAL_EDGE}, 0 0 0 #8f939b, 0 0 0 1px rgb(0 0 0 / 0.55), 0 4px 10px -6px rgb(0 0 0 / 0.7)`;
const GHOST_EDGE =
  'inset 0 0 0 1px rgb(255 255 255 / 0.16), inset 0 1px 0 rgb(255 255 255 / 0.08)';
const GHOST_EDGE_LIT =
  'inset 0 0 0 1px rgb(255 255 255 / 0.26), inset 0 1px 0 rgb(255 255 255 / 0.14)';
const SHEEN =
  'linear-gradient(105deg, transparent 32%, rgb(0 0 0 / 0.07) 42%, #ffffff 50%, rgb(0 0 0 / 0.07) 58%, transparent 68%)';

const SHEEN_START = '100% 0, 0 0';
const SHEEN_END = '0 0, 0 0';

const glint = stylex.keyframes({
  from: { backgroundPosition: SHEEN_START },
  to: { backgroundPosition: SHEEN_END },
});

export const frame = stylex.create({
  base: {
    width: '100%',
    maxWidth: '80rem',
    marginInline: 'auto',
    paddingInline: { default: '1rem', '@media (min-width: 48rem)': '2.5rem' },
  },
});

export const button = stylex.create({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    flexShrink: 0,
    borderRadius: 8,
    cornerShape: 'bevel',
    fontFamily: fonts.sans,
    fontWeight: 500,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    color: colors.ink,
    boxShadow: { default: null, ':focus-visible': FOCUS_RING },
    transform: { default: null, ':active': 'translateY(1px)' },
    transitionProperty: 'background-color, box-shadow, transform',
    transitionDuration: '120ms',
  },
  metal: {
    backgroundImage: {
      default: `${SHEEN}, linear-gradient(#ffffff, #e6e7ea)`,
      [HOVER]: {
        default: null,
        ':hover': `${SHEEN}, linear-gradient(#ffffff, #f1f2f4)`,
      },
      ':active': `${SHEEN}, linear-gradient(#e6e7ea, #f4f5f6)`,
    },
    backgroundSize: '300% 100%, 100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'var(--sheen-x, 100%) 0, 0 0',
    textShadow: '0 1px 0 rgb(255 255 255 / 0.75)',
    transform: { default: null, ':active': 'translateY(3px)' },
    transitionProperty: 'background-position, box-shadow, transform',
    transitionDuration: '700ms, 120ms, 120ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
    boxShadow: {
      default: METAL_RAISED,
      ':focus-visible': `${METAL_RAISED}, ${FOCUS_RING}`,
      ':active': METAL_PRESSED,
    },
  },
  glint: {
    animationName: {
      default: null,
      '@media (prefers-reduced-motion: no-preference)': glint,
    },
    animationDuration: '1.1s',
    animationDelay: '0.8s',
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  ghost: {
    color: colors.foreground,
    backgroundColor: {
      default: 'rgb(255 255 255 / 0.04)',
      [HOVER]: { default: null, ':hover': 'rgb(255 255 255 / 0.08)' },
    },
    boxShadow: {
      default: GHOST_EDGE,
      [HOVER]: { default: null, ':hover': GHOST_EDGE_LIT },
      ':focus-visible': `${GHOST_EDGE}, ${FOCUS_RING}`,
    },
    backdropFilter: 'blur(8px)',
  },
  small: {
    height: 40,
    paddingInline: '1rem',
    fontSize: 15,
  },
  large: {
    height: 56,
    paddingInline: '1.75rem',
    fontSize: 18,
  },
  icon: {
    width: '1em',
    height: '1em',
  },
});

export const tag = stylex.create({
  kicker: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: '0.5rem',
    columnGap: '0.75rem',
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '1.25rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: colors.muted,
  },
  chip: {
    paddingBlock: '0.25rem',
    paddingInline: '0.5rem',
    borderRadius: 4,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: '1rem',
    letterSpacing: 0,
    textTransform: 'none',
    color: colors.foreground,
    backgroundColor: 'rgb(255 255 255 / 0.08)',
  },
});

export const panel = stylex.create({
  page: {
    display: 'grid',
    placeItems: 'center',
    minHeight: '70dvh',
    paddingBlock: '6rem',
    paddingInline: '1rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '34rem',
    padding: { default: '1.75rem', '@media (min-width: 40rem)': '2.5rem' },
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: 'rgb(13 13 15 / 0.72)',
    backdropFilter: 'blur(12px)',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '1.25rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: colors.muted,
  },
  title: {
    fontSize: { default: '1.75rem', '@media (min-width: 40rem)': '2.25rem' },
    fontWeight: 500,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    color: colors.foreground,
  },
  body: {
    fontSize: 16,
    lineHeight: '1.625rem',
    color: colors.muted,
  },
});
