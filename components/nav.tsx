import * as stylex from '@stylexjs/stylex';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { access, accessSize } from '@/components/styles';
import { WORDMARK } from '@/lib/logotype';
import { ACCESS_HREF } from '@/lib/site';
import { colors } from '@/lib/tokens.stylex';

const EXTEND = 2.1;

export function Nav() {
  return (
    <header {...stylex.props(styles.header)}>
      <Link
        href="/"
        aria-label="Neuramance Metaltech home"
        {...stylex.props(styles.lockup)}
      >
        <Image src="/hand.svg" alt="" width={12} height={15} />
        <svg
          aria-hidden
          viewBox={`0 0 ${WORDMARK.width * EXTEND} ${WORDMARK.height}`}
          {...stylex.props(styles.logotype)}
        >
          <g transform={`scale(${EXTEND} 1)`}>
            <path d={WORDMARK.name.join('')} />
            <path
              d={WORDMARK.division.join('')}
              {...stylex.props(styles.division)}
            />
          </g>
        </svg>
      </Link>
      <div {...stylex.props(styles.group)}>
        <a
          href={ACCESS_HREF}
          {...stylex.props(
            stylex.defaultMarker(),
            access.link,
            accessSize.compact,
          )}
        >
          <span aria-hidden {...stylex.props(access.swatches)} />
          Request access
          <span aria-hidden {...stylex.props(access.arrow)}>
            <ArrowUpRight {...stylex.props(access.glyph)} />
          </span>
        </a>
      </div>
    </header>
  );
}

const styles = stylex.create({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    height: 48,
    paddingInline: { default: '1rem', '@media (min-width: 48rem)': '2rem' },
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },
  lockup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    minWidth: 0,
    color: colors.foreground,
  },
  logotype: {
    flexShrink: 0,
    height: 12,
    width: 'auto',
    fill: 'currentColor',
  },
  division: {
    fill: colors.muted,
  },
  group: {
    display: { default: 'none', '@media (min-width: 30rem)': 'flex' },
  },
});
