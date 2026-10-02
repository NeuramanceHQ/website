'use client';

import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';
import { useGlitch } from 'react-powerglitch';
import { shared } from '@/components/styles';
import { fonts } from '@/lib/tokens.stylex';

const GLITCH_MS = 3000;
const FIRST_SWITCH_DELAY_MS = 2700;
const NAMES = [
  'NEURAMANCE® CYBERSYSTEMS CORPORATION',
  'NEURAMANCE® CYBERSYSTEMS CORPORATION',
  '神念赛博系统公司',
  '神念サイバーシステム株式会社',
  'न्यूरामैन्स साइबरसिस्टम्स कॉर्पोरेशन',
  'مؤسسة نيورامانس للأنظمة السيبرانية',
];

export function GlitchWordmark() {
  const [step, setStep] = useState(0);
  const { ref } = useGlitch({
    timing: { duration: GLITCH_MS, iterations: Infinity },
    glitchTimeSpan: { start: 0.88, end: 1 },
  });

  useEffect(() => {
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
  }, []);

  return (
    <div ref={ref} {...stylex.props(styles.frame)}>
      <h1 {...stylex.props(shared.gradientText, styles.name)}>
        {NAMES[step % NAMES.length]}
      </h1>
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
    fontFamily: fonts.mono,
    fontSize: '0.875rem',
    lineHeight: { default: '1.25rem', '@media (min-width: 40rem)': 1.25 },
    letterSpacing: '-0.025em',
  },
});
