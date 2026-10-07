import { test, expect } from '@playwright/test';

for (const width of [375, 1366]) {
  test(`active navigation follows native scrolling and toolkit remains usable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const nav = page.locator('#main-nav');
    await expect(nav.locator('[aria-current]')).toHaveCount(0);
    for (const id of ['work', 'about', 'archive', 'contact', 'archive', 'about', 'work']) {
      await page.locator(`#${id}`).evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
      await expect(nav.locator('[aria-current="location"]')).toHaveAttribute('href', `#${id}`);
      await expect(nav.locator('.nav-active-line')).toHaveCount(1);
    }
    await page.locator('#skills').evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
    await expect(nav.locator('[aria-current="location"]')).toHaveAttribute('href', '#about');
    const toolkit = page.locator('#skills');
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
      for (const discipline of ['Design', 'Development']) {
        const button = toolkit.getByRole('button', { name: new RegExp(`^${discipline}`) });
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(toolkit.locator('.skill-groups:not([hidden]) .skill-group').first()).toBeVisible();
      }
      await toolkit.screenshot({ path: testInfo.outputPath(`raised-toolkit-${theme}.png`), style: '.site-header, .skip-link { visibility: hidden !important; }' });
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(nav.locator('[aria-current]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
