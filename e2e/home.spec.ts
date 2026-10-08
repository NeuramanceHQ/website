import { expect, test } from '@playwright/test';
import { ACCESS_EMAIL, blockExternal, HEADLINE } from './helpers';

const PROMPT =
  'Read https://neuramance.com/llms.txt, then draft an email to austin@neuramance.com requesting Neuramance beta access, describing the physical parts this project needs.';

test.beforeEach(blockExternal);

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
    const section = await page.locator(`#${id}`).boundingBox();
    const heading = await page
      .locator(`#${id}`)
      .getByRole('heading', { level: 2 })
      .boundingBox();
    if (header === null || section === null || heading === null) {
      throw new Error('header or section has no bounding box');
    }
    expect(section.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
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

for (const [width, height] of [
  [320, 256],
  [375, 667],
] as const) {
  test(`Request access stays clear of the sticky header when reached by keyboard at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page
      .getByRole('contentinfo')
      .getByRole('link', { name: 'How it works', exact: true })
      .focus();
    await page.keyboard.press('Shift+Tab');
    const access = page
      .getByRole('main')
      .getByRole('link', { name: 'Request access', exact: true });
    await expect(access).toBeFocused();
    await expect(access).toBeInViewport({ ratio: 1 });
    const header = await page.getByRole('banner').boundingBox();
    const box = await access.boundingBox();
    if (header === null || box === null) {
      throw new Error('header or Request access has no bounding box');
    }
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
  });
}

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

test('Copy agent prompt copies the exact prompt and resets within 4 seconds', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const copy = page.getByRole('main').locator('[data-metal]').first();
  await expect(copy).toHaveAccessibleName('Copy agent prompt');
  const before = await copy.boundingBox();
  await copy.click();
  await expect(copy).toHaveAccessibleName('Copied');
  expect((await copy.boundingBox())?.width).toBe(before?.width);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    PROMPT,
  );
  await expect(copy).toHaveAccessibleName('Copy agent prompt', {
    timeout: 4000,
  });
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

test('home page publishes Neuramance metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Neuramance® - Metal Parts for AI Agents');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://neuramance.com',
  );
  for (const [selector, content] of [
    ['meta[name="theme-color"]', '#050506'],
    ['meta[property="og:title"]', 'Neuramance® - Metal Parts for AI Agents'],
    ['meta[property="og:site_name"]', 'Neuramance'],
    ['meta[property="og:url"]', 'https://neuramance.com'],
  ] as const) {
    await expect(page.locator(selector)).toHaveAttribute('content', content);
  }
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => JSON.parse(script.innerHTML));
  expect(structuredData).toMatchObject({
    name: 'Neuramance',
    sameAs: expect.arrayContaining(['https://github.com/NeuramanceHQ']),
    contactPoint: { email: 'austin@neuramance.com' },
  });
});

test('the quote names its button and plays /audio/dune1-intro.mp3', async ({
  page,
}) => {
  await page.goto('/');
  const quote = page.getByRole('contentinfo').getByRole('button', {
    name: "A company's excellence is conveyed in everything it does.",
    exact: true,
  });
  await expect(quote).toHaveAccessibleDescription('Play audio quote');
  const audio = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/audio/dune1-intro.mp3',
    { timeout: 10_000 },
  );
  await quote.click();
  expect([200, 206]).toContain((await audio).status());
});
