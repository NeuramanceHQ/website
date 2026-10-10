import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CopyButton } from './copy-button';

const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  if (clipboard === undefined) {
    Reflect.deleteProperty(navigator, 'clipboard');
  } else {
    Object.defineProperty(navigator, 'clipboard', clipboard);
  }
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
  expect(status.textContent).toBe('');

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

it('keeps its name while it shows the outcome, and announces every copy', async () => {
  vi.useFakeTimers();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  render(<CopyButton text="Agent prompt">Copy agent prompt</CopyButton>);
  const status = screen.getByRole('status');

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy agent prompt' }));
  });
  const first = status.firstElementChild;
  expect(first?.textContent).toBe('Copied');
  expect(screen.getByRole('button').textContent).toContain('Copied');

  act(() => {
    vi.advanceTimersByTime(500);
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy agent prompt' }));
  });
  expect(status.firstElementChild?.textContent).toBe('Copied');
  expect(status.firstElementChild).not.toBe(first);
});

it('announces nothing new until a repeated copy has an outcome', async () => {
  vi.stubGlobal('reportError', vi.fn());
  let fail = (_error: Error) => {};
  const writeText = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
    );
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  render(<CopyButton text="Agent prompt">Copy agent prompt</CopyButton>);
  const status = screen.getByRole('status');
  const button = screen.getByRole('button', { name: 'Copy agent prompt' });

  await act(async () => {
    fireEvent.click(button);
  });
  const copied = status.firstElementChild;
  await act(async () => {
    fireEvent.click(button);
  });
  expect(status.firstElementChild).toBe(copied);

  await act(async () => {
    fail(new Error('Clipboard write failed'));
  });
  expect(status.textContent).toBe('Copy failed');
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
