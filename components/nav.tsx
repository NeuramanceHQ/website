import * as stylex from '@stylexjs/stylex';
import { Terminal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductsMenu } from '@/components/products-menu';
import { button } from '@/components/styles';
import { colors } from '@/lib/tokens.stylex';

export function Nav() {
  return (
    <header {...stylex.props(styles.header)}>
      <div {...stylex.props(styles.group)}>
        <Link
          href="/"
          {...stylex.props(
            button.base,
            button.mono,
            button.compact,
            styles.fixed,
          )}
        >
          <Image src="/hand.svg" alt="Hand icon" width={10} height={8} />
          <span {...stylex.props(styles.brand)}>Neuramance</span>
        </Link>
        <ProductsMenu />
      </div>
      <Link
        href="/about"
        aria-label="About/Contact"
        {...stylex.props(button.base, button.mono, styles.fixed)}
      >
        <Terminal {...stylex.props(styles.icon)} />
        <span {...stylex.props(styles.about)}>About/Contact</span>
      </Link>
    </header>
  );
}

const styles = stylex.create({
  header: {
    position: 'fixed',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.25rem',
    width: '100%',
    paddingBlock: '0.25rem',
    paddingInline: {
      default: '0.25rem',
      '@media (min-width: 40rem)': '0.5rem',
    },
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.border,
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: { default: '0.125rem', '@media (min-width: 40rem)': '0.25rem' },
    minWidth: 0,
  },
  fixed: {
    flexShrink: 0,
  },
  brand: {
    display: { default: 'none', '@media (min-width: 360px)': 'inline' },
  },
  about: {
    display: { default: 'none', '@media (min-width: 40rem)': 'inline' },
  },
  icon: {
    width: 10,
    height: 8,
  },
});
