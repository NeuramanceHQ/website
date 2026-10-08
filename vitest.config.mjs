import babel from '@rolldown/plugin-babel';
import { configDefaults, defineConfig } from 'vitest/config';
import babelConfig from './babel.config.js';

export default defineConfig({
  plugins: [babel({ plugins: babelConfig.plugins })],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, '.claude/**'],
    allowOnly: false,
  },
});
