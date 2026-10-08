import { expect, test } from '@playwright/test';
import { ACCESS_EMAIL, blockExternal, HEADLINE } from './helpers';

test.beforeEach(blockExternal);

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

test('the server sends security headers and caches only hashed assets for good', async ({
  page,
  request,
}) => {
  const security = {
    'strict-transport-security': 'max-age=63072000',
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy':
      'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    'content-security-policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.youtube.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://i.ytimg.com",
      "font-src 'self'",
      "connect-src 'self' https://media.neuramance.com",
      "media-src 'self'",
      'frame-src https://www.youtube.com',
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; '),
  };
  const assets: string[] = [];
  page.on('response', (response) => {
    if (new URL(response.url()).pathname.startsWith('/_next/static/')) {
      assets.push(response.url());
    }
  });
  await page.goto('/');
  const [asset] = assets;
  if (asset === undefined) {
    throw new Error('The home page loaded no hashed assets');
  }
  for (const [path, cache] of [
    ['/', 'public, max-age=0, must-revalidate'],
    ['/about', 'public, max-age=0, must-revalidate'],
    ['/_next/static/chunks/missing.js', 'public, max-age=0, must-revalidate'],
    [new URL(asset).pathname, 'public, max-age=31536000, immutable'],
  ] as const) {
    const response = await request.get(path);
    expect(response.headers()).toMatchObject({
      ...security,
      'cache-control': cache,
    });
  }
});

test('trailing slashes and the www host redirect to the canonical URL', async ({
  request,
}) => {
  const slash = await request.get('/waitlist/?ref=x', { maxRedirects: 0 });
  expect(slash.status()).toBe(308);
  expect(slash.headers()['location']).toBe('/waitlist?ref=x');

  const www = await request.get('/waitlist?ref=x', {
    headers: { host: `www.neuramance.com:${new URL(slash.url()).port}` },
    maxRedirects: 0,
  });
  expect(www.status()).toBe(301);
  expect(www.headers()['location']).toBe(
    'https://neuramance.com/waitlist?ref=x',
  );

  const { origin } = new URL(slash.url());
  for (const path of [
    '/%5Cexample.org/',
    '/%09/example.org/',
    '//example.org/',
  ]) {
    const response = await request.get(origin + path, { maxRedirects: 0 });
    const location = response.headers()['location'] ?? '/';
    expect(new URL(location, origin).origin).toBe(origin);
  }
});

test('robots.txt allows crawling and names the sitemap, which lists the home page', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toBe(
    'User-agent: *\nAllow: /\n\nSitemap: https://neuramance.com/sitemap.xml\n',
  );
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toMatch(/xml/);
  expect(
    [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, location]) => location,
    ),
  ).toEqual(['https://neuramance.com/']);
});

test('the structured data logo is a square image of at least 112 pixels', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const { logo } = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => JSON.parse(script.innerHTML) as { logo: string });
  expect(logo).toBe('https://neuramance.com/logo.svg');
  const response = await request.get(new URL(logo).pathname);
  expect(response.headers()['content-type']).toMatch(/^image\/svg\+xml/);
  await page.setContent(await response.text());
  const size = await page
    .locator('svg')
    .evaluate((svg) => svg.getBoundingClientRect().toJSON());
  expect(size.width).toBe(size.height);
  expect(size.width).toBeGreaterThanOrEqual(112);
});

test('/about returns status 404 with the branded not-found page', async ({
  page,
}) => {
  const response = await page.goto('/about');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found | Neuramance®');
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  expect(
    await page
      .locator('meta[name="robots"]')
      .evaluateAll((tags) => tags.map((tag) => tag.getAttribute('content'))),
  ).toEqual(expect.arrayContaining(['noindex']));
  expect(
    await page
      .locator('meta[name="robots"]')
      .evaluateAll((tags) =>
        tags.filter((tag) => tag.getAttribute('content') !== 'noindex'),
      ),
  ).toEqual([]);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(5, 5, 6)',
  );
  await expect(
    page.getByRole('heading', {
      name: 'This page could not be found.',
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .getByRole('link', { name: 'Back to the home page', exact: true }),
  ).toHaveAttribute('href', '/');
  await expect(
    page.getByRole('navigation', { name: 'Primary' }),
  ).toBeAttached();
  await expect(page.getByRole('contentinfo')).toBeVisible();
});

for (const { route, title } of [
  { route: '/waitlist', title: 'Waitlist | Neuramance®' },
  { route: '/error', title: 'Error | Neuramance®' },
]) {
  test(`${route} has its own title and stays out of search results`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `https://neuramance.com${route}`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      title,
    );
  });
}

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
