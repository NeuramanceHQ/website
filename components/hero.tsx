'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback } from 'react';

import { useGlobalAudio } from '@/lib/contexts/AudioContext';
import { logWarning } from '@/lib/utils/logger';
import { Button } from './ui/button';
import GlitchWordmark from './ui/glitch-wordmark';
import { Icons } from './ui/icons';

export const Hero = React.memo(() => {
  const { playOverlayTrack } = useGlobalAudio();

  const handleQuoteClick = useCallback(() => {
    try {
      playOverlayTrack('/audio/dune1-intro.mp3', 'dune1-quote', 'Dune 1 Quote');
    } catch (error) {
      logWarning(
        'Dune 1 audio file not found. Please add dune1-intro.mp3 to /public/audio/',
        'Hero',
      );
    }
  }, [playOverlayTrack]);

  return (
    <section className="relative flex h-screen w-full items-center bg-background py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col justify-center space-y-8 text-center">
          <div className="space-y-4">
            <div>
              <GlitchWordmark />
              <div className="ss-disambiguation bg-gradient-to-r from-white to-gray-400 bg-clip-text font-mono text-xs tracking-tight text-transparent">
                Software From the Future.
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center">
                <Icons.faceLevel style={{ width: 95, height: 'auto' }} />
                <div style={{ height: 2 }} />
                <Link href="/about" className="block">
                  <Button
                    size="nav"
                    variant="secondary"
                    className="gap-1"
                    aria-label="Contact Neuramance"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    Contact us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Centered h1 */}
      <h1
        className="ss-disambiguation absolute bottom-2 left-1/2 w-[80%] max-w-5xl -translate-x-1/2 transform px-4 text-center font-mono text-[10px] tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hover:cursor-pointer"
        onClick={handleQuoteClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleQuoteClick()}
        aria-label="Play audio quote"
      >
        A company&apos;s excellence is conveyed in everything it does.
      </h1>
    </section>
  );
});

Hero.displayName = 'Hero';
