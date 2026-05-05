'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGlitch } from 'react-powerglitch';

/**
 * GlitchWordmark component displays company name in multiple languages
 * with a glitch effect, cycling through languages at timed intervals.
 *
 * Uses interval-based timing instead of animation events because
 * react-powerglitch uses canvas/WebGL rendering which doesn't trigger
 * CSS animation events.
 */
const GlitchWordmark = React.memo(() => {
  const companyNames = useMemo(
    () => [
      { text: 'NEURAMANCE® CYBERSYSTEMS CORPORATION', cycles: 5 },
      { text: '神念赛博系统公司', cycles: 1 },
      { text: '神念サイバーシステム株式会社', cycles: 1 },
      { text: 'न्यूरामैन्स साइबरसिस्टम्स कॉर्पोरेशन', cycles: 1 },
      { text: 'مؤسسة نيورامانس للأنظمة السيبرانية', cycles: 1 },
    ],
    [],
  );

  const [currentText, setCurrentText] = useState(companyNames[0].text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let currentCycles = 0;
    let currentLangIndex = 0;
    let isActive = true;

    const switchLanguage = () => {
      if (!isActive) return;

      currentCycles++;

      // Check if we've completed the required cycles for current language
      if (currentCycles >= companyNames[currentLangIndex].cycles) {
        currentLangIndex = (currentLangIndex + 1) % companyNames.length;
        setCurrentText(companyNames[currentLangIndex].text);
        currentCycles = 0; // Reset cycle count for new language
      }
    };

    // Handle page visibility to pause/resume animation
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        isActive = true;
        // Resume interval when page becomes visible
        if (!intervalRef.current) {
          intervalRef.current = setInterval(switchLanguage, 3000);
        }
      }
    };

    // Initial delay to sync with glitch timing (start changing during glitch effect)
    const initialTimeout = setTimeout(() => {
      // Set up interval for language switching
      intervalRef.current = setInterval(switchLanguage, 3000); // Every 3 seconds, matching glitch duration
    }, 2700); // Initial delay to align with glitch effect (90% of 3000ms)

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      isActive = false;
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [companyNames]); // companyNames is memoized, so this effect only runs once

  const glitch = useGlitch({
    timing: {
      duration: 3000, // Animation lasts 3 seconds
      iterations: Infinity, // Repeat forever
    },
    glitchTimeSpan: {
      /**
       * Start time of the glitch in percent, between 0 and 1.
       */
      start: 0.88,
      /**
       * End time of the glitch in percent, between 0 and 1.
       */
      end: 1.0,
    },
  });

  return (
    <div
      ref={glitch.ref}
      className="text-white"
      style={{
        contain: 'layout style',
        overflow: 'hidden',
        willChange: 'transform',
      }}
    >
      <h1 className="ss-disambiguation bg-gradient-to-r from-white to-gray-400 bg-clip-text font-mono text-sm tracking-tight text-transparent sm:text-sm sm:leading-tight xl:text-sm/none xl:leading-tight">
        {currentText}
      </h1>
    </div>
  );
});

GlitchWordmark.displayName = 'GlitchWordmark';

export default GlitchWordmark;
