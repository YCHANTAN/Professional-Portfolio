import { test, expect } from '@playwright/test';

test('original résumé download serves a real PDF and triggers a native download', async ({ page, request }) => {
  const response = await request.get('/Christian-Osorno-Resume.pdf');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const bytes = await response.body();
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(10000);
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Download résumé (PDF)', exact: true });
  await expect(page.locator('.hero-actions .download-resume')).toHaveCount(0);
  const downloaded = page.waitForEvent('download');
  await link.click();
  expect((await downloaded).suggestedFilename()).toBe('Christian-Osorno-Resume.pdf');
});

test('social icons are accessible and mobile targets are easy to tap', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const socials = page.getByRole('navigation', { name: 'Find Christian online' });
  await expect(socials.getByRole('link')).toHaveCount(6);
  for (const name of ['GitHub', 'LinkedIn', 'Instagram', 'Facebook']) {
    const link = socials.getByRole('link', { name: `Christian Osorno on ${name}` });
    await expect(link.locator('svg')).toBeVisible();
    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await expect(socials.getByRole('link', { name: 'Email Christian Osorno' })).toHaveAttribute('href', 'mailto:christianosorno20@gmail.com');
});

test('archive exits before replacing cards and maintains its measured height', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('#archive').scrollIntoViewIfNeeded();
  await expect(page.locator('.archive-grid')).toHaveAttribute('aria-busy', 'false');
  const initialHeight = (await page.locator('.archive-grid').boundingBox())!.height;
  const category = page.locator('.archive-filters').getByRole('button', { name: /^UI\/UX/ });
  await category.evaluate(async button => {
    (button as HTMLButtonElement).click();
    await new Promise(resolve => requestAnimationFrame(resolve));
  });
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.archive-entry:not([hidden])').count()).toBe(7);
  await expect(page.locator('.archive-entry:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.archive-grid')).toHaveAttribute('aria-busy', 'false');
  expect((await page.locator('.archive-grid').boundingBox())!.height).toBeCloseTo(initialHeight, 0);
  await page.locator('.archive-filters').getByRole('button', { name: /^All work/ }).click();
  await expect(page.locator('.archive-entry:not([hidden])')).toHaveCount(7);
  await expect(page.locator('.archive-grid')).toHaveAttribute('aria-busy', 'false');
});

test('editorial contact fields retain clear keyboard focus and readable input', async ({ page }) => {
  await page.goto('/');
  const name = page.getByLabel('Your name');
  await name.scrollIntoViewIfNeeded();
  await name.focus();
  await page.waitForTimeout(250);
  expect(await name.evaluate(el => getComputedStyle(el).outlineColor)).toBe('rgb(36, 69, 237)');
  expect(await name.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
  await name.fill('Recruiter');
  await expect(name).toHaveValue('Recruiter');
});

test('selected Toolkit tabs have a full black background', async ({ page }) => {
  await page.goto('/');
  const tabs = page.locator('.skill-switch');
  await tabs.scrollIntoViewIfNeeded();
  expect(await tabs.evaluate(el => getComputedStyle(el).padding)).toBe('0px');
  for (const name of [/Design/, /Development/]) {
    const tab = tabs.getByRole('button', { name });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => tab.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(23, 23, 20)');
    expect(await tab.evaluate(el => getComputedStyle(el).overflow)).toBe('hidden');
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/toolkit-solid-tab.png' });
});

test('editorial Send Message is easy to tap and spans the writing area', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Send Message', exact: true });
  await button.scrollIntoViewIfNeeded();
  const box = (await button.boundingBox())!;
  expect(box.width).toBeGreaterThan(200);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: 'test-results/editorial-send-button.png' });
});

for (const width of [320, 375, 768, 1280, 1366, 1440, 1920]) {
  test(`contact composition reflows and supports the simplified form at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const form = page.locator('.contact-form');
    await form.scrollIntoViewIfNeeded();
    await expect(form.getByRole('radio')).toHaveCount(0);
    await page.getByLabel('Your email').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('What do you have in mind?')).toBeFocused();
    await page.getByLabel('What do you have in mind?').fill('A thoughtful project begins here.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const box = (await form.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    const info = (await page.locator('.contact-info').boundingBox())!;
    expect(info.y + info.height).toBeLessThan(box.y);
    if (width >= 1024) {
      expect(box.width).toBeGreaterThan(box.height);
      const heading = (await form.locator('.inquiry-heading').boundingBox())!;
      const fields = (await form.locator('.inquiry-fields').boundingBox())!;
      expect(fields.x).toBeGreaterThan(heading.x + heading.width);
    }
    const screenshotStyle = '.site-header, .skip-link { visibility: hidden !important; }';
    await form.screenshot({ path: testInfo.outputPath(`inquiry-card-${width}.png`), style: screenshotStyle });
    await page.locator('.contact-layout').screenshot({ path: testInfo.outputPath(`contact-composition-${width}.png`), style: screenshotStyle });
  });
}
