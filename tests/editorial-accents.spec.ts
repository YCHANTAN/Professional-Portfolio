import { test, expect } from '@playwright/test';

test('hero quote and capability cards stay absent', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('[data-motion="hero-intro-blur"]')).toHaveCount(0);
  await expect(page.getByText('A little instinct.', { exact: false })).toHaveCount(0);
  await expect(page.locator('.header-location')).toContainText('Looking for work');
  await expect(page.locator('.hero-capability')).toHaveCount(0);
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
  expect(await page.locator('.blur-intro-word').evaluateAll(words => words.every(word => getComputedStyle(word).filter === 'none' && getComputedStyle(word).opacity === '1'))).toBe(true);
  const bounds = (await link.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width - 10, bounds.y + 10);
  await expect.poll(() => page.locator('[data-motion="explore-arrow"]').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});
