<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Neuramance website

Static marketing site: no backend, database, or auth.

Stack: Next.js 16 App Router with Turbopack, React 19, TypeScript 7, StyleX, Base UI, Bun, Node 24 LTS, Vitest with Testing Library, Playwright, Oxlint, Oxfmt.

## Commands

Use Bun only, and run scripts with `bun run` (`bun test` starts Bun's runner, not Vitest).

- `bun run dev`: development server
- `bun run build`, `bun run start`: production build and server
- `bun run lint`: Oxlint, type-aware, warnings fail
- `bun run format`, `bun run format:check`: Oxfmt
- `bun run typecheck`: route types, then `tsc`
- `bun run test`: Vitest component tests
- `bun run test:e2e`: Playwright against a fresh production build on port 3100

Done means `lint`, `format:check`, `typecheck`, `test`, `test:e2e`, and `build` all pass.

## Layout

- `app/layout.tsx`: metadata, fonts (`next/font/local` from `lib/fonts`), JSON-LD, body styles
- `app/globals.css`: reset inside `@layer resets`, then the `@stylex;` directive where StyleX emits its CSS
- `app/(main)/`: pages sharing the announcement bar, sticky header, and footer (`/`, `/waitlist`, `/error`); `error.tsx` renders the `/error` page as the error boundary
- `components/`: `announcement` (dismissible top bar), `nav` (sticky header), `footer`, `marquee` (endless, pausable ticker), `video-background` (YouTube background fixed behind every page), `copy-button`, `sound-button` (one shared `Audio` element for the audio quote), `music` (header toggle for the looping background track: Web Audio, 90-second equal-power crossfade loop, autoplays where the browser allows it and otherwise on the first interaction, remembers a mute), `styles.ts` (shared StyleX styles: page frame, buttons, labels, panels)
- `lib/tokens.stylex.ts`: design constants (`defineConsts`) for colors and fonts
- `lib/logotype.ts`: the NEURAMANCE wordmark (Chakra Petch Bold outlines with ®) shared by the nav and footer; `lib/site.ts`: the access email, agent prompt, video ID, and music track; the licensed track is served from i9's `/srv/media` at `media.neuramance.com` with a content-hashed name, never committed to this public repo

## Styling

- Style with `stylex.create` and `{...stylex.props(...)}`; `app/globals.css` is the only CSS file.
- StyleX compiles through `babel.config.js` (Turbopack picks it up) and `postcss.config.mjs`; `vitest.config.mjs` reuses the Babel plugins.
- Spread `stylex.props` onto Base UI parts and target their state attributes with keys such as `':is([data-starting-style])'`.
- Write line heights in `rem`, not `calc()` ratios, which the CSS minifier rounds.
- Focus outlines are removed globally on purpose.
