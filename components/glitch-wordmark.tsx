'use client';

import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';
import { useGlitch } from 'react-powerglitch';
import { colors, fonts } from '@/lib/tokens.stylex';

const GLITCH_MS = 3000;
const FIRST_SWITCH_DELAY_MS = 2700;
const NAMES = [
  'NEURAMANCE® METALTECH CORPORATION',
  'NEURAMANCE® METALTECH CORPORATION',
  '神念金属科技公司',
  '神念メタルテック株式会社',
  'न्यूरामैन्स मेटलटेक कॉर्पोरेशन',
  'مؤسسة نيورامانس للتقنيات المعدنية',
];

export function GlitchWordmark() {
  const [step, setStep] = useState(0);
  const { ref, stopGlitch } = useGlitch({
    timing: { duration: GLITCH_MS, iterations: Infinity },
    glitchTimeSpan: { start: 0.88, end: 1 },
  });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stopGlitch();
      return;
    }
    let interval: ReturnType<typeof setInterval> | undefined;
    const advance = () => {
      if (!document.hidden) setStep((current) => current + 1);
    };
    const timeout = setTimeout(() => {
      interval = setInterval(advance, GLITCH_MS);
    }, FIRST_SWITCH_DELAY_MS);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [stopGlitch]);

  return (
    <div ref={ref} aria-hidden {...stylex.props(styles.frame)}>
      <p {...stylex.props(styles.name)}>{NAMES[step % NAMES.length]}</p>
    </div>
  );
}

const styles = stylex.create({
  frame: {
    overflow: 'hidden',
    contain: 'layout style',
    willChange: 'transform',
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 12,
    lineHeight: '1rem',
    letterSpacing: '0.14em',
    whiteSpace: 'nowrap',
    color: colors.muted,
  },
});
