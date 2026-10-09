import { afterEach, expect, it, vi } from 'vitest';
import { bakeCrossfade, fetchTrack } from './music';

const FADE = 8;
const LENGTH = 32;

function weights(head: number, tail: number) {
  const samples = new Float32Array(LENGTH);
  samples.fill(head, 0, FADE);
  samples.fill(tail, LENGTH - FADE);
  bakeCrossfade(samples, FADE);
  return Array.from(samples.subarray(LENGTH - FADE));
}

it('blends the loop head into the tail at constant combined power', () => {
  const tailWeights = weights(0, 1);
  const headWeights = weights(1, 0);
  expect(tailWeights[0]).toBe(1);
  expect(headWeights[0]).toBe(0);
  for (let index = 0; index < FADE; index++) {
    expect(tailWeights[index] ** 2 + headWeights[index] ** 2).toBeCloseTo(1, 6);
  }
  for (let index = 1; index < FADE; index++) {
    expect(tailWeights[index]).toBeLessThan(tailWeights[index - 1]);
    expect(headWeights[index]).toBeGreaterThan(headWeights[index - 1]);
  }
  expect(headWeights[FADE - 1]).toBeGreaterThan(0.95);
});

it('blends each head sample into the matching tail position', () => {
  const headWeights = weights(1, 0);
  const samples = new Float32Array(LENGTH);
  samples.set(
    Array.from({ length: FADE }, (_, index) => index + 1),
    0,
  );
  bakeCrossfade(samples, FADE);
  for (let index = 1; index < FADE; index++) {
    expect(samples[LENGTH - FADE + index] / headWeights[index]).toBeCloseTo(
      index + 1,
      5,
    );
  }
});

it('leaves everything outside the tail untouched', () => {
  const samples = Float32Array.from({ length: LENGTH }, (_, index) => index);
  bakeCrossfade(samples, FADE);
  for (let index = 0; index < LENGTH - FADE; index++) {
    expect(samples[index]).toBe(index);
  }
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const BROWSER_ABORTS = {
  reason: (signal: AbortSignal): unknown => signal.reason,
  firefox: (): unknown =>
    new DOMException('The operation was aborted.', 'AbortError'),
  chromium: (): unknown => new TypeError('Failed to fetch'),
};

function trickle(
  bytes: number,
  gapMs: number,
  signal: AbortSignal | null | undefined,
  aborted: (signal: AbortSignal) => unknown = BROWSER_ABORTS.reason,
) {
  if (!signal) {
    throw new Error('fetchTrack must pass an abort signal to fetch');
  }
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    start(stream) {
      signal.addEventListener('abort', () => stream.error(aborted(signal)));
    },
    pull(stream) {
      if (sent === bytes) {
        stream.close();
        return undefined;
      }
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          if (signal.aborted) {
            resolve();
            return;
          }
          stream.enqueue(new Uint8Array([sent]));
          sent += 1;
          resolve();
        }, gapMs);
      });
    },
  });
}

it('keeps downloading a slow track for as long as data keeps arriving', async () => {
  vi.useFakeTimers();
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((milliseconds) => {
    const timeout = new AbortController();
    setTimeout(
      () => timeout.abort(new DOMException('Timed out', 'TimeoutError')),
      milliseconds,
    );
    return timeout.signal;
  });
  const fetch = vi.fn(
    (_url: string, init: RequestInit) =>
      new Response(trickle(9, 10_000, init.signal)),
  );
  vi.stubGlobal('fetch', fetch);
  const track = fetchTrack();
  await vi.advanceTimersByTimeAsync(90_000);
  expect([...new Uint8Array(await track)]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it.each(Object.entries(BROWSER_ABORTS))(
  'abandons a download that stops delivering data for 15 seconds, retrying after 1 and 2 seconds, when the browser reports the abort as %s',
  async (_browser, aborted) => {
    vi.useFakeTimers();
    const fetch = vi.fn(
      (_url: string, init: RequestInit) =>
        new Response(trickle(9, 20_000, init.signal, aborted)),
    );
    vi.stubGlobal('fetch', fetch);
    const settled = vi.fn();
    const failure = fetchTrack()
      .finally(settled)
      .catch((error: unknown) => error);
    for (const [milliseconds, signals] of [
      [14_999, [false]],
      [1, [true]],
      [999, [true]],
      [1, [true, false]],
      [14_999, [true, false]],
      [1, [true, true]],
      [1_999, [true, true]],
      [1, [true, true, false]],
      [14_999, [true, true, false]],
    ] as const) {
      await vi.advanceTimersByTimeAsync(milliseconds);
      expect(fetch.mock.calls.map(([, init]) => init.signal?.aborted)).toEqual(
        signals,
      );
      expect(settled).not.toHaveBeenCalled();
    }
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch.mock.calls.map(([, init]) => init.signal?.aborted)).toEqual([
      true,
      true,
      true,
    ]);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(settled).toHaveBeenCalledOnce();
    const error = await failure;
    expect(error).toBeInstanceOf(DOMException);
    expect(error instanceof DOMException && error.name).toBe('TimeoutError');
  },
);
