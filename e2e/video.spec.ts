import { expect, test, type Page } from '@playwright/test';
import { blockExternal, untilHydrated } from './helpers';

const IFRAME_API = 'https://www.youtube.com/iframe_api';
const FAKE_IFRAME_API = `
window.YT = {
  Player: class {
    constructor(element, options) {
      window.fakePlayer = { options, calls: [] };
      element.replaceWith(document.createElement('iframe'));
      window.setPlayerState = (data) =>
        options.events.onStateChange({ target: this, data });
      setTimeout(() => options.events.onReady({ target: this }));
    }
    mute() { window.fakePlayer.calls.push('mute'); }
    pauseVideo() { window.fakePlayer.calls.push('pauseVideo'); }
    playVideo() { window.fakePlayer.calls.push('playVideo'); }
    unloadModule(name) { window.fakePlayer.calls.push('unloadModule:' + name); }
    destroy() {}
  },
};
window.onYouTubeIframeAPIReady();
`;

declare global {
  interface Window {
    setPlayerState?: (data: number) => void;
    fakePlayer?: {
      options: { videoId: string; playerVars: Record<string, unknown> };
      calls: string[];
    };
  }
}

const playerReady = (page: Page) =>
  page.waitForFunction(() => typeof window.setPlayerState === 'function');

const setPlayerState = (page: Page, data: number) =>
  page.evaluate((state) => window.setPlayerState?.(state), data);

const playerCalls = (page: Page) =>
  page.evaluate(() => window.fakePlayer?.calls);

const POSTER = 'https://i.ytimg.com/vi_webp/AA3ixfYtq1g/maxresdefault.webp';

test.beforeEach(blockExternal);

test('background video shows its still frame from the first render and loads the player without blocking rendering', async ({
  page,
}) => {
  await page.route(IFRAME_API, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_IFRAME_API }),
  );
  await page.goto('/');
  await expect(
    page.locator(`link[rel="preload"][as="image"][href="${POSTER}"]`),
  ).toHaveCount(1);
  await expect(page.locator('body > div[aria-hidden] > div').first()).toHaveCSS(
    'background-image',
    `url("${POSTER}")`,
  );
  await page.waitForFunction(
    (url) => performance.getEntriesByName(url).length > 0,
    IFRAME_API,
  );
  expect(
    await page.evaluate(
      (url) =>
        (
          performance.getEntriesByName(url)[0].toJSON() as {
            renderBlockingStatus: string;
          }
        ).renderBlockingStatus,
      IFRAME_API,
    ),
  ).toBe('non-blocking');
});

test('background video reveals 3.5 s after playback starts, muted and without captions, and hides when playback stops', async ({
  page,
}) => {
  await page.clock.install({ time: 0 });
  await page.route(IFRAME_API, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_IFRAME_API }),
  );
  await page.goto('/');
  await playerReady(page);
  await page.clock.pauseAt(60_000);
  await expect(page.locator('body > div[aria-hidden]').first()).toHaveCSS(
    'opacity',
    '0.18',
  );
  const player = page.locator('body > div[aria-hidden] > div > div').first();
  await expect(player).toHaveCSS('opacity', '0');
  await setPlayerState(page, 1);
  await page.clock.runFor(3499);
  expect(
    await player.evaluate((element) => ({
      opacity: getComputedStyle(element).opacity,
      fading: element.getAnimations().length,
    })),
  ).toEqual({ opacity: '0', fading: 0 });
  await page.clock.runFor(1);
  await expect(player).toHaveCSS('opacity', '1');
  expect(
    await page.evaluate(() => ({
      videoId: window.fakePlayer?.options.videoId,
      playerVars: window.fakePlayer?.options.playerVars,
      calls: window.fakePlayer?.calls,
    })),
  ).toEqual({
    videoId: 'AA3ixfYtq1g',
    playerVars: expect.objectContaining({
      autoplay: 1,
      mute: 1,
      controls: 0,
      loop: 1,
      playlist: 'AA3ixfYtq1g',
      playsinline: 1,
    }),
    calls: ['mute', 'playVideo', 'unloadModule:captions'],
  });
  await setPlayerState(page, 2);
  await expect(player).toHaveCSS('opacity', '0', { timeout: 2000 });
});

for (const [width, height] of [
  [1440, 900],
  [390, 844],
  [844, 390],
] as const) {
  test(`background video's 4:3 picture covers the ${width}x${height} viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const frame = await page
      .locator('body > div[aria-hidden] > div')
      .first()
      .boundingBox();
    if (frame === null) {
      throw new Error('background frame has no bounding box');
    }
    expect(frame.width / frame.height).toBeCloseTo(16 / 9, 2);
    expect(frame.x + frame.width / 8).toBeLessThanOrEqual(0);
    expect(frame.x + (frame.width * 7) / 8).toBeGreaterThanOrEqual(width);
    expect(frame.y).toBeLessThanOrEqual(0);
    expect(frame.y + frame.height).toBeGreaterThanOrEqual(height);
  });
}

test('keyboard focus skips the background video player', async ({ page }) => {
  await page.route(IFRAME_API, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_IFRAME_API }),
  );
  await page.goto('/');
  await playerReady(page);
  await expect(page.locator('body > div[aria-hidden] iframe')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(
    page
      .getByRole('complementary', { name: 'Announcement' })
      .getByRole('link', { name: 'Read the agent guide' }),
  ).toBeFocused();
});

test('background video shows its still frame without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  try {
    const page = await context.newPage();
    await blockExternal({ page, baseURL });
    await page.goto('/');
    await expect(
      page.locator('body > div[aria-hidden] > div').first(),
    ).toHaveCSS('background-image', `url("${POSTER}")`);
  } finally {
    await context.close();
  }
});

test('background video pauses while the tab is hidden and resumes when shown', async ({
  page,
}) => {
  await page.route(IFRAME_API, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_IFRAME_API }),
  );
  await page.goto('/');
  await page.waitForFunction(
    () => window.fakePlayer?.calls.includes('playVideo') === true,
  );
  for (const hidden of [true, false]) {
    await page.evaluate((value) => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => value,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  }
  expect(await playerCalls(page)).toEqual([
    'mute',
    'playVideo',
    'pauseVideo',
    'playVideo',
  ]);
});

test('reduced motion shows the still frame and loads no video player', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await untilHydrated(page);
  await expect(page.locator('script[src*="youtube.com"], iframe')).toHaveCount(
    0,
  );
  await expect(page.locator('body > div[aria-hidden] > div').first()).toHaveCSS(
    'background-image',
    `url("${POSTER}")`,
  );
});
