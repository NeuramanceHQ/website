import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import Link from 'next/link';
import { MusicToggle } from '@/components/music';
import { button, frame } from '@/components/styles';
import { REGISTERED_WORDMARK } from '@/lib/logotype';
import { ACCESS_HREF } from '@/lib/site';
import { colors } from '@/lib/tokens.stylex';

const ROOMY = '@media (min-width: 22.5rem)';
const FULL_LOGO = '@media (min-width: 25rem)';
const WIDE = '@media (min-width: 64rem)';

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#services', label: 'Services' },
  { href: '/#agents', label: 'For agents' },
];

export function Nav() {
  return (
    <header {...stylex.props(styles.header)}>
      <div {...stylex.props(frame.base, styles.bar)}>
        <Link
          href="/"
          aria-label="Neuramance home"
          {...stylex.props(styles.lockup)}
        >
          <Image
            src="/hand.svg"
            loading="eager"
            alt=""
            width={21}
            height={26}
            {...stylex.props(styles.hand)}
          />
          <svg
            aria-hidden
            viewBox={`0 0 ${REGISTERED_WORDMARK.width} ${REGISTERED_WORDMARK.height}`}
            {...stylex.props(styles.logotype)}
          >
            <path d={REGISTERED_WORDMARK.letters} />
            <path
              d={REGISTERED_WORDMARK.registered}
              transform={REGISTERED_WORDMARK.registeredTransform}
            />
          </svg>
        </Link>
        <nav aria-label="Primary" {...stylex.props(styles.links)}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              {...stylex.props(styles.link)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div {...stylex.props(styles.actions)}>
          <MusicToggle />
          <a
            href={ACCESS_HREF}
            data-metal
            {...stylex.props(button.base, button.metal, button.small)}
          >
            Request access
          </a>
        </div>
      </div>
    </header>
  );
}

const styles = stylex.create({
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: 'rgb(5 5 6 / 0.72)',
    backdropFilter: 'blur(16px)',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: { default: '0.5rem', [ROOMY]: '1rem', [WIDE]: '2.5rem' },
    height: 64,
  },
  lockup: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: { default: '0.5rem', [FULL_LOGO]: '0.625rem' },
    color: colors.foreground,
  },
  hand: {
    display: { default: 'none', [ROOMY]: 'block' },
    height: { default: 20, [FULL_LOGO]: 26 },
    width: 'auto',
  },
  logotype: {
    height: { default: 13, [FULL_LOGO]: 17 },
    width: 'auto',
    fill: 'currentColor',
  },
  links: {
    display: { default: 'none', [WIDE]: 'flex' },
    gap: '2rem',
  },
  link: {
    fontSize: 16,
    color: {
      default: colors.foreground,
      '@media (hover: hover)': { default: null, ':hover': colors.muted },
    },
    transitionProperty: 'color',
    transitionDuration: '150ms',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto',
  },
});
