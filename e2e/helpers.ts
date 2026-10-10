import {
  expect,
  test as base,
  type ConsoleMessage,
  type Page,
} from '@playwright/test';

export const test = base.extend<{ networkAndCspGuard: void }>({
  networkAndCspGuard: [
    async ({ page, baseURL }, use) => {
      if (baseURL === undefined) {
        throw new Error('Playwright must set use.baseURL');
      }
      const { origin } = new URL(baseURL);
      await page.route(
        (url) => url.origin !== origin,
        (route) => route.abort(),
      );
      const violations: string[] = [];
      const recordViolation = (message: ConsoleMessage) => {
        if (
          message.type() === 'error' &&
          /Content[- ]Security[- ]Policy/.test(message.text())
        ) {
          violations.push(`${message.location().url}: ${message.text()}`);
        }
      };
      page.on('console', recordViolation);
      await use();
      page.off('console', recordViolation);
      expect(
        violations,
        `Content Security Policy violations:\n${violations.join('\n')}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export const HEADLINE =
  'Your agent sends the CAD file. We ship the metal part.';
export const ACCESS_EMAIL =
  'mailto:austin@neuramance.com?subject=Neuramance%20access';

export const untilHydrated = async (page: Page) => {
  const announcement = page.getByRole('complementary', {
    name: 'Announcement',
  });
  await announcement
    .getByRole('button', { name: 'Dismiss announcement', exact: true })
    .click();
  await expect(announcement).toHaveCount(0);
};
