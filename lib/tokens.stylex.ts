import * as stylex from '@stylexjs/stylex';

export const colors = stylex.defineConsts({
  background: '#050506',
  foreground: '#e9edf0',
  muted: '#9aa0ae',
  faint: '#777c8c',
  line: 'rgb(255 255 255 / 0.08)',
  periwinkle: '#aab6ff',
  frost: '#dbf2f4',
  ice: '#a5cfd8',
  night: '#0b1240',
  silhouette: '#0f1650',
  neon: '#9dffd6',
  lamp: '#ffd38a',
  beacon: '#ff5a5a',
  signal: '#e0262e',
});

export const fonts = stylex.defineConsts({
  display:
    'var(--font-display), "Share Tech Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  micro: 'var(--font-micro), "Silkscreen", ui-monospace, monospace',
  mono: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
});

export const chrome = stylex.defineConsts({
  button:
    'linear-gradient(180deg, #ffffff 0%, #eef1f5 44%, #c4cad0 52%, #e3e8ee 100%)',
});
