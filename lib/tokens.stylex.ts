import * as stylex from '@stylexjs/stylex';

export const colors = stylex.defineConsts({
  background: '#050506',
  foreground: '#e9edf0',
  muted: '#b8bec9',
  line: 'rgb(255 255 255 / 0.08)',
  frost: '#dbf2f4',
  ice: '#a5cfd8',
  night: '#0b1240',
  neon: '#9dffd6',
  signal: '#e0262e',
});

export const fonts = stylex.defineConsts({
  display:
    'var(--font-display), "Share Tech Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  micro: 'var(--font-micro), "Silkscreen", ui-monospace, monospace',
  mono: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
});

export const clips = stylex.defineConsts({
  chamfer:
    'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
});
