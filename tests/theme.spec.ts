import { test, expect } from '@playwright/test';

test('theme follows the system until an explicit choice, and remembers that choice on reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const root = page.locator('html');
  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(root).toHaveAttribute('data-theme', 'light');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'dark' });
  await toggle.click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
});

test('theme switch works when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

for (const width of [320, 1101, 1366, 1920]) {
  test(`dark editorial surfaces and mobile navigation work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
    const box = (await toggle.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await expect(toggle).toHaveText('');
    if (width > 1100) {
      const location = (await page.locator('.header-location').boundingBox())!;
      const nav = (await page.locator('#main-nav').boundingBox())!;
      expect(location.x + location.width / 2).toBeCloseTo(width / 2, 0);
      expect(location.x + location.width).toBeLessThan(nav.x);
      expect(box.x).toBeGreaterThan(nav.x + nav.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath('dark-cover.png') });
    if (width === 320) {
      await page.getByRole('button', { name: 'Menu +' }).click();
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
      await page.getByRole('link', { name: 'Let’s talk ↗', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Menu +' })).toHaveAttribute('aria-expanded', 'false');
    }
    await page.getByLabel('Your name').fill('Alex');
    await page.getByLabel('Your email').fill('alex@example.com');
    await page.getByLabel('What do you have in mind?').fill('A new idea.');
    await page.getByRole('button', { name: 'Send Message', exact: true }).click();
    await expect(page.locator('.form-status')).toContainText('not configured');
    await page.locator('.contact-form').screenshot({ path: testInfo.outputPath('dark-contact.png'), style: '.site-header, .skip-link { visibility: hidden !important; }' });
    await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByLabel('What do you have in mind?')).toHaveValue('A new idea.');
  });
}
