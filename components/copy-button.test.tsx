import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CopyButton } from './copy-button';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('mounts an empty status before copying', () => {
  render(<CopyButton text="Agent prompt">Copy agent prompt</CopyButton>);

  expect(screen.getByRole('status').textContent).toBe('');
});

it('copies the exact text and clears its status after two seconds', async () => {
  vi.useFakeTimers();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  render(<CopyButton text="Agent prompt">Copy agent prompt</CopyButton>);
  const status = screen.getByRole('status');

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy agent prompt' }));
  });

  expect(writeText).toHaveBeenCalledWith('Agent prompt');
  expect(screen.getByRole('status')).toBe(status);
  expect(status.textContent).toBe('Copied');

  act(() => {
    vi.advanceTimersByTime(1999);
  });
  expect(status.textContent).toBe('Copied');

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(screen.getByRole('status')).toBe(status);
  expect(status.textContent).toBe('');
});

it('restarts the two seconds when copied again', async () => {
  vi.useFakeTimers();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  render(<CopyButton text="Agent prompt">Copy agent prompt</CopyButton>);
  const button = screen.getByRole('button', { name: 'Copy agent prompt' });
  const status = screen.getByRole('status');

  await act(async () => {
    fireEvent.click(button);
  });
  act(() => {
    vi.advanceTimersByTime(1500);
  });
  await act(async () => {
    fireEvent.click(button);
  });
  act(() => {
    vi.advanceTimersByTime(1999);
  });
  expect(status.textContent).toBe('Copied');

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(status.textContent).toBe('');
});

it('announces and reports a clipboard failure', async () => {
  vi.useFakeTimers();
  const error = new Error('Clipboard write failed');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockRejectedValue(error) },
  });
  vi.stubGlobal('reportError', vi.fn());
  render(<CopyButton text="Agent prompt">Copy agent prompt</CopyButton>);

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy agent prompt' }));
  });

  expect(screen.getByRole('status').textContent).toBe('Copy failed');
  expect(reportError).toHaveBeenCalledWith(error);
});

it('keeps the button label outside live regions', () => {
  render(<CopyButton text="Agent prompt">Copy agent prompt</CopyButton>);
  const button = screen.getByRole('button', { name: 'Copy agent prompt' });

  const liveRegion = '[aria-live], [role="status"], output';

  expect(button.closest(liveRegion)).toBeNull();
  expect(button.querySelector(liveRegion)).toBeNull();
});
