'use client';

import * as stylex from '@stylexjs/stylex';
import { X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { colors } from '@/lib/tokens.stylex';

export function Announcement({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const bar = useRef<HTMLElement>(null);
  if (!open) return null;
  const dismiss = () => {
    if (bar.current?.contains(document.activeElement)) {
      bar.current.nextElementSibling
        ?.querySelector<HTMLElement>('a[href], button')
        ?.focus();
    }
    setOpen(false);
  };
  return (
    <aside ref={bar} aria-label="Announcement" {...stylex.props(styles.bar)}>
      <p {...stylex.props(styles.text)}>{children}</p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={dismiss}
        {...stylex.props(styles.close)}
      >
        <X aria-hidden {...stylex.props(styles.icon)} />
      </button>
    </aside>
  );
}

const styles = stylex.create({
  bar: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingBlock: '0.625rem',
    paddingInline: '3rem',
    color: colors.foreground,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },
  text: {
    fontSize: { default: 13, '@media (min-width: 40rem)': 15 },
    lineHeight: '1.375rem',
    textAlign: 'center',
    textWrap: 'balance',
  },
  close: {
    position: 'absolute',
    top: '50%',
    right: '0.75rem',
    display: 'grid',
    placeItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    translate: '0 -50%',
    cursor: 'pointer',
    color: colors.muted,
    backgroundColor: {
      default: null,
      '@media (hover: hover)': {
        default: null,
        ':hover': 'rgb(255 255 255 / 0.1)',
      },
    },
  },
  icon: {
    width: 18,
    height: 18,
  },
});
