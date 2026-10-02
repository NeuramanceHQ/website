'use client';

import type { ComponentProps } from 'react';

let player: HTMLAudioElement | undefined;

export function SoundButton({
  sound,
  ...props
}: { sound: string } & Omit<ComponentProps<'button'>, 'onClick' | 'type'>) {
  const play = () => {
    player ??= new Audio();
    player.src = sound;
    player.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      reportError(error);
    });
  };
  return <button {...props} type="button" onClick={play} />;
}
