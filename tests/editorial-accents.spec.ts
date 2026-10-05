import { test, expect } from '@playwright/test';

test('editorial text stays accessible and finishes with readable canonical content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const intro = page.locator('[data-motion="hero-intro-blur"]');
  await expect(intro.locator('.motion-sr-only')).toHaveText('A little instinct. A lot of intention.');
  await expect(intro.locator('[aria-hidden="true"] br')).toHaveCount(1);
  const code = page.locator('[data-motion="curiosity-code"]');
  await expect(code).toHaveAttribute('aria-hidden', 'true');
  await expect(code).toHaveText('curiosity: Infinity');
  await expect.poll(() => intro.locator('.blur-intro-word').last().evaluate(el => getComputedStyle(el).filter)).toMatch(/^(none|blur\(0px\))$/);
});

test('magnetic arrow moves while the native link stays stationary and returns on leave', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.waitForTimeout(700);
  const link = page.locator('.magnetic-explore');
  const arrow = page.locator('[data-motion="explore-arrow"]');
  const bounds = (await link.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width - 12, bounds.y + 12);
  await expect.poll(() => arrow.evaluate(el => getComputedStyle(el).transform)).not.toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  const moved = (await link.boundingBox())!;
  expect(moved.x).toBeCloseTo(bounds.x, 1);
  expect(moved.y).toBeCloseTo(bounds.y, 1);
  await link.focus();
  await expect(link).toBeFocused();
  await page.mouse.move(1, 1);
  await expect.poll(() => arrow.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)).toBeCloseTo(0, 1);
});

test('reduced motion cancels text and magnetic accents without losing focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const link = page.locator('.magnetic-explore');
  await link.focus();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(link).toBeFocused();
  await expect(page.locator('[data-motion="curiosity-code"]')).toHaveText('curiosity: Infinity');
  expect(await page.locator('.blur-intro-word').evaluateAll(words => words.every(word => getComputedStyle(word).filter === 'none' && getComputedStyle(word).opacity === '1'))).toBe(true);
  const bounds = (await link.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width - 10, bounds.y + 10);
  await expect.poll(() => page.locator('[data-motion="explore-arrow"]').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});
