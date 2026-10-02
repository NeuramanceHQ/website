import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlitchWordmark } from './glitch-wordmark';

const stopGlitch = vi.fn();
vi.mock('react-powerglitch', () => ({
  useGlitch: () => ({ ref: () => {}, stopGlitch }),
}));

const english = 'NEURAMANCE® METALTECH CORPORATION';
const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');

const reducedMotion = (matches: boolean) => {
  window.matchMedia = (query: string) =>
    ({ matches, media: query }) as MediaQueryList;
};

beforeEach(() => {
  vi.useFakeTimers();
  reducedMotion(false);
});

afterEach(() => {
  cleanup();
  stopGlitch.mockClear();
  vi.useRealTimers();
  if (hiddenDescriptor) {
    Object.defineProperty(document, 'hidden', hiddenDescriptor);
  } else {
    Reflect.deleteProperty(document, 'hidden');
  }
});

describe('GlitchWordmark', () => {
  it('cycles languages on the 2700 ms offset schedule with two English cycles', () => {
    const { container: wordmark } = render(<GlitchWordmark />);
    expect(wordmark.textContent).toBe(english);

    let elapsed = 0;
    for (const [time, name] of [
      [2700, english],
      [5700, english],
      [8699, english],
      [8700, '神念金属科技公司'],
      [11699, '神念金属科技公司'],
      [11700, '神念メタルテック株式会社'],
      [14699, '神念メタルテック株式会社'],
      [14700, 'न्यूरामैन्स मेटलटेक कॉर्पोरेशन'],
      [17699, 'न्यूरामैन्स मेटलटेक कॉर्पोरेशन'],
      [17700, 'مؤسسة نيورامانس للتقنيات المعدنية'],
      [20699, 'مؤسسة نيورامانس للتقنيات المعدنية'],
      [20700, english],
      [23700, english],
      [26699, english],
      [26700, '神念金属科技公司'],
    ] as const) {
      act(() => {
        vi.advanceTimersByTime(time - elapsed);
      });
      expect(wordmark.textContent, `at ${time} ms`).toBe(name);
      elapsed = time;
    }
  });

  it('pauses while the page is hidden and resumes on the next tick', () => {
    const { container: wordmark } = render(<GlitchWordmark />);

    act(() => {
      vi.advanceTimersByTime(8700);
    });
    expect(wordmark.textContent).toBe('神念金属科技公司');

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(wordmark.textContent).toBe('神念金属科技公司');

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(wordmark.textContent).toBe('神念金属科技公司');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(wordmark.textContent).toBe('神念メタルテック株式会社');
  });

  it('holds the English name when reduced motion is requested', () => {
    reducedMotion(true);
    const { container: wordmark } = render(<GlitchWordmark />);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(wordmark.textContent).toBe(english);
    expect(stopGlitch).toHaveBeenCalled();
  });
});
