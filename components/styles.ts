import * as stylex from '@stylexjs/stylex';
import { chrome, colors, fonts } from '@/lib/tokens.stylex';

const CHAMFER =
  'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)';

export const cta = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    height: 40,
    paddingInline: '1.125rem',
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    clipPath: CHAMFER,
    transitionProperty: 'filter',
    transitionDuration: '150ms',
    filter: {
      default: 'none',
      '@media (hover: hover)': { default: null, ':hover': 'brightness(1.15)' },
    },
  },
  primary: {
    color: '#05070f',
    backgroundImage: chrome.button,
    boxShadow:
      'inset 0 1px 0 #fff, inset 0 -1px 0 rgb(61 64 81 / 0.5), inset 1px 0 0 rgb(255 255 255 / 0.6)',
  },
  secondary: {
    color: colors.foreground,
    backgroundImage:
      'linear-gradient(180deg, rgb(255 255 255 / 0.11), rgb(255 255 255 / 0.03))',
    boxShadow:
      'inset 0 1px 0 rgb(255 255 255 / 0.18), inset 0 0 0 1px rgb(255 255 255 / 0.1)',
  },
  small: {
    height: 28,
    paddingInline: '0.75rem',
    fontSize: 11,
  },
});

export const panel = stylex.create({
  page: {
    display: 'grid',
    placeItems: 'center',
    height: '100%',
    overflowY: 'auto',
    paddingBlock: '1.5rem',
    paddingInline: '1rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '34rem',
    padding: '1.75rem',
    backgroundImage:
      'linear-gradient(180deg, rgb(255 255 255 / 0.05), rgb(255 255 255 / 0.015))',
    boxShadow:
      'inset 0 1px 0 rgb(255 255 255 / 0.12), inset 0 0 0 1px rgb(255 255 255 / 0.08)',
    clipPath: CHAMFER,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: fonts.micro,
    fontSize: 8,
    lineHeight: 1,
    textTransform: 'uppercase',
    color: colors.ice,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: '1.75rem',
    lineHeight: 1.1,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  body: {
    fontFamily: fonts.display,
    fontSize: 14,
    lineHeight: '1.375rem',
    color: colors.muted,
  },
});
