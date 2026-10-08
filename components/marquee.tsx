'use client';

import * as stylex from '@stylexjs/stylex';
import { Pause, Play } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { colors } from '@/lib/tokens.stylex';

const REDUCED = '@media (prefers-reduced-motion: reduce)';
const HOVER = '@media (hover: hover)';

export function Marquee({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [paused, setPaused] = useState(false);
  const Icon = paused ? Play : Pause;
  return (
    <div {...stylex.props(styles.marquee)}>
      <button
        type="button"
        aria-label="Pause scrolling"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
        {...stylex.props(styles.toggle)}
      >
        <Icon aria-hidden {...stylex.props(styles.icon)} />
      </button>
      <div {...stylex.props(stylex.defaultMarker(), styles.viewport)}>
        <ul
          aria-label={label}
          {...stylex.props(styles.group, paused && styles.paused)}
        >
          {children}
        </ul>
        <ul
          aria-hidden
          inert
          {...stylex.props(styles.group, styles.clone, paused && styles.paused)}
        >
          {children}
        </ul>
      </div>
    </div>
  );
}

const scroll = stylex.keyframes({
  to: { transform: 'translateX(-100%)' },
});

const styles = stylex.create({
  marquee: {
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  toggle: {
    display: { default: 'grid', [REDUCED]: 'none' },
    flexShrink: 0,
    placeItems: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: 'pointer',
    color: {
      default: colors.faint,
      [HOVER]: { default: null, ':hover': colors.foreground },
    },
    backgroundColor: {
      default: null,
      [HOVER]: { default: null, ':hover': 'rgb(255 255 255 / 0.1)' },
    },
  },
  icon: {
    width: 14,
    height: 14,
  },
  viewport: {
    display: 'flex',
    flexGrow: 1,
    minWidth: 0,
    overflowX: { default: 'hidden', [REDUCED]: 'auto' },
    scrollbarWidth: 'none',
    maskImage: {
      default:
        'linear-gradient(to right, transparent, black 3rem, black calc(100% - 3rem), transparent)',
      [REDUCED]: 'linear-gradient(to right, black 85%, transparent)',
    },
  },
  group: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    minWidth: '100%',
    listStyleType: 'none',
    animationName: scroll,
    animationDuration: '40s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationPlayState: {
      default: 'running',
      [HOVER]: {
        default: null,
        [stylex.when.ancestor(':hover')]: 'paused',
      },
    },
  },
  paused: {
    animationPlayState: 'paused',
  },
  clone: {
    display: { default: 'flex', [REDUCED]: 'none' },
  },
});
