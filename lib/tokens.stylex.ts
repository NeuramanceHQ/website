import * as stylex from '@stylexjs/stylex';

export const colors = stylex.defineConsts({
  background: '#020202',
  foreground: 'hsl(210 40% 98%)',
  border: '#2f3336',
  muted: '#b8b8b8',
  faint: '#777c8c',
  line: 'rgb(255 255 255 / 0.07)',
  periwinkle: '#aab6ff',
  frost: '#dbf2f4',
  ice: '#a5cfd8',
  night: '#0b1240',
  silhouette: '#0f1650',
  neon: '#9dffd6',
  lamp: '#ffd38a',
  beacon: '#ff5a5a',
});

export const fonts = stylex.defineConsts({
  sans: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  mono: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
});

export const gradients = stylex.defineConsts({
  gray400:
    'linear-gradient(to right, #fff 0%, oklch(70.7% 0.022 261.325) 100%)',
  gray100:
    'linear-gradient(to right, #fff 0%, oklch(96.7% 0.003 264.542) 100%)',
});
