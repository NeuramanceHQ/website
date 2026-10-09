import { expect, test, type Locator, type Page } from '@playwright/test';
import { blockExternal, untilHydrated } from './helpers';

const FOCUS_RING =
  /rgb\(5, 5, 6\) 0px 0px 0px 2px, rgb\(245, 245, 242\) 0px 0px 0px 4px/;

const twoFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );

const countGlints = (page: Page) =>
  page.addInitScript(() => {
    HTMLElement.prototype.animate = function (keyframes, options) {
      if (JSON.stringify(keyframes).includes('--sheen-x')) {
        this.dataset.glints = String(Number(this.dataset.glints ?? '0') + 1);
      }
      return Element.prototype.animate.call(this, keyframes, options);
    };
  });

const offCentre = async (light: () => Promise<string>) =>
  Math.abs(Number.parseFloat(await light()) - 50);

const glints = (metal: Locator) =>
  metal.evaluate((element) =>
    element instanceof HTMLElement ? (element.dataset.glints ?? '0') : '',
  );

test.beforeEach(blockExternal);

test('the metal buttons catch the light as the pointer passes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await untilHydrated(page);
  const copy = page.getByRole('main').locator('[data-metal]').first();
  await expect(copy).toHaveAccessibleName('Copy agent prompt');
  const box = await copy.boundingBox();
  if (box === null) {
    throw new Error('Copy agent prompt has no bounding box');
  }
  const light = () =>
    copy.evaluate((element) => element.style.getPropertyValue('--sheen-x'));
  const lightAt = async (x: number, y: number) => {
    await page.mouse.move(0, 0);
    await page.mouse.move(x, y);
    return light();
  };
  const middle = box.y + box.height / 2;
  await expect
    .poll(() => offCentre(() => lightAt(box.x + box.width / 2, middle)))
    .toBeLessThan(0.5);
  await page.mouse.move(box.x + box.width / 4, middle);
  await expect
    .poll(async () => Number.parseFloat(await light()))
    .toBeGreaterThan(50);
  await page.mouse.move(box.x + (box.width * 3) / 4, middle);
  await expect
    .poll(async () => Number.parseFloat(await light()))
    .toBeLessThan(50);
  await page.mouse.move(box.x + box.width + 400, middle);
  await twoFrames(page);
  expect(await light()).toBe('0%');

  await expect
    .poll(() => offCentre(() => lightAt(box.x + box.width / 2, middle)))
    .toBeLessThan(0.5);
  await page.mouse.move(box.x + box.width / 4, box.y + box.height + 200);
  await twoFrames(page);
  expect(await light()).toBe('100%');
});

test('each metal button catches the light once as it comes into view', async ({
  page,
}) => {
  await countGlints(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const metals = page.getByRole('main').locator('[data-metal]');
  const [hero, closing] = [metals.first(), metals.last()];
  await expect.poll(() => glints(hero)).toBe('1');
  expect(await glints(closing)).toBe('0');
  await closing.scrollIntoViewIfNeeded();
  await expect.poll(() => glints(closing)).toBe('1');

  await hero.scrollIntoViewIfNeeded();
  await twoFrames(page);
  await closing.scrollIntoViewIfNeeded();
  await twoFrames(page);
  expect([await glints(hero), await glints(closing)]).toEqual(['1', '1']);
});

test('a header key lit before a client-side navigation parks once the pointer leaves', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/waitlist');
  const banner = page.getByRole('banner');
  const access = banner.getByRole('link', {
    name: 'Request access',
    exact: true,
  });
  const box = await access.boundingBox();
  if (box === null) {
    throw new Error('Request access has no bounding box');
  }
  const light = () =>
    access.evaluate((element) => element.style.getPropertyValue('--sheen-x'));
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(() => offCentre(light)).toBeLessThan(0.5);

  await banner.getByRole('link', { name: 'Neuramance home' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('main').getByRole('button', { name: 'Copy agent prompt' }),
  ).toHaveCount(3);
  await twoFrames(page);
  await page.mouse.move(box.x - 600, box.y + 400);
  await expect.poll(light).toBe('100%');
});

test('a metal button tilts toward where it is pressed', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await untilHydrated(page);
  const copy = page.getByRole('main').locator('[data-metal]').first();
  await expect(copy).toHaveAccessibleName('Copy agent prompt');
  const box = await copy.boundingBox();
  if (box === null) {
    throw new Error('Copy agent prompt has no bounding box');
  }
  const tilt = () =>
    copy.evaluate((element) =>
      ['--tilt-x', '--tilt-y'].map((axis) =>
        Number.parseFloat(element.style.getPropertyValue(axis)),
      ),
    );
  for (const [x, y, axis, direction] of [
    [0.05, 0.5, 0, -1],
    [0.95, 0.5, 0, 1],
    [0.5, 0.05, 1, -1],
    [0.5, 0.95, 1, 1],
  ] as const) {
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
    await page.mouse.down();
    const pressed = await tilt();
    expect(pressed.every(Number.isFinite)).toBe(true);
    expect(Math.sign(pressed[axis])).toBe(direction);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    expect(await tilt()).toEqual([0, 0]);
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down({ button: 'right' });
  expect(await tilt()).toEqual([0, 0]);
  await page.mouse.up({ button: 'right' });
  await page.mouse.down();
  await expect(copy).toHaveCSS(
    'background-image',
    /, linear-gradient\(rgb\(230, 231, 234\), rgb\(244, 245, 246\)\)$/,
  );
  await page.mouse.up();
});

test('a press held on the very edge of a metal key still activates it', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await untilHydrated(page);
  const copy = page.getByRole('main').locator('[data-metal]').first();
  const box = await copy.boundingBox();
  if (box === null) {
    throw new Error('Copy agent prompt has no bounding box');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + 1, { delay: 200 });
  await expect(copy.locator('xpath=following-sibling::output[1]')).toHaveText(
    'Copied',
  );
});

test('focused buttons keep their focus ring above their edges while hovered', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const banner = page.getByRole('banner');
  const before = banner.getByRole('link', { name: 'For agents', exact: true });
  const music = banner.getByRole('button', {
    name: 'Background music',
    exact: true,
  });
  const access = banner.getByRole('link', {
    name: 'Request access',
    exact: true,
  });
  for (const [previous, control] of [
    [before, music],
    [music, access],
  ] as const) {
    await control.hover();
    await previous.focus();
    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();
    await expect(control).toHaveCSS(
      'box-shadow',
      new RegExp(`^${FOCUS_RING.source}`),
    );
  }
});

test('every control the keyboard reaches shows the focus ring', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const focused = () =>
    page.evaluate(() =>
      document.activeElement === document.body
        ? undefined
        : document.activeElement?.outerHTML,
    );
  const visited: (string | undefined)[] = [];
  while (visited.length < 40) {
    await page.keyboard.press('Tab');
    const control = await focused();
    if (
      control === undefined ||
      control === visited[0] ||
      control === visited.at(-1)
    ) {
      break;
    }
    visited.push(control);
    await expect(page.locator(':focus')).toHaveCSS('box-shadow', FOCUS_RING);
  }
  expect(visited.length).toBeGreaterThanOrEqual(20);
  expect(visited.length).toBeLessThan(40);
});

test('reduced motion keeps the metal buttons still', async ({ page }) => {
  await countGlints(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await untilHydrated(page);
  const copy = page.getByRole('main').locator('[data-metal]').first();
  const box = await copy.boundingBox();
  if (box === null) {
    throw new Error('Copy agent prompt has no bounding box');
  }
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await page.mouse.down();
  await twoFrames(page);
  const still = await copy.evaluate((element) => ({
    light: element.style.getPropertyValue('--sheen-x'),
    tilt: element.style.getPropertyValue('--tilt-x'),
  }));
  await page.mouse.up();
  expect({ ...still, glints: await glints(copy) }).toEqual({
    light: '',
    tilt: '',
    glints: '0',
  });
});
