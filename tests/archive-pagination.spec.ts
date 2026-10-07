import { test, expect } from '@playwright/test';

for (const width of [375, 1366]) {
  test(`collection fits within one nine-project page and resizes at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const grid = page.locator('.archive-grid');
    const cards = page.locator('.archive-entry:not([hidden])');
    await page.locator('#archive').scrollIntoViewIfNeeded();
    await expect(grid).toHaveAttribute('aria-busy', 'false');
    await expect(cards).toHaveCount(7);
    const fullHeight = (await page.locator('#archive').boundingBox())!.height;
    const pagination = page.getByRole('navigation', { name: 'Project pages' });
    await expect(pagination).toHaveCount(0);
    await page.locator('.archive-filters').getByRole('button', { name: /^UI\/UX/ }).click();
    await expect(cards).toHaveCount(1);
    expect((await page.locator('#archive').boundingBox())!.height).toBeLessThan(fullHeight - 100);
    await expect(pagination).toHaveCount(0);
    await page.locator('.archive-filters').getByRole('button', { name: /^All work/ }).click();
    await expect(cards).toHaveCount(7);
    await expect(grid).toHaveAttribute('aria-busy', 'false');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.locator('#archive').screenshot({ path: testInfo.outputPath('collection.png') });
  });
}



