import * as stylex from '@stylexjs/stylex';
import { colors, fonts } from '@/lib/tokens.stylex';

const HOVER = '@media (hover: hover)';
const FOCUS_RING = `0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.foreground}`;

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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    flexShrink: 0,
    borderRadius: 8,
    fontFamily: fonts.sans,
    fontWeight: 500,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    color: colors.ink,
    boxShadow: { default: null, ':focus-visible': FOCUS_RING },
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
  },
  lime: {
    backgroundColor: {
      default: colors.lime,
      [HOVER]: { default: null, ':hover': '#eff86a' },
    },
  },
  light: {
    backgroundColor: {
      default: colors.foreground,
      [HOVER]: { default: null, ':hover': '#ffffff' },
    },
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
