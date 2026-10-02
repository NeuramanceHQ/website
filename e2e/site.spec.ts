import { expect, test } from '@playwright/test';

test('home page renders its production styles', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(5, 5, 6)',
  );
  for (const [role, height] of [
    ['main', '40px'],
    ['banner', '28px'],
  ] as const) {
    const access = page
      .getByRole(role)
      .getByRole('link', { name: 'Request access ↗', exact: true });
    await expect(access).toHaveCSS('height', height);
  }
});

for (const [width, height] of [
  [320, 568],
  [375, 667],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [844, 390],
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
        name: 'Give your agents hands.',
        level: 2,
        exact: true,
      }),
      page
        .getByRole('main')
        .getByRole('link', { name: 'Request access ↗', exact: true }),
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

test('Request access stays reachable at 400% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.goto('/');
  const access = page
    .getByRole('main')
    .getByRole('link', { name: 'Request access ↗', exact: true });
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
        .getByRole('link', { name: 'Request access ↗', exact: true }),
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

test('header clock is visible at 1440x900 and hidden at 390x844', async ({
  page,
}) => {
  await page.goto('/');
  const clock = page
    .getByRole('banner')
    .getByText(/^\d{2}:\d{2}:\d{2} C[DS]T$/);
  for (const { width, height, visible } of [
    { width: 1440, height: 900, visible: true },
    { width: 390, height: 844, visible: false },
  ]) {
    await page.setViewportSize({ width, height });
    if (visible) {
      await expect(clock).toBeVisible({ timeout: 10_000 });
    } else {
      await expect(clock).toBeHidden();
    }
  }
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

for (const { width, height, visible } of [
  { width: 1440, height: 900, visible: true },
  { width: 390, height: 844, visible: false },
]) {
  test(`example agent session is ${visible ? 'visible' : 'hidden'} at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const session = page.getByText('neuramance.quote(bracket.step × 40)', {
      exact: true,
    });
    if (visible) {
      await expect(session).toBeVisible();
    } else {
      await expect(session).toBeHidden();
    }
  });
}

test('reduced motion disables the caption and every figure animation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const heading = page.getByRole('heading', {
    name: 'Give your agents hands.',
    level: 2,
    exact: true,
  });
  const caption = page.locator('figcaption').filter({ has: heading });
  await expect(caption).not.toHaveCSS('animation-name', 'none');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(caption).toHaveCSS('animation-name', 'none');
  const figure = page.getByRole('figure').filter({ has: heading });
  await expect(figure).toBeVisible();
  for (const element of await figure.locator('*').all()) {
    await expect(element).toHaveCSS('animation-name', 'none');
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
      'Neuramance® Metaltech - Give Your Agents Hands',
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
