import { test, expect } from '@playwright/test';

for (const width of [375, 1440]) {
  test(`featured images and stamps stay static during scroll and hover at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const art = page.locator('.static-project-art');
    await expect(art).toHaveCount(4);
    for (const surface of await art.all()) {
      await surface.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(650);
      await expect(surface).toHaveAttribute('data-image-motion', 'static');
      const measure = () => surface.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return Array.from(el.querySelectorAll('.spread-static-image, .spread-static-image img, .art-stamp, .art-headline')).map(child => {
          const r = child.getBoundingClientRect(), s = getComputedStyle(child);
          return { name: child.className || child.tagName, x: r.x - rect.x, y: r.y - rect.y, width: r.width, height: r.height, transform: s.transform, translate: s.translate, rotate: s.rotate, scale: s.scale };
        });
      });
      const before = await measure();
      expect(before.length).toBeGreaterThanOrEqual(4);
      // Artwork retains its original decorative rotations; only the image must
      // have no transform at all. Stamps/headlines must not change with input.
      for (const child of before.slice(0, 2)) expect([child.transform, child.translate, child.rotate, child.scale]).toEqual(['none', 'none', 'none', 'none']);
      await page.evaluate(() => window.scrollBy({ top: 80, behavior: 'instant' }));
      await surface.hover();
      await page.waitForTimeout(650);
      const after = await measure();
      for (const [index, child] of after.entries()) {
        for (const key of ['x', 'y', 'width', 'height'] as const) expect(child[key], `${child.name} ${key}: ${JSON.stringify({ before: before[index], after: child })}`).toBeCloseTo(before[index][key], 1);
        expect([child.transform, child.translate, child.rotate, child.scale]).toEqual([before[index].transform, before[index].translate, before[index].rotate, before[index].scale]);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/static-art-${width}.png` });
  });
}

test('live preference changes resume and stop motion without losing focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const plane = page.locator('.spread-static-image').first();
  await plane.scrollIntoViewIfNeeded();
  expect(await plane.evaluate(el => getComputedStyle(el).translate)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'instant' }));
  expect(await plane.evaluate(el => getComputedStyle(el).translate)).toBe('none');
  const filter = page.locator('.archive-filters').getByRole('button', { name: /^Development/ });
  await filter.focus();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(filter).toBeFocused();
  expect(await plane.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await filter.click();
  expect(await page.locator('.archive-grid').evaluate(el => getComputedStyle(el.parentElement!).transform)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(filter).toBeFocused();
  await plane.scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  expect(await plane.evaluate(el => getComputedStyle(el).translate)).toBe('none');
});

test('rapid archive requests finish on the latest category without losing keyboard focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('#archive').scrollIntoViewIfNeeded();
  await page.waitForTimeout(750);
  await page.locator('.archive-filters').getByRole('button', { name: /^Development/ }).click();
  const latest = page.locator('.archive-filters').getByRole('button', { name: /^UI\/UX/ });
  await latest.focus();
  await latest.evaluate(button => (button as HTMLButtonElement).click());
  await expect(latest).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.archive-entry:not([hidden]) .project-card')).toHaveCount(1);
  await expect(page.locator('.archive-grid')).toHaveAttribute('aria-busy', 'false');
  await expect(latest).toBeFocused();
  await expect(page.locator('.result-count')).toHaveText('1 projects / UI/UX');
  expect(await page.locator('.archive-entry:not([hidden])').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeCloseTo(0, 0);
});
