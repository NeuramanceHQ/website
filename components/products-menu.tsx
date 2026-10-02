'use client';

import { Menu } from '@base-ui/react/menu';
import * as stylex from '@stylexjs/stylex';
import { Ellipsis } from 'lucide-react';
import { button } from '@/components/styles';
import { colors } from '@/lib/tokens.stylex';

export function ProductsMenu() {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        aria-label="Products"
        openOnHover
        delay={0}
        {...stylex.props(
          button.base,
          button.mono,
          button.compact,
          styles.trigger,
        )}
      >
        <Ellipsis {...stylex.props(styles.icon)} />
        <span {...stylex.props(styles.label)}>Products</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="start"
          sideOffset={8}
          {...stylex.props(styles.positioner)}
        >
          <Menu.Popup {...stylex.props(styles.popup)} />
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const styles = stylex.create({
  trigger: {
    display: { default: 'inline-flex', '@media (min-width: 48rem)': 'none' },
  },
  icon: {
    flexShrink: 0,
    width: 10,
    height: 8,
  },
  label: {
    display: { default: 'none', '@media (min-width: 400px)': 'inline' },
  },
  positioner: {
    zIndex: 50,
  },
  popup: {
    minWidth: '10rem',
    overflow: 'hidden',
    padding: '0.25rem',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    borderRadius: 'calc(0.375rem - 2px)',
    opacity: {
      default: 1,
      ':is([data-starting-style])': 0,
      ':is([data-ending-style])': 0,
    },
    transform: {
      default: 'none',
      ':is([data-starting-style])': 'translateY(-0.5rem) scale(0.95)',
      ':is([data-ending-style])': 'scale(0.95)',
    },
    transitionProperty: 'opacity, transform',
    transitionDuration: '150ms',
  },
});
