import { expect, test } from '@playwright/test';

test('StyleX CSS is compiled into the production build', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(2, 2, 2)',
  );
  const contact = page.getByRole('link', {
    name: 'Contact Neuramance',
    exact: true,
  });
  await expect(contact).toHaveCSS('border-top-color', 'rgb(47, 51, 54)');
  await expect(contact).toHaveCSS('height', '26px');
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
    for (const route of ['/', '/about']) {
      await page.goto(route);
      await expect(page.locator('main')).toHaveCSS('padding-bottom', padding);
    }
  });
}

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
  await page.getByRole('button', { name: 'Play about audio quote' }).click();
  await page.getByRole('button', { name: 'Play got mail sound' }).click();
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
    text: 'NEURAMANCE® CYBERSYSTEMS CORPORATION',
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
