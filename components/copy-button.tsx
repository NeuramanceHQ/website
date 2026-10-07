'use client';

import * as stylex from '@stylexjs/stylex';
import { Check } from 'lucide-react';
import { useRef, useState, type ComponentProps } from 'react';
import { button } from '@/components/styles';
import { colors } from '@/lib/tokens.stylex';

const RESET_MS = 2000;
const LABELS = { copied: 'Copied', failed: 'Copy failed' } as const;
const TRACE_GAP = 2;

type Outline = {
  width: number;
  height: number;
  corner: number;
  bevel: boolean;
};

const measure = (element: HTMLElement): Outline => ({
  width: element.offsetWidth,
  height: element.offsetHeight,
  corner: parseFloat(getComputedStyle(element).borderTopLeftRadius),
  bevel: CSS.supports('corner-shape', 'bevel'),
});

const chamfer = ({ width, height, corner }: Outline) => {
  const [left, top] = [-TRACE_GAP, -TRACE_GAP];
  const [right, bottom] = [width + TRACE_GAP, height + TRACE_GAP];
  const cut = corner + 1;
  return [
    [left + cut, top],
    [right - cut, top],
    [right, top + cut],
    [right, bottom - cut],
    [right - cut, bottom],
    [left + cut, bottom],
    [left, bottom - cut],
    [left, top + cut],
  ].join(' ');
};

export function CopyButton({
  text,
  children,
  ...props
}: { text: string } & Omit<ComponentProps<'button'>, 'onClick' | 'type'>) {
  const [status, setStatus] = useState<keyof typeof LABELS>();
  const [outline, setOutline] = useState<Outline>();
  const self = useRef<HTMLButtonElement>(null);
  const reset = useRef<ReturnType<typeof setTimeout>>(undefined);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setOutline(self.current ? measure(self.current) : undefined);
      setStatus('copied');
    } catch (error) {
      setStatus('failed');
      reportError(error);
    }
    clearTimeout(reset.current);
    reset.current = setTimeout(() => setStatus(undefined), RESET_MS);
  };
  return (
    <>
      <button {...props} ref={self} type="button" onClick={copy}>
        <span {...stylex.props(styles.stack)}>
          <span {...stylex.props(styles.face, status && styles.hidden)}>
            {children}
          </span>
          {status && (
            <span key={status} {...stylex.props(styles.face, styles.status)}>
              {status === 'copied' && (
                <Check
                  aria-hidden
                  {...stylex.props(
                    button.icon,
                    'data-metal' in props && button.etched,
                    styles.check,
                  )}
                />
              )}
              {LABELS[status]}
            </span>
          )}
        </span>
        {status === 'copied' && outline && (
          <svg aria-hidden {...stylex.props(styles.trace)}>
            {outline.bevel ? (
              <polygon points={chamfer(outline)} pathLength={1} />
            ) : (
              <rect
                x={-TRACE_GAP}
                y={-TRACE_GAP}
                width={outline.width + 2 * TRACE_GAP}
                height={outline.height + 2 * TRACE_GAP}
                rx={outline.corner + TRACE_GAP}
                pathLength={1}
              />
            )}
          </svg>
        )}
      </button>
      <output aria-live="polite" {...stylex.props(styles.announcer)}>
        {status && LABELS[status]}
      </output>
    </>
  );
}

const rise = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(0.25em)' },
  to: { opacity: 1, transform: 'none' },
});

const draw = stylex.keyframes({
  from: { strokeDashoffset: 24 },
  to: { strokeDashoffset: 0 },
});

const cut = stylex.keyframes({
  '0%': { strokeDashoffset: 1, opacity: 1 },
  '60%': { strokeDashoffset: 0, opacity: 1 },
  '100%': { strokeDashoffset: 0, opacity: 0 },
});

const MOTION = '@media (prefers-reduced-motion: no-preference)';

const styles = stylex.create({
  announcer: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
  stack: {
    display: 'inline-grid',
  },
  face: {
    gridRow: 1,
    gridColumn: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  hidden: {
    visibility: 'hidden',
  },
  status: {
    animationName: { default: null, [MOTION]: rise },
    animationDuration: '220ms',
    animationTimingFunction: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  },
  trace: {
    display: { default: 'none', [MOTION]: 'block' },
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
    pointerEvents: 'none',
    fill: 'none',
    stroke: colors.signal,
    strokeWidth: 1.5,
    strokeDasharray: 1,
    animationName: cut,
    animationDuration: '1.1s',
    animationFillMode: 'forwards',
    animationTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
  check: {
    strokeDasharray: 24,
    animationName: { default: null, [MOTION]: draw },
    animationDuration: '320ms',
    animationDelay: '60ms',
    animationFillMode: 'backwards',
    animationTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
});
