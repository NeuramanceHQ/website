import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SoundButton } from './sound-button';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('plays every press through one shared audio element and reports only real failures', async () => {
  const blocked = new DOMException('Playback blocked', 'NotAllowedError');
  const outcomes = [
    () => Promise.resolve(),
    () => Promise.reject(new DOMException('Replaced', 'AbortError')),
    () => Promise.reject(blocked),
  ];
  const plays: { player: object; src: string }[] = [];
  let created = 0;
  vi.stubGlobal(
    'Audio',
    class {
      src = '';
      constructor() {
        created += 1;
      }
      play() {
        plays.push({ player: this, src: this.src });
        return outcomes[plays.length - 1]();
      }
    },
  );
  const reportError = vi.fn();
  vi.stubGlobal('reportError', reportError);
  render(
    <>
      <SoundButton sound="/audio/first.mp3">First</SoundButton>
      <SoundButton sound="/audio/second.mp3">Second</SoundButton>
    </>,
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    fireEvent.click(screen.getByRole('button', { name: 'Second' }));
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
  });

  expect(created).toBe(1);
  expect(plays.map(({ src }) => src)).toEqual([
    '/audio/first.mp3',
    '/audio/second.mp3',
    '/audio/first.mp3',
  ]);
  expect(new Set(plays.map(({ player }) => player)).size).toBe(1);
  expect(reportError.mock.calls).toEqual([[blocked]]);
});
