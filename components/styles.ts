import * as stylex from '@stylexjs/stylex';
import { clips, colors, fonts } from '@/lib/tokens.stylex';

const NARROW = '@media (max-width: 39.99rem)';
const COMPACT = '@media (max-height: 46rem)';
const PAPER = '#ffffff';
const SWATCHES =
  'linear-gradient(90deg, #a5cfd8 0 12.5%, #3646d9 0 25%, #050506 0 37.5%, #93a6c8 0 50%, #0b1240 0 62.5%, #9dffd6 0 75%, #5a6fa8 0 87.5%, #e0262e 0)';

const reveal = stylex.keyframes({
  from: { clipPath: 'inset(0 100% 0 0)' },
  to: { clipPath: 'inset(0 0 0 0)' },
});

const swap = stylex.keyframes({
  '50%': { transform: 'translate(120%, -120%)' },
  '50.01%': { transform: 'translate(-120%, 120%)' },
});

export const access = stylex.create({
  link: {
    flexShrink: 0,
    lineHeight: 1,
    textAlign: 'start',
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    color: colors.background,
    backgroundColor: {
      default: colors.foreground,
      ':focus-visible': PAPER,
      '@media (hover: hover)': { default: null, ':hover': PAPER },
    },
    translate: { default: '0 0', ':active': '0 1px' },
    transitionProperty: 'background-color, translate',
    transitionDuration: '160ms',
  },
  swatches: {
    width: '3.5em',
    height: 3,
    backgroundImage: SWATCHES,
    animationName: reveal,
    animationDuration: '640ms',
    animationDelay: '900ms',
    animationTimingFunction: 'steps(8, end)',
    animationFillMode: 'both',
  },
  note: {
    justifySelf: 'end',
    fontFamily: fonts.micro,
    fontSize: 8,
    letterSpacing: '0.04em',
    color: 'rgb(5 5 6 / 0.55)',
  },
  arrow: {
    display: 'flex',
    justifySelf: 'end',
    overflow: 'hidden',
  },
  glyph: {
    width: '1.1em',
    height: '1.1em',
    animationName: {
      default: null,
      [stylex.when.ancestor(':focus-visible')]: swap,
      '@media (hover: hover)': {
        default: null,
        [stylex.when.ancestor(':hover')]: swap,
      },
    },
    animationDuration: '520ms',
    animationTimingFunction: 'cubic-bezier(0.7, 0, 0.3, 1)',
  },
});

export const accessSize = stylex.create({
  large: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignContent: 'space-between',
    alignItems: 'center',
    width: { default: '100%', '@media (min-width: 40rem)': 'auto' },
    minWidth: { default: 0, '@media (min-width: 40rem)': '20rem' },
    height: { default: 64, [COMPACT]: 56, [NARROW]: 56 },
    paddingTop: { default: '0.65em', [COMPACT]: '0.5em' },
    paddingBottom: { default: '0.55em', [COMPACT]: '0.4em' },
    paddingInline: '0.8em',
    fontSize: { default: 20, [NARROW]: 17 },
    letterSpacing: { default: '0.14em', [NARROW]: '0.08em' },
  },
  compact: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.9em',
    height: 34,
    paddingInline: '0.9em',
    fontSize: 12,
    letterSpacing: '0.12em',
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
    clipPath: clips.chamfer,
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
