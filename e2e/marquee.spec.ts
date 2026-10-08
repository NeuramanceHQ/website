import { expect, test, type Locator, type Page } from '@playwright/test';
import { blockExternal } from './helpers';

const marqueeLists = (page: Page) =>
  page
    .getByRole('list', { name: 'At a glance' })
    .locator('xpath=..')
    .locator('> ul');

const translateX = (list: Locator) =>
  list.evaluate(
    (element) => new DOMMatrix(getComputedStyle(element).transform).m41,
  );

test.beforeEach(blockExternal);

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
  await expect.poll(() => translateX(lists.first())).toBeLessThan(before);

  const toggle = page.getByRole('button', {
    name: 'Pause scrolling',
    exact: true,
  });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  for (const list of await lists.all()) {
    await expect(list).toHaveCSS('animation-play-state', 'paused');
  }

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
