import { expect, test, type Locator, type Page } from '@playwright/test';

const YOUTUBE =
  /^https:\/\/([a-z0-9-]+\.)*(youtube|youtube-nocookie|ytimg|googlevideo)\.com\//;
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

test.beforeEach(async ({ page }) => {
  await page.route(YOUTUBE, (route) => route.abort());
});

const HEADLINE = 'Your agent sends the CAD file. We ship the metal part.';
const ACCESS_EMAIL = 'mailto:austin@neuramance.com?subject=Neuramance%20access';
const PROMPT =
  'Read https://neuramance.com/llms.txt, then draft an email to austin@neuramance.com requesting Neuramance beta access, describing the physical parts this project needs.';

test('home page renders its production styles', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(5, 5, 6)',
  );
  const copy = page
    .getByRole('main')
    .getByRole('button', { name: 'Copy agent prompt', exact: true })
    .first();
  await expect(copy).toHaveCSS(
    'background-image',
    /, linear-gradient\(rgb\(255, 255, 255\), rgb\(230, 231, 234\)\)$/,
  );
  await expect(copy).toHaveCSS('height', '56px');
  await expect(
    page
      .getByRole('banner')
      .getByRole('link', { name: 'Request access', exact: true }),
  ).toHaveCSS('height', '40px');
});

for (const [width, height] of [
  [320, 568],
  [360, 800],
  [375, 667],
  [390, 844],
  [400, 800],
  [768, 1024],
  [1024, 600],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [844, 390],
  [932, 430],
  [667, 375],
] as const) {
  test(`home page fits ${width}px wide and keeps a ${width < 400 ? 13 : 17}px wordmark and Request access in the sticky header at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(
      page
        .getByRole('banner')
        .getByRole('link', { name: 'Neuramance home', exact: true })
        .locator('svg'),
    ).toHaveCSS('height', width < 400 ? '13px' : '17px');
    const headline = await page
      .getByRole('heading', { name: HEADLINE, level: 1, exact: true })
      .boundingBox();
    if (headline === null) {
      throw new Error('headline has no bounding box');
    }
    expect(headline.y).toBeLessThan(height);

    const access = page
      .getByRole('banner')
      .getByRole('link', { name: 'Request access', exact: true });
    for (const scroll of ['top', 'bottom'] as const) {
      await page.evaluate(
        (to) =>
          window.scrollTo({
            top: to === 'top' ? 0 : document.documentElement.scrollHeight,
            behavior: 'instant',
          }),
        scroll,
      );
      await expect(access).toBeInViewport({ ratio: 1 });
    }
    const accessBox = await access.boundingBox();
    if (accessBox === null) {
      throw new Error('Request access has no bounding box');
    }
    expect(accessBox.x + accessBox.width).toBeLessThanOrEqual(width - 16);
  });
}

for (const [width, height] of [
  [390, 844],
  [1440, 900],
] as const) {
  test(`hero shows Copy agent prompt in the first screen at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(
      page
        .getByRole('main')
        .getByRole('button', { name: 'Copy agent prompt', exact: true })
        .first(),
    ).toBeInViewport({ ratio: 1 });
  });
}

for (const { link, id, items } of [
  {
    link: 'How it works',
    id: 'how-it-works',
    items: ['Send file', 'Get quote', 'Parts ship'],
  },
  {
    link: 'Services',
    id: 'services',
    items: ['CNC machining', 'Sheet metal', 'Laser cutting', 'Finishing'],
  },
]) {
  test(`header ${link} link scrolls its section below the sticky header`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page
      .getByRole('banner')
      .getByRole('link', { name: link, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    const header = await page.getByRole('banner').boundingBox();
    const heading = await page
      .locator(`#${id}`)
      .getByRole('heading', { level: 2 })
      .boundingBox();
    if (header === null || heading === null) {
      throw new Error('header or section heading has no bounding box');
    }
    expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(heading.y).toBeLessThan(900);
    for (const item of items) {
      await expect(
        page.locator(`#${id}`).getByText(item, { exact: true }),
      ).toBeVisible();
    }
  });
}

test('anchor scrolling is smooth unless reduced motion is requested', async ({
  page,
}) => {
  for (const [reducedMotion, behavior] of [
    ['no-preference', 'smooth'],
    ['reduce', 'auto'],
  ] as const) {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', behavior);
  }
});

test('Request access stays reachable at 400% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.goto('/');
  const access = page
    .getByRole('main')
    .getByRole('link', { name: 'Request access', exact: true });
  await access.evaluate((link) =>
    link.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  const box = await access.boundingBox();
  if (box === null) {
    throw new Error('Request access has no bounding box');
  }
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(256);
});

test('Request access links to the Neuramance access email', async ({
  page,
}) => {
  await page.goto('/');
  for (const role of ['banner', 'main', 'contentinfo'] as const) {
    await expect(
      page
        .getByRole(role)
        .getByRole('link', { name: 'Request access', exact: true }),
    ).toHaveAttribute('href', ACCESS_EMAIL);
  }
});

test('the brand is Neuramance without Metaltech', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const home = page
    .getByRole('banner')
    .getByRole('link', { name: 'Neuramance home', exact: true });
  await expect(home).toHaveAttribute('href', '/');
  const footerLockup = page
    .getByRole('contentinfo')
    .locator('img[src="/hand.svg"]')
    .locator('xpath=..');
  for (const lockup of [home, footerLockup]) {
    const wordmark = await lockup
      .locator('svg')
      .evaluate((svg) => svg.getBoundingClientRect().toJSON());
    expect(wordmark.height).toBe(17);
    expect(wordmark.width / wordmark.height).toBeCloseTo(10, 1);
    const hand = await lockup
      .locator('img')
      .evaluate((img) => img.getBoundingClientRect().toJSON());
    expect(hand.height).toBe(26);
    expect(hand.top + hand.bottom).toBe(wordmark.top + wordmark.bottom);
  }
  expect(await page.locator('body').innerText()).not.toMatch(/metaltech/i);
  expect(await page.content()).not.toMatch(/metaltech/i);
});

test('Announcement links to the agent guide and can be dismissed', async ({
  page,
}) => {
  await page.goto('/');
  const announcement = page.getByRole('complementary', {
    name: 'Announcement',
  });
  await expect(
    announcement.getByRole('link', { name: 'Read the agent guide' }),
  ).toHaveAttribute('href', '/llms.txt');
  await announcement
    .getByRole('button', { name: 'Dismiss announcement', exact: true })
    .click();
  await expect(announcement).toHaveCount(0);
});

const marqueeLists = (page: Page) =>
  page
    .getByRole('list', { name: 'At a glance' })
    .locator('xpath=..')
    .locator('> ul');

const translateX = (list: Locator) =>
  list.evaluate(
    (element) => new DOMMatrix(getComputedStyle(element).transform).m41,
  );

test('facts marquee loops two equal copies endlessly and pauses on demand', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const lists = marqueeLists(page);
  await expect(lists).toHaveCount(2);
  const [first, copy] = await lists.evaluateAll((elements) =>
    elements.map((element) => ({
      width: element.getBoundingClientRect().width,
      viewport: element.parentElement?.getBoundingClientRect().width ?? 0,
      animation: getComputedStyle(element).animationName,
      iterations: getComputedStyle(element).animationIterationCount,
    })),
  );
  expect(copy.width).toBeCloseTo(first.width, 1);
  expect(first.width).toBeGreaterThanOrEqual(first.viewport);
  for (const list of [first, copy]) {
    expect(list.animation).not.toBe('none');
    expect(list.iterations).toBe('infinite');
  }

  const before = await translateX(lists.first());
  await page.waitForTimeout(500);
  expect(await translateX(lists.first())).toBeLessThan(before);

  const toggle = page.getByRole('button', {
    name: 'Pause scrolling',
    exact: true,
  });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  for (const list of await lists.all()) {
    await expect(list).toHaveCSS('animation-play-state', 'paused');
  }
  await page.waitForTimeout(200);
  const paused = await translateX(lists.first());
  await page.waitForTimeout(500);
  expect(await translateX(lists.first())).toBeCloseTo(paused, 1);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(lists.first()).toHaveCSS('animation-play-state', 'running');
});

test('facts marquee stands still and scrolls by hand under reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const lists = marqueeLists(page);
  await expect(lists.first()).toHaveCSS('animation-name', 'none');
  await expect(lists.last()).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Pause scrolling', exact: true }),
  ).toBeHidden();
  await expect(lists.first().locator('xpath=..')).toHaveCSS(
    'overflow-x',
    'auto',
  );
});

test('the metal buttons catch the light as the pointer passes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const copy = page
    .getByRole('main')
    .getByRole('button', { name: 'Copy agent prompt', exact: true })
    .first();
  const box = await copy.boundingBox();
  if (box === null) {
    throw new Error('Copy agent prompt has no bounding box');
  }
  const lightAt = async (x: number, y: number) => {
    await page.mouse.move(0, 0);
    await page.mouse.move(x, y);
    return copy.evaluate((element) =>
      element.style.getPropertyValue('--sheen-x'),
    );
  };
  const middle = box.y + box.height / 2;
  await expect.poll(() => lightAt(box.x + box.width / 2, middle)).toBe('50%');
  await expect.poll(() => lightAt(box.x + box.width + 400, middle)).toBe('0%');
});

test('each metal button catches the light once as it comes into view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const glints = (element: Locator) =>
    element.evaluate(
      (metal) =>
        metal
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect
                .getKeyframes()
                .some((keyframe) => '--sheen-x' in keyframe),
          ).length,
    );
  const copies = page
    .getByRole('main')
    .getByRole('button', { name: 'Copy agent prompt', exact: true });
  await expect.poll(() => glints(copies.first())).toBe(1);
  const closing = copies.last();
  expect(await glints(closing)).toBe(0);
  await closing.scrollIntoViewIfNeeded();
  await expect.poll(() => glints(closing)).toBe(1);
});

test('a metal button tilts toward where it is pressed', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const copy = page.getByRole('main').locator('[data-metal]').first();
  await expect(copy).toHaveAccessibleName('Copy agent prompt');
  const box = await copy.boundingBox();
  if (box === null) {
    throw new Error('Copy agent prompt has no bounding box');
  }
  const tilt = () =>
    copy.evaluate((element) => element.style.getPropertyValue('--tilt-x'));
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await expect
    .poll(async () => {
      await page.mouse.down();
      const pressed = Number(await tilt());
      await page.mouse.up();
      return pressed;
    })
    .toBeGreaterThan(0.9);
  expect(await tilt()).toBe('0');
});

test('Copy agent prompt copies the exact prompt and resets within 4 seconds', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const copy = page
    .getByRole('main')
    .getByRole('button', { name: 'Copy agent prompt', exact: true })
    .first();
  const before = await copy.boundingBox();
  await copy.click();
  const copied = page.getByRole('button', { name: 'Copied', exact: true });
  await expect(copied).toBeVisible();
  expect((await copied.boundingBox())?.width).toBe(before?.width);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    PROMPT,
  );
  await expect(copy).toBeVisible({ timeout: 4000 });
});

test('Copy agent prompt shows Copy failed when the clipboard write fails', async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.clipboard.writeText = () =>
      Promise.reject(new Error('Clipboard write failed'));
  });
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Copy agent prompt', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Copy failed', exact: true }),
  ).toBeVisible();
});

test('/llms.txt serves the agent guide and is linked from the home page', async ({
  page,
  request,
}) => {
  const response = await request.get('/llms.txt', { timeout: 10_000 });
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^text\/plain/);
  const body = await response.text();
  expect(body.split(/\r?\n/)[0]).toBe('# Neuramance');
  expect(body).toContain(ACCESS_EMAIL);
  for (const service of [
    'CNC machining',
    'Sheet metal',
    'Laser cutting',
    'Finishing',
  ]) {
    expect(body).toContain(service);
  }
  expect(body).not.toMatch(/metaltech|\/about/i);

  await page.goto('/');
  for (const name of ['Read llms.txt', 'llms.txt']) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute(
      'href',
      '/llms.txt',
    );
  }
});

test('home page publishes Neuramance metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Neuramance® - Metal Parts for AI Agents');
  for (const [selector, content] of [
    ['meta[name="theme-color"]', '#050506'],
    ['meta[property="og:title"]', 'Neuramance® - Metal Parts for AI Agents'],
    ['meta[property="og:site_name"]', 'Neuramance'],
  ] as const) {
    await expect(page.locator(selector)).toHaveAttribute('content', content);
  }
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => JSON.parse(script.innerHTML));
  expect(structuredData).toMatchObject({
    name: 'Neuramance',
    contactPoint: { email: 'austin@neuramance.com' },
  });
});

test('Play audio quote requests /audio/dune1-intro.mp3', async ({ page }) => {
  await page.goto('/');
  const audioRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/audio/dune1-intro.mp3',
    { timeout: 10_000 },
  );
  await page
    .getByRole('button', { name: 'Play audio quote', exact: true })
    .click();
  await audioRequest;
});

test('/about returns status 404', async ({ page }) => {
  const response = await page.goto('/about');
  expect(response?.status()).toBe(404);
});

for (const { route, text } of [
  { route: '/', text: HEADLINE },
  { route: '/waitlist', text: 'You are on the waitlist.' },
  { route: '/error', text: 'Oops, something went wrong. 😭' },
]) {
  test(`${route} renders its expected content with status 200`, async ({
    page,
  }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: text, level: 1, exact: true }),
    ).toBeVisible();
  });
}

const POSTER = 'https://i.ytimg.com/vi_webp/AA3ixfYtq1g/maxresdefault.webp';

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
  await page.route(IFRAME_API, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_IFRAME_API }),
  );
  await page.goto('/');
  await page.waitForFunction('typeof setPlayerState === "function"');
  await expect(page.locator('body > div[aria-hidden]').first()).toHaveCSS(
    'opacity',
    '0.18',
  );
  const player = page.locator('body > div[aria-hidden] > div > div').first();
  await expect(player).toHaveCSS('opacity', '0');
  await page.evaluate('setPlayerState(1)');
  await page.waitForTimeout(3000);
  expect(
    await player.evaluate((element) => getComputedStyle(element).opacity),
  ).toBe('0');
  await expect(player).toHaveCSS('opacity', '1', { timeout: 3000 });
  expect(
    await page.evaluate(
      '({ videoId: fakePlayer.options.videoId, playerVars: fakePlayer.options.playerVars, calls: fakePlayer.calls })',
    ),
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
  await page.evaluate('setPlayerState(2)');
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

test('background video pauses while the tab is hidden and resumes when shown', async ({
  page,
}) => {
  await page.route(IFRAME_API, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_IFRAME_API }),
  );
  await page.goto('/');
  await page.waitForFunction(
    'typeof fakePlayer === "object" && fakePlayer.calls.includes("playVideo")',
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
  expect(await page.evaluate('fakePlayer.calls')).toEqual([
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
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/(youtube|youtube-nocookie|googlevideo)\.com\//.test(request.url())) {
      requests.push(request.url());
    }
  });
  await page.goto('/');
  await page.waitForTimeout(3000);
  expect(requests).toEqual([]);
  await expect(page.locator('body > div[aria-hidden] > div').first()).toHaveCSS(
    'background-image',
    `url("${POSTER}")`,
  );
});
