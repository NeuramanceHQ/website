import { expect, type Page } from '@playwright/test';
import { test, untilHydrated } from './helpers';

declare global {
  interface Window {
    musicContexts: AudioContext[];
    musicLoops: { loop: boolean; loopStart: number; loopEnd: number }[];
    musicDecoded: number;
    musicSamples: number[][];
    musicTimeouts: number[];
    interruptMusic: () => Promise<void>;
    interruptMusicLikeSafari: () => Promise<void>;
    musicFetches: number;
  }
}

const MUSIC_TRACK = '**/audio/ill-watch-you-burn-us.*.m4a';
const SAMPLE_TIMES = [1, 5.5, 6.5, 7, 8, 9, 9.5];

const musicWav = (seconds: number) => {
  const rate = 8000;
  const bytes = rate * seconds * 4;
  const wav = Buffer.alloc(44 + bytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + bytes, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(bytes, 40);
  for (let frame = 0; frame < rate * seconds; frame++) {
    wav.writeInt16LE(frame < rate * 5 ? 8192 : -4096, 44 + frame * 4);
    wav.writeInt16LE(frame < rate * 5 ? -4096 : 16384, 46 + frame * 4);
  }
  return wav;
};

const serveMusic = async (page: Page, statuses: number[] = []) => {
  const requests: string[] = [];
  await page.route(MUSIC_TRACK, (route) => {
    requests.push(route.request().url());
    const status = statuses.shift();
    return status === undefined
      ? route.fulfill({ contentType: 'audio/wav', body: musicWav(10) })
      : route.fulfill({ status });
  });
  return requests;
};

const observeMusic = (page: Page) =>
  page.addInitScript((times) => {
    window.musicContexts = [];
    window.musicLoops = [];
    window.musicDecoded = 0;
    window.musicSamples = [];
    window.AudioContext = class extends AudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.musicContexts.push(this);
      }
      override async decodeAudioData(data: ArrayBuffer) {
        const buffer = await super.decodeAudioData(data);
        window.musicDecoded += 1;
        return buffer;
      }
      override createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = (...args: Parameters<typeof start>) => {
          const buffer = source.buffer;
          if (buffer === null) {
            throw new Error('Music started without a buffer');
          }
          window.musicSamples = Array.from(
            { length: buffer.numberOfChannels },
            (_, channel) =>
              times.map(
                (time) =>
                  buffer.getChannelData(channel)[
                    Math.round(time * buffer.sampleRate)
                  ],
              ),
          );
          window.musicLoops.push({
            loop: source.loop,
            loopStart: source.loopStart,
            loopEnd: source.loopEnd,
          });
          start(...args);
        };
        return source;
      }
    };
  }, SAMPLE_TIMES);

const blockAutoplay = async (page: Page) => {
  await observeMusic(page);
  await page.addInitScript(() => {
    let gestured = false;
    for (const type of ['pointerdown', 'keydown']) {
      addEventListener(
        type,
        (event) => {
          gestured ||= event.isTrusted;
        },
        { capture: true },
      );
    }
    window.interruptMusic = async () => {
      gestured = false;
      await window.musicContexts.at(-1)?.suspend();
    };
    let interrupted = false;
    window.interruptMusicLikeSafari = async () => {
      interrupted = true;
      await window.interruptMusic();
    };
    window.AudioContext = class extends AudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        void super.suspend();
      }
      override get state(): AudioContextState {
        return interrupted ? 'interrupted' : super.state;
      }
      override resume() {
        if (!gestured) {
          return Promise.resolve();
        }
        interrupted = false;
        return super.resume();
      }
    };
  });
};

const clockRetries = async (page: Page) => {
  await countMusicFetches(page);
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(0);
  await page.addInitScript(() => {
    window.musicTimeouts = [];
    window.setTimeout = new Proxy(window.setTimeout, {
      apply(schedule, receiver, args) {
        window.musicTimeouts.push(Number(args[1] ?? 0));
        return Reflect.apply(schedule, receiver, args);
      },
    });
  });
};

const retryAfter = async (
  page: Page,
  delay: number,
  requests: string[],
  attempts: number,
) => {
  await expect
    .poll(() => page.evaluate(() => window.musicTimeouts))
    .toContain(delay);
  await page.clock.runFor(delay - 1);
  expect(await page.evaluate(() => window.musicFetches)).toBe(attempts);
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'true');
  await page.clock.runFor(1);
  await expect.poll(() => requests.length).toBe(attempts + 1);
};

const countMusicFetches = (page: Page) =>
  page.addInitScript((track) => {
    window.musicFetches = 0;
    const fetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes(track)) {
        window.musicFetches += 1;
      }
      return fetch(input, init);
    };
  }, 'ill-watch-you-burn-us');

const musicFetches = async (page: Page) => {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  return page.evaluate(() => window.musicFetches);
};

const musicToggle = (page: Page) =>
  page
    .getByRole('banner')
    .getByRole('button', { name: 'Background music', exact: true });

const loops = (page: Page) => page.evaluate(() => window.musicLoops);

const audioState = (page: Page) =>
  page.evaluate(() => window.musicContexts.at(-1)?.state);

test('background music autoplays without a gesture when the browser allows it', async ({
  page,
}) => {
  await observeMusic(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await serveMusic(page);
  await page.goto('/');
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => loops(page))
    .toEqual([{ loop: true, loopStart: 4, loopEnd: expect.closeTo(10, 3) }]);
  expect(await audioState(page)).toBe('running');
});

test('background music decodes before a gesture and loops its crossfaded buffer from 4 seconds', async ({
  page,
}) => {
  await blockAutoplay(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await serveMusic(page);
  await page.goto('/');
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => requests.length).toBe(1);
  await expect.poll(() => page.evaluate(() => window.musicDecoded)).toBe(1);
  expect(
    await page.evaluate(() => {
      const [navigation] = performance.getEntriesByType('navigation');
      const track = performance
        .getEntriesByType('resource')
        .find((entry) => entry.name.includes('ill-watch-you-burn-us'));
      return (
        navigation instanceof PerformanceNavigationTiming &&
        track !== undefined &&
        track.startTime >= navigation.loadEventStart
      );
    }),
  ).toBe(true);
  expect(await loops(page)).toEqual([]);

  await page.getByRole('heading', { level: 1 }).click();
  await expect
    .poll(() => loops(page))
    .toEqual([{ loop: true, loopStart: 4, loopEnd: expect.closeTo(10, 3) }]);
  expect(await audioState(page)).toBe('running');
  const expected = [
    [0.25, -0.125],
    [-0.125, 0.5],
  ].map(([head, tail]) =>
    SAMPLE_TIMES.map((time) => {
      if (time < 5) {
        return expect.closeTo(head, 4);
      }
      if (time < 6) {
        return expect.closeTo(tail, 4);
      }
      const progress = (time - 6) / 4;
      return expect.closeTo(
        tail * Math.cos((progress * Math.PI) / 2) +
          head * Math.sin((progress * Math.PI) / 2),
        4,
      );
    }),
  );
  expect(await page.evaluate(() => window.musicSamples)).toEqual(expected);
});

test('the speaker starts blocked background music instead of muting it', async ({
  page,
}) => {
  await blockAutoplay(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await serveMusic(page);
  await page.goto('/');
  await expect.poll(() => requests.length).toBe(1);
  await musicToggle(page).click();
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => loops(page)).toHaveLength(1);
});

test('the speaker starts background music pressed before the page finishes loading', async ({
  page,
}) => {
  await blockAutoplay(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await serveMusic(page);
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/held-image.png', async (route) => {
    await held;
    await route.fulfill({ status: 404 });
  });
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const image = document.createElement('img');
      image.hidden = true;
      image.src = '/held-image.png';
      document.body.append(image);
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await untilHydrated(page);
  expect(await page.evaluate(() => document.readyState)).not.toBe('complete');

  await musicToggle(page).click();
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => loops(page)).toHaveLength(1);
  release();
});

test('a tap anywhere resumes background music the browser interrupted', async ({
  page,
}) => {
  await blockAutoplay(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await serveMusic(page);
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1 });
  await heading.click();
  await expect.poll(() => audioState(page)).toBe('running');
  await page.evaluate(() => window.interruptMusic());
  await expect.poll(() => audioState(page)).toBe('suspended');

  await heading.click();
  await expect.poll(() => audioState(page)).toBe('running');
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'true');
});

test('the speaker resumes background music Safari interrupted instead of muting it', async ({
  page,
}) => {
  await blockAutoplay(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await serveMusic(page);
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).click();
  await expect.poll(() => audioState(page)).toBe('running');
  await page.evaluate(() => window.interruptMusicLikeSafari());
  await expect.poll(() => audioState(page)).toBe('interrupted');

  await musicToggle(page).click();
  await expect.poll(() => audioState(page)).toBe('running');
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'true');
});

test('muting background music suspends its audio and survives a reload', async ({
  page,
}) => {
  await blockAutoplay(page);
  await countMusicFetches(page);
  await page.clock.install({ time: 0 });
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await serveMusic(page);
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).click();
  await expect.poll(() => loops(page)).toHaveLength(1);
  await page.clock.pauseAt(60_000);
  await musicToggle(page).click();
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'false');
  await page.clock.runFor(799);
  expect(await audioState(page)).toBe('running');
  await page.clock.runFor(1);
  await expect.poll(() => audioState(page)).toBe('suspended');
  await page.clock.resume();
  await page.reload({ waitUntil: 'load' });
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'false');
  expect(await musicFetches(page)).toBe(0);
  expect(requests).toHaveLength(1);
});

test('background music retries a server error and recovers from a failed load when turned back on', async ({
  page,
}) => {
  await blockAutoplay(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const statuses = [503, 404];
  await clockRetries(page);
  const requests = await serveMusic(page, statuses);
  await page.goto('/');
  await retryAfter(page, 1000, requests, 1);
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'false');
  expect(requests).toHaveLength(2);

  await musicToggle(page).click();
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => requests.length).toBe(3);
  await expect.poll(() => loops(page)).toHaveLength(1);
});

test('background music gives up after three failed attempts', async ({
  page,
}) => {
  await blockAutoplay(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await clockRetries(page);
  const requests = await serveMusic(page, [503, 503, 503]);
  await page.goto('/');
  await retryAfter(page, 1000, requests, 1);
  await retryAfter(page, 2000, requests, 2);
  await expect(musicToggle(page)).toHaveAttribute('aria-pressed', 'false', {
    timeout: 10_000,
  });
  expect(requests).toHaveLength(3);
});

test('background music stays off where the header has no room for its control', async ({
  page,
}) => {
  await countMusicFetches(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'load' });
  await expect(musicToggle(page)).toBeHidden();
  await untilHydrated(page);
  expect(await musicFetches(page)).toBe(0);
});
