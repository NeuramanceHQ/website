'use client';

import { useEffect } from 'react';

const REACH = 160;

export function MetalLight() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let pointer: { x: number; y: number } | undefined;
    let frame = 0;
    const light = () => {
      frame = 0;
      if (pointer === undefined) {
        return;
      }
      for (const metal of document.querySelectorAll<HTMLElement>(
        '[data-metal]',
      )) {
        const box = metal.getBoundingClientRect();
        const near =
          pointer.x > box.left - REACH &&
          pointer.x < box.right + REACH &&
          pointer.y > box.top - REACH &&
          pointer.y < box.bottom + REACH;
        const across = (pointer.x - box.left + REACH) / (box.width + 2 * REACH);
        const sheen = near ? 1 - across : across < 0.5 ? 1 : 0;
        metal.style.setProperty('--sheen-x', `${sheen * 100}%`);
      }
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(light);
    };
    const move = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('scroll', schedule, { passive: true });
    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('scroll', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
