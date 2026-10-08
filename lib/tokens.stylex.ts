import * as stylex from '@stylexjs/stylex';

export const colors = stylex.defineConsts({
  background: '#050506',
  foreground: '#f5f5f2',
  muted: 'rgb(245 245 242 / 0.62)',
  faint: 'rgb(245 245 242 / 0.5)',
  line: 'rgb(255 255 255 / 0.1)',
  card: '#17171a',
  lime: '#e4f222',
  ink: '#0b0b0c',
  signal: '#ff6a3d',
});

export const fonts = stylex.defineConsts({
  sans: 'var(--font-sans), ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
  mono: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
});
