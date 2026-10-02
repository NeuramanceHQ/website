'use client';

import { useRef, useState, type ComponentProps } from 'react';

const RESET_MS = 2000;
const LABELS = { copied: 'Copied', failed: 'Copy failed' } as const;

export function CopyButton({
  text,
  children,
  ...props
}: { text: string } & Omit<ComponentProps<'button'>, 'onClick' | 'type'>) {
  const [status, setStatus] = useState<keyof typeof LABELS>();
  const reset = useRef<ReturnType<typeof setTimeout>>(undefined);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch (error) {
      setStatus('failed');
      reportError(error);
    }
    clearTimeout(reset.current);
    reset.current = setTimeout(() => setStatus(undefined), RESET_MS);
  };
  return (
    <button {...props} type="button" aria-live="polite" onClick={copy}>
      {status ? LABELS[status] : children}
    </button>
  );
}
