import { expect, test } from '@playwright/test';

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

test('home page renders its production styles', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(5, 5, 6)',
  );
  for (const [role, height] of [
    ['main', '64px'],
    ['banner', '34px'],
  ] as const) {
    const access = page
      .getByRole(role)
      .getByRole('link', { name: 'Request access', exact: true });
    await expect(access).toHaveCSS('height', height);
  }
});

for (const [width, height] of [
  [320, 568],
  [375, 667],
  [390, 844],
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
  test(`home page never scrolls and keeps key content on screen at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const viewport = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        mainOverflow: main ? main.scrollHeight - main.clientHeight : null,
      };
    });
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width);
    expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.height);
    expect(viewport.mainOverflow).toBe(0);

    for (const content of [
      page.getByRole('heading', {
        name: 'Neuramance® Metaltech Corporation',
        level: 1,
        exact: true,
      }),
      page.getByRole('heading', {
        name: 'Your agent sends the CAD file. We ship the metal part.',
        level: 2,
        exact: true,
      }),
      page
        .getByRole('main')
        .getByRole('link', { name: 'Request access', exact: true }),
      page.getByRole('button', { name: 'Copy agent prompt', exact: true }),
    ]) {
      await expect(content).toBeVisible();
      const box = await content.boundingBox();
      if (box === null) {
        throw new Error(`${content.toString()} has no bounding box`);
      }
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  });
}

for (const [width, height] of [
  [1440, 900],
  [1280, 720],
  [1920, 1080],
] as const) {
  test(`main section names the services and how it works at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    for (const text of [
      'CNC machining',
      'Sheet metal',
      'Laser cutting',
      'Finishing',
      'Send file',
      'Get quote',
      'Parts ship',
    ]) {
      const content = page.getByRole('main').getByText(text, { exact: true });
      await expect(content).toBeVisible();
      const box = await content.boundingBox();
      if (box === null) {
        throw new Error(`${content.toString()} has no bounding box`);
      }
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
    }
  });
}

test('Request access stays reachable at 400% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.goto('/');
  const access = page
    .getByRole('main')
    .getByRole('link', { name: 'Request access', exact: true });
  await access.evaluate((link) => link.scrollIntoView({ block: 'center' }));
  const box = await access.boundingBox();
  if (box === null) {
    throw new Error('Request access has no bounding box');
  }
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(256);
});

test('Request access links to the Metaltech access email', async ({ page }) => {
  await page.goto('/');
  for (const role of ['main', 'banner'] as const) {
    await expect(
      page
        .getByRole(role)
        .getByRole('link', { name: 'Request access', exact: true }),
    ).toHaveAttribute(
      'href',
      'mailto:austin@neuramance.com?subject=Neuramance%20Metaltech%20access',
    );
  }
});

test('heading and header logo set NEURAMANCE and METALTECH on one line', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const letters = await page
    .getByRole('heading', {
      name: 'Neuramance® Metaltech Corporation',
      level: 1,
      exact: true,
    })
    .locator('svg > path')
    .evaluateAll((paths) =>
      paths.map((path) => path.getBoundingClientRect().toJSON()),
    );
  expect(letters).toHaveLength('NEURAMANCEMETALTECH'.length);
  const [first] = letters;
  for (const letter of letters) {
    expect(letter.top).toBeCloseTo(first.top, 0);
    expect(letter.bottom).toBeCloseTo(first.bottom, 0);
  }
  expect(letters[10].left - letters[9].right).toBeGreaterThan(
    letters[9].left - letters[8].right,
  );

  const words = await page
    .getByRole('banner')
    .getByRole('link', { name: 'Neuramance Metaltech home', exact: true })
    .locator('svg path')
    .evaluateAll((paths) =>
      paths.map((path) => path.getBoundingClientRect().toJSON()),
    );
  expect(words).toHaveLength(2);
  expect(words[1].left).toBeGreaterThan(words[0].right);
  expect(words[1].top).toBeCloseTo(words[0].top, 0);
  expect(words[1].width).toBeGreaterThan(0);
});

test('header home link points to /', async ({ page }) => {
  await page.goto('/');
  await expect(
    page
      .getByRole('banner')
      .getByRole('link', { name: 'Neuramance Metaltech home', exact: true }),
  ).toHaveAttribute('href', '/');
});

test('Copy agent prompt copies the exact prompt and resets within 4 seconds', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const copy = page.getByRole('button', {
    name: 'Copy agent prompt',
    exact: true,
  });
  await copy.click();
  await expect(
    page.getByRole('button', { name: 'Copied', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'Read https://neuramance.com/llms.txt, then draft an email to austin@neuramance.com requesting Neuramance Metaltech beta access, describing the physical parts this project needs.',
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
    .getByRole('button', { name: 'Copy agent prompt', exact: true })
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
  expect(body.split(/\r?\n/)[0]).toBe('# Neuramance Metaltech Corporation');
  expect(body).toContain('austin@neuramance.com');
  for (const service of [
    'CNC machining',
    'Sheet metal',
    'Laser cutting',
    'Finishing',
  ]) {
    expect(body).toContain(service);
  }
  expect(body).not.toContain('/about');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const guide = page.getByRole('link', {
    name: 'For agents: /llms.txt',
    exact: true,
  });
  await expect(guide).toBeVisible();
  await expect(guide).toHaveAttribute('href', '/llms.txt');
});

test('reduced motion stops the wordmark and access button animations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion });
    if (reducedMotion === 'no-preference') {
      await page.goto('/');
    } else {
      await page.reload();
    }
    for (const content of [
      page.getByRole('heading', {
        name: 'Neuramance® Metaltech Corporation',
        level: 1,
        exact: true,
      }),
      page
        .getByRole('main')
        .getByRole('link', { name: 'Request access', exact: true }),
      page
        .getByRole('banner')
        .getByRole('link', { name: 'Request access', exact: true }),
    ]) {
      await expect(content).toBeVisible();
      const animations = await content.evaluate((element) =>
        [element, ...element.querySelectorAll('*')].flatMap((el) => [
          getComputedStyle(el).animationName,
          getComputedStyle(el, '::after').animationName,
        ]),
      );
      if (reducedMotion === 'no-preference') {
        expect(animations.some((name) => name !== 'none')).toBe(true);
      } else {
        expect(animations.every((name) => name === 'none')).toBe(true);
      }
    }
  }
});

test('home page publishes Metaltech metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(
    'Neuramance® Metaltech - Metal Parts for AI Agents',
  );
  for (const [selector, content] of [
    ['meta[name="theme-color"]', '#050506'],
    [
      'meta[property="og:title"]',
      'Neuramance® Metaltech - Metal Parts for AI Agents',
    ],
  ] as const) {
    await expect(page.locator(selector)).toHaveAttribute('content', content);
  }
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => JSON.parse(script.innerHTML));
  expect(structuredData).toMatchObject({
    name: 'Neuramance Metaltech Corporation',
    contactPoint: { email: 'austin@neuramance.com' },
  });
});

for (const { route, name, path } of [
  {
    route: '/',
    name: 'Play audio quote',
    path: '/audio/dune1-intro.mp3',
  },
]) {
  test(`${name} requests ${path}`, async ({ page }) => {
    await page.goto(route);
    const audioRequest = page.waitForRequest(
      (request) => new URL(request.url()).pathname === path,
      { timeout: 10_000 },
    );
    await page.getByRole('button', { name, exact: true }).click();
    await audioRequest;
  });
}

test('/about returns status 404', async ({ page }) => {
  const response = await page.goto('/about');
  expect(response?.status()).toBe(404);
});

for (const { route, text, level } of [
  {
    route: '/',
    text: 'Neuramance® Metaltech Corporation',
    level: 1,
  },
  {
    route: '/waitlist',
    text: 'You are on the waitlist.',
    level: 1,
  },
  {
    route: '/error',
    text: 'Oops, something went wrong. 😭',
    level: 1,
  },
]) {
  test(`${route} renders its expected content with status 200`, async ({
    page,
  }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    const content = page.getByRole('heading', {
      name: text,
      level,
      exact: true,
    });
    await expect(content).toBeVisible();
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
