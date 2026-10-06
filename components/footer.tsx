import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import Link from 'next/link';
import { SoundButton } from '@/components/sound-button';
import { frame } from '@/components/styles';
import { REGISTERED_WORDMARK } from '@/lib/logotype';
import { ACCESS_HREF, EMAIL } from '@/lib/site';
import { colors } from '@/lib/tokens.stylex';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#services', label: 'Services' },
      { href: '/#agents', label: 'For agents' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: ACCESS_HREF, label: 'Request access' },
      { href: `mailto:${EMAIL}`, label: EMAIL },
      { href: '/llms.txt', label: 'llms.txt' },
    ],
  },
];

export function Footer() {
  return (
    <footer {...stylex.props(styles.footer)}>
      <div {...stylex.props(frame.base, styles.top)}>
        <div {...stylex.props(styles.brand)}>
          <span {...stylex.props(styles.lockup)}>
            <Image src="/hand.svg" alt="" width={21} height={26} />
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
          </span>
          <p {...stylex.props(styles.tagline)}>
            Metal parts ordered by AI agents. Made in Austin, Texas.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav
            key={column.title}
            aria-label={column.title}
            {...stylex.props(styles.column)}
          >
            <p {...stylex.props(styles.heading)}>{column.title}</p>
            {column.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                {...stylex.props(styles.link)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div {...stylex.props(frame.base, styles.bottom)}>
        <span>© Neuramance</span>
        <SoundButton
          sound="/audio/dune1-intro.mp3"
          aria-label="Play audio quote"
          {...stylex.props(styles.quote)}
        >
          A company&apos;s excellence is conveyed in everything it does.
        </SoundButton>
        <span>30.27°N 97.74°W</span>
      </div>
    </footer>
  );
}

const styles = stylex.create({
  footer: {
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    backgroundColor: 'rgb(5 5 6 / 0.6)',
  },
  top: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'auto auto',
      '@media (min-width: 48rem)': 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))',
    },
    justifyContent: {
      default: 'start',
      '@media (min-width: 48rem)': 'stretch',
    },
    rowGap: '2.5rem',
    columnGap: { default: '3rem', '@media (min-width: 48rem)': '2.5rem' },
    paddingBlock: '4rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    gridColumn: { default: '1 / -1', '@media (min-width: 48rem)': 'auto' },
  },
  lockup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    color: colors.foreground,
  },
  logotype: {
    height: 17,
    width: 'auto',
    fill: 'currentColor',
  },
  tagline: {
    maxWidth: '20rem',
    fontSize: 15,
    lineHeight: '1.5rem',
    color: colors.muted,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  heading: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '1.25rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: colors.faint,
  },
  link: {
    fontSize: 15,
    lineHeight: '1.375rem',
    color: {
      default: colors.foreground,
      '@media (hover: hover)': { default: null, ':hover': colors.muted },
    },
  },
  bottom: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: '0.75rem',
    columnGap: '2rem',
    paddingBlock: '1.5rem',
    fontSize: 13,
    lineHeight: '1.25rem',
    color: colors.faint,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  quote: {
    textAlign: 'start',
    cursor: 'pointer',
    color: {
      default: colors.muted,
      '@media (hover: hover)': { default: null, ':hover': colors.foreground },
    },
  },
});
