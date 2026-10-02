import * as stylex from '@stylexjs/stylex';
import { colors, fonts, gradients } from '@/lib/tokens.stylex';

export const shared = stylex.create({
  container: {
    width: '100%',
    maxWidth: { default: 'none', '@media (min-width: 1400px)': '1400px' },
    marginInline: 'auto',
    paddingInline: { default: '1rem', '@media (min-width: 48rem)': '1.5rem' },
  },
  gradientText: {
    backgroundImage: gradients.gray400,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  quote: {
    position: 'absolute',
    bottom: '0.5rem',
    left: '50%',
    width: '80%',
    maxWidth: '64rem',
    translate: '-50%',
    paddingInline: '1rem',
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: '-0.025em',
    cursor: 'pointer',
  },
});

export const button = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    height: 26,
    paddingBlock: '0.25rem',
    paddingLeft: '0.5rem',
    paddingRight: '0.625rem',
    whiteSpace: 'nowrap',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: {
      default: colors.background,
      '@media (hover: hover)': { default: null, ':hover': colors.border },
    },
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    borderRadius: '0.375rem',
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  mono: {
    fontFamily: fonts.mono,
  },
  compact: {
    paddingLeft: { default: '0.375rem', '@media (min-width: 40rem)': '0.5rem' },
    paddingRight: {
      default: '0.375rem',
      '@media (min-width: 40rem)': '0.625rem',
    },
  },
});
