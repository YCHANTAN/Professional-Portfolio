import { test, expect } from '@playwright/test';

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`desktop cover fits ${viewport.width}x${viewport.height} (${reducedMotion})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    if (reducedMotion === 'no-preference') await page.waitForTimeout(600);
    const header = (await page.locator('.site-header').boundingBox())!;
    const strip = (await page.locator('.discipline-strip').boundingBox())!;
    expect(header.height).toBe(60);
    expect(strip.y).toBeCloseTo(viewport.height, 0);
    for (const selector of ['.hero-meta', '.hero h1', '.hero-intro', '.portrait-card', '.collage-code', '.collage-sticker', '.collage-note', '.internship-note']) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.y, selector).toBeGreaterThanOrEqual(header.height);
      expect(box.y + box.height, selector).toBeLessThanOrEqual(strip.y + 1);
      expect(box.x, selector).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, selector).toBeLessThanOrEqual(viewport.width + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.evaluate(() => window.scrollBy(0, 120));
    expect((await page.locator('.discipline-strip').boundingBox())!.y).toBeLessThan(viewport.height);
    expect((await page.locator('.site-header').boundingBox())!.y).toBe(0);
  });
}
}

for (const width of [375, 768, 1100]) {
  test(`desktop cover overrides leave ${width}px layout unchanged`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const geometry = () => page.evaluate(() =>
      ['.site-header', '.hero', '.hero h1', '.hero-bottom', '.hero-intro', '.hero-collage', '.discipline-strip'].map(selector => {
        const rect = document.querySelector(selector)!.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }));
    const before = await geometry();
    await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        if (sheet.href && new URL(sheet.href).origin !== location.origin) continue;
        for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
          const rule = sheet.cssRules[index];
          if (rule instanceof CSSMediaRule && rule.conditionText === '(min-width: 1101px)') sheet.deleteRule(index);
        }
      }
    });
    expect(await geometry()).toEqual(before);
  });
}
