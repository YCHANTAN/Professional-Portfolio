import { test, expect } from '@playwright/test';

for (const width of [375, 1440]) {
  test(`sticky header and smooth toolkit switching at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    expect((await page.locator('.site-header').boundingBox())!.y).toBeCloseTo(0, 0);
    const panel = page.locator('.skills-panel');
    const height = (await panel.boundingBox())!.height;
    const development = page.locator('.skill-switch').getByRole('button', { name: /Development/ });
    const design = page.locator('.skill-switch').getByRole('button', { name: /Design/ });
    await expect(page.locator('.skill-switch button').first()).toHaveText(/Development/);
    await expect(page.locator('.skill-switch button').last()).toHaveText(/Design/);
    await expect(development).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.skills-statement')).toHaveText('Behind the experience, a solid foundation.');
    await design.evaluate(async button => { (button as HTMLButtonElement).click(); await new Promise(resolve => requestAnimationFrame(resolve)); });
    await expect(design).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.skills-statement')).toHaveText('Behind the experience, a solid foundation.');
    await expect(page.locator('.skills-statement')).toHaveText('Before the pixels, the people.');
    await page.waitForTimeout(300);
    expect((await panel.boundingBox())!.height).toBeCloseTo(height, 0);
    await development.click();
    await expect(page.locator('.skills-statement')).toHaveText('Behind the experience, a solid foundation.');
    await design.focus();
    await development.evaluate(button => (button as HTMLButtonElement).click());
    await design.evaluate(button => (button as HTMLButtonElement).click());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(design).toBeFocused();
    await expect(page.locator('.skills-statement')).toHaveText('Before the pixels, the people.');
    expect(await panel.evaluate(el => getComputedStyle(el).transform)).toBe('none');
    await expect(page.locator('.skill-active-indicator')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
