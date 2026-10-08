'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const REACH = 160;
const GLINT_DELAY_MS = 300;
const GLINT_STAGGER_MS = 150;
const GLINT: KeyframeAnimationOptions = {
  duration: 1100,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

const glinted = new WeakSet<Element>();
const lit = new WeakSet<Element>();

function followPointer() {
  let pointer: { x: number; y: number } | undefined;
  let frame = 0;
  const light = () => {
    frame = 0;
    if (pointer === undefined) {
      return;
    }
    const { x, y } = pointer;
    const measured = Array.from(
      document.querySelectorAll<HTMLElement>('[data-metal]'),
      (metal) => [metal, metal.getBoundingClientRect()] as const,
    );
    for (const [metal, box] of measured) {
      const across = (x - box.left + REACH) / (box.width + 2 * REACH);
      const near =
        x > box.left - REACH &&
        x < box.right + REACH &&
        y > box.top - REACH &&
        y < box.bottom + REACH;
      if (near) {
        lit.add(metal);
        metal.style.setProperty('--sheen-x', `${(1 - across) * 100}%`);
      } else if (lit.delete(metal)) {
        metal.style.setProperty('--sheen-x', across < 0.5 ? '100%' : '0%');
      }
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
}

function glintOnView() {
  const glints = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting && !glinted.has(entry.target))
        .forEach((entry, order) => {
          glinted.add(entry.target);
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
    if (!glinted.has(metal)) glints.observe(metal);
  }
  return () => glints.disconnect();
}

function tiltOnPress() {
  let pressed: HTMLElement | undefined;
  const press = (event: PointerEvent) => {
    if (event.button !== 0 || !(event.target instanceof Element)) {
      return;
    }
    pressed = event.target.closest<HTMLElement>('[data-metal]') ?? undefined;
    if (pressed === undefined) {
      return;
    }
    const box = pressed.getBoundingClientRect();
    const tilt = (offset: number, size: number) => `${(2 * offset) / size - 1}`;
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
  addEventListener('pointerdown', press, { passive: true });
  addEventListener('pointerup', release, { passive: true });
  addEventListener('pointercancel', release, { passive: true });
  return () => {
    removeEventListener('pointerdown', press);
    removeEventListener('pointerup', release);
    removeEventListener('pointercancel', release);
  };
}

export function MetalLight() {
  const pathname = usePathname();
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const stops = [followPointer(), glintOnView(), tiltOnPress()];
    return () => {
      for (const stop of stops) stop();
    };
  }, [pathname]);
  return null;
}
