import { test, expect } from '@playwright/test';
for (const width of [320, 375, 768, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('.contact-form')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    if (width === 1440 || width === 375) {
      await page.evaluate(async () => {
        const images = Array.from(document.images);
        images.forEach(image => { image.loading = 'eager'; });
        await Promise.race([
          Promise.all(images.map(image => image.complete ? Promise.resolve() : new Promise<void>(resolve => { image.addEventListener('load', () => resolve(), { once: true }); image.addEventListener('error', () => resolve(), { once: true }); }))),
          new Promise(resolve => setTimeout(resolve, 8000)),
        ]);
      });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(500);
      if (width === 1440) {
        await page.locator('#archive').scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'test-results/archive-desktop.png' });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(300);
      }
      await page.screenshot({ path: `test-results/editorial-${width}.png`, fullPage: true });
      await page.screenshot({ path: `test-results/cover-${width}.png` });
    }
  });
}
test('archive filters, skills, dialog keyboard containment and focus restoration', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.archive-entry:not([hidden]) .project-card')).toHaveCount(7);
  await page.getByRole('button', { name: /^AI & research/ }).click();
  await expect(page.locator('.archive-entry:not([hidden]) .project-card')).toHaveCount(3);
  const opener = page.getByRole('button', { name: 'Read about Marine Biodegradation' });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Marine Biodegradation', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close project details' })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await expect(dialog.getByRole('link', { name: /Visit my GitHub profile/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close project details' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await page.getByRole('button', { name: /^All work/ }).click();
  await expect(page.locator('.archive-entry:not([hidden]) .project-card')).toHaveCount(7);
  await page.locator('.skill-switch').getByRole('button', { name: /Development/ }).click();
  await expect(page.locator('.skills-statement')).toHaveText('Behind the experience, a solid foundation.');
});
test('mobile menu and reduced-motion static featured images', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const menu = page.locator('.menu-toggle');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#main-nav').getByRole('link', { name: 'About', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#work').scrollIntoViewIfNeeded();
  expect(await page.locator('.spread-static-image').first().evaluate(el => getComputedStyle(el).translate)).toBe('none');
});
test('missing configuration reports an error without drafts or fake success', async ({ page }) => {
  let submissions = 0;
  await page.route('https://api.web3forms.com/submit', route => { submissions++; return route.abort(); });
  await page.goto('/');
  await page.getByLabel('Your name').fill('Recruiter');
  await page.getByLabel('Your email').fill('recruiter@example.com');
  await page.getByLabel('What do you have in mind?').fill('A 240-hour internship opportunity.');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.locator('.form-status')).toContainText('Message sending is not configured yet');
  await expect(page.getByRole('link', { name: /Open draft/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sent', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('What do you have in mind?')).toHaveValue('A 240-hour internship opportunity.');
  await page.getByLabel('What do you have in mind?').fill('Updated opportunity details.');
  await expect(page.locator('.form-status')).toHaveText('');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.locator('.form-status')).toContainText('Message sending is not configured yet');
  expect(submissions).toBe(0);
});
test('normal-motion featured images remain static while scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const surface = page.locator('.spread-static-image').first();
  await surface.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const before = await surface.evaluate(el => getComputedStyle(el).translate);
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'instant' }));
  await page.waitForTimeout(150);
  expect(before).toBe('none');
  expect(await surface.evaluate(el => getComputedStyle(el).translate)).toBe(before);
  expect(await surface.locator('img').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});

test('every archive project opens and failed images have visible fallbacks', async ({ page }) => {
  await page.route('https://images.unsplash.com/**', route => route.abort());
  await page.goto('/');
  const openers = page.locator('.archive-grid .card-image');
  for (let index = 0; index < 7; index++) {
    await openers.nth(index).click();
    await expect(page.getByRole('dialog').locator('#dialog-title')).not.toBeEmpty();
    await expect(page.getByRole('dialog').locator('.image-fallback')).toBeVisible();
    await page.getByRole('button', { name: 'Close project details' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(openers.nth(index)).toBeFocused();
  }
});
