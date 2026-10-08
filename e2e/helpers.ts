import { expect, type Page } from '@playwright/test';

export const blockExternal = async ({
  page,
  baseURL,
}: {
  page: Page;
  baseURL: string | undefined;
}) => {
  if (baseURL === undefined) {
    throw new Error('playwright.config.ts must set use.baseURL');
  }
  const { origin } = new URL(baseURL);
  await page.route(
    (url) => url.origin !== origin,
    (route) => route.abort(),
  );
};

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
