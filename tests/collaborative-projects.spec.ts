import { test, expect } from '@playwright/test';

for (const width of [375, 1366]) {
  test(`collaborative projects show supplied details and links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('#archive').scrollIntoViewIfNeeded();
    await expect(page.locator('.archive-entry:not([hidden])')).toHaveCount(9);
    await page.getByRole('button', { name: 'Read about FloodSense', exact: true }).click();
    const floodDialog = page.getByRole('dialog');
    await expect(floodDialog.getByRole('heading', { name: 'My role' })).toBeVisible();
    await expect(floodDialog.getByText('Full-Stack Developer & System Architect', { exact: true })).toBeVisible();
    await expect(floodDialog.getByRole('link')).toHaveCount(0);
    await expect.poll(() => floodDialog.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await floodDialog.getByRole('button', { name: 'Close project details' }).click();
    for (const [name, live, repo] of [
      ['GourMate', 'https://gour-mate.vercel.app/', 'https://github.com/Zycheee/GourMate'],
      ['Lifevent', 'https://phlifevent.vercel.app', 'https://github.com/LifewoodPH/Lifevent'],
    ]) {
      await page.getByRole('button', { name: `Read about ${name}`, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Collaborative project', { exact: true })).toBeVisible();
      await expect(dialog.getByRole('link', { name: /Live demo/ })).toHaveAttribute('href', live);
      await expect(dialog.getByRole('link', { name: /Source code/ })).toHaveAttribute('href', repo);
      const image = dialog.locator('img');
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      if (name === 'GourMate') {
        await expect(dialog.getByText(/Erica Gin Echavez · Christian Osorno · Christian Kyle Ducay/)).toBeVisible();
        await expect(dialog.getByRole('heading', { name: /My contribution|My role/i })).toHaveCount(0);
      } else {
        await expect(dialog.getByRole('heading', { name: 'My contribution' })).toBeVisible();
        await expect(dialog.getByText(/production automatic scheduling has not been verified/)).toHaveCount(1);
        await expect(dialog.getByRole('link', { name: /Implementation branch/ })).toHaveAttribute('href', 'https://github.com/LifewoodPH/Lifevent/tree/testing');
      }
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await dialog.getByRole('button', { name: 'Close project details' }).click();
    }
  });
}
