import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlitchWordmark } from './glitch-wordmark';

vi.mock('react-powerglitch', () => ({ useGlitch: () => ({ ref: () => {} }) }));

const english = 'NEURAMANCE® CYBERSYSTEMS CORPORATION';
const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  if (hiddenDescriptor) {
    Object.defineProperty(document, 'hidden', hiddenDescriptor);
  } else {
    Reflect.deleteProperty(document, 'hidden');
  }
});

describe('GlitchWordmark', () => {
  it('cycles languages on the 2700 ms offset schedule with two English cycles', () => {
    render(<GlitchWordmark />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe(english);

    let elapsed = 0;
    for (const [time, name] of [
      [2700, english],
      [5700, english],
      [8699, english],
      [8700, '神念赛博系统公司'],
      [11699, '神念赛博系统公司'],
      [11700, '神念サイバーシステム株式会社'],
      [14699, '神念サイバーシステム株式会社'],
      [14700, 'न्यूरामैन्स साइबरसिस्टम्स कॉर्पोरेशन'],
      [17699, 'न्यूरामैन्स साइबरसिस्टम्स कॉर्पोरेशन'],
      [17700, 'مؤسسة نيورامانس للأنظمة السيبرانية'],
      [20699, 'مؤسسة نيورامانس للأنظمة السيبرانية'],
      [20700, english],
      [23700, english],
      [26699, english],
      [26700, '神念赛博系统公司'],
    ] as const) {
      act(() => {
        vi.advanceTimersByTime(time - elapsed);
      });
      expect(heading.textContent, `at ${time} ms`).toBe(name);
      elapsed = time;
    }
  });

  it('pauses while the page is hidden and resumes on the next tick', () => {
    render(<GlitchWordmark />);
    const heading = screen.getByRole('heading', { level: 1 });

    act(() => {
      vi.advanceTimersByTime(8700);
    });
    expect(heading.textContent).toBe('神念赛博系统公司');

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(heading.textContent).toBe('神念赛博系统公司');

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(heading.textContent).toBe('神念赛博系统公司');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(heading.textContent).toBe('神念サイバーシステム株式会社');
  });
});
