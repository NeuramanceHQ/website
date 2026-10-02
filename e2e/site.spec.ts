import { expect, test } from '@playwright/test';

test('home page renders its production styles', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(2, 2, 2)',
  );
  const access = page.getByRole('link', {
    name: 'Request access',
    exact: true,
  });
  await expect(access).toHaveCSS('height', '40px');
});

for (const [width, padding] of [
  [800, '96px'],
  [1100, '128px'],
  [1440, '192px'],
] as const) {
  test(`main padding steps to ${padding} at ${width}px wide`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about');
    await expect(page.locator('main')).toHaveCSS('padding-bottom', padding);
  });
}

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
      page
        .getByRole('heading', {
          name: 'NEURAMANCE® METALTECH CORPORATION',
          level: 1,
          exact: true,
        })
        .first(),
      page.getByRole('heading', {
        name: 'Give your agents hands.',
        level: 2,
        exact: true,
      }),
      page.getByRole('link', { name: 'Request access', exact: true }),
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
  const access = page.getByRole('link', {
    name: 'Request access',
    exact: true,
  });
  await access.scrollIntoViewIfNeeded();
  const box = await access.boundingBox();
  if (box === null) {
    throw new Error('Request access has no bounding box');
  }
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(256);
});

test('Request access links to the Metaltech access email', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: 'Request access', exact: true }),
  ).toHaveAttribute(
    'href',
    'mailto:austin@neuramance.com?subject=Neuramance%20Metaltech%20access',
  );
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
    ['meta[name="theme-color"]', '#020202'],
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
  {
    route: '/about',
    name: 'Play about audio quote',
    path: '/audio/dune2-intro.mp3',
  },
  {
    route: '/about',
    name: 'Play got mail sound',
    path: '/audio/got-mail.mp3',
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

test('switching sounds mid-load raises no page error', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.route('**/audio/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto('/about');
  const secondSound = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/audio/got-mail.mp3',
    { timeout: 10_000 },
  );
  await page
    .getByRole('button', { name: 'Play about audio quote', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Play got mail sound', exact: true })
    .click();
  await secondSound;
  expect(errors).toEqual([]);
});

test('Products menu opens on hover only on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const products = page.getByRole('button', { name: 'Products', exact: true });
  const menu = page.getByRole('menu');
  await expect(products).toBeVisible();
  await expect(menu).toBeHidden();
  await products.hover();
  await expect(menu).toBeVisible();
  await page.mouse.move(374, 811);
  await expect(menu).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(products).toBeHidden();
});

for (const { route, text, level } of [
  {
    route: '/',
    text: 'NEURAMANCE® METALTECH CORPORATION',
    level: 1,
  },
  {
    route: '/about',
    text: 'Software from the future. On its own terms.',
  },
  {
    route: '/waitlist',
    text: 'You are on the waitlist.',
    level: 5,
  },
  {
    route: '/error',
    text: 'Oops, something went wrong. 😭',
  },
]) {
  test(`${route} renders its expected content with status 200`, async ({
    page,
  }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    const content = level
      ? page.getByRole('heading', { name: text, level, exact: true }).first()
      : page.getByText(text, { exact: true });
    await expect(content).toBeVisible();
  });
}
