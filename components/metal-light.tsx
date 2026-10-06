'use client';

import { useEffect } from 'react';

const REACH = 160;
const GLINT_DELAY_MS = 300;
const GLINT_STAGGER_MS = 150;
const GLINT: KeyframeAnimationOptions = {
  duration: 1100,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

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
    const glints = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, order) => {
            glints.unobserve(entry.target);
            entry.target.animate(
              [{ '--sheen-x': '100%' }, { '--sheen-x': '0%' }],
              { ...GLINT, delay: GLINT_DELAY_MS + order * GLINT_STAGGER_MS },
            );
          });
      },
      { threshold: 0.6 },
    );
    for (const metal of document.querySelectorAll('[data-metal]')) {
      glints.observe(metal);
    }
    let pressed: HTMLElement | undefined;
    const press = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      pressed = event.target.closest<HTMLElement>('[data-metal]') ?? undefined;
      if (pressed === undefined) {
        return;
      }
      const box = pressed.getBoundingClientRect();
      const tilt = (offset: number, size: number) =>
        `${(2 * offset) / size - 1}`;
      pressed.style.setProperty(
        '--tilt-x',
        tilt(event.clientX - box.left, box.width),
      );
      pressed.style.setProperty(
        '--tilt-y',
        tilt(event.clientY - box.top, box.height),
      );
    };
    const release = () => {
      pressed?.style.setProperty('--tilt-x', '0');
      pressed?.style.setProperty('--tilt-y', '0');
      pressed = undefined;
    };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', press, { passive: true });
    addEventListener('pointerup', release, { passive: true });
    addEventListener('pointercancel', release, { passive: true });
    addEventListener('scroll', schedule, { passive: true });
    return () => {
      glints.disconnect();
      removeEventListener('pointermove', move);
      removeEventListener('pointerdown', press);
      removeEventListener('pointerup', release);
      removeEventListener('pointercancel', release);
      removeEventListener('scroll', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
