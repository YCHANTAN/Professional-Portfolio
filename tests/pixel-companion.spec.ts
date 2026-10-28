import { test, expect, type Page } from '@playwright/test';

const character = (page: Page) => page.getByRole('button', { name: 'Christian pixel avatar', exact: true });
const companion = (page: Page) => page.locator('.pixel-companion');

async function drag(page: Page, dx: number, dy: number) {
  const box = (await character(page).boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height * .3 };
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 5 });
  await expect(companion(page)).toHaveAttribute('data-mode', 'drag');
  await page.mouse.up();
  await expect(companion(page)).toHaveAttribute('data-mode', 'watch');
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/');
  await expect(character(page)).toBeVisible();
});

test('starts bottom-right with transparent sprites and remains fixed while scrolling', async ({ page }) => {
  const viewport = page.viewportSize()!;
  const box = (await companion(page).boundingBox())!;
  expect(box.x + box.width).toBeCloseTo(viewport.width - 24, 0);
  expect(box.y + box.height).toBeCloseTo(viewport.height - 24, 0);
  const alpha = await page.locator('.companion-sprite').evaluate((element: HTMLCanvasElement) => {
    const data = element.getContext('2d')!.getImageData(0, 0, 96, 96).data;
    return { corner: data[3], opaque: Array.from(data).filter((value, index) => index % 4 === 3 && value === 255).length };
  });
  expect(alpha.corner).toBe(0);
  expect(alpha.opaque).toBeGreaterThan(800);
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
  expect((await companion(page).boundingBox())!.y).toBeCloseTo(box.y, 0);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.pixel-companion-layer')!).pointerEvents)).toBe('none');
});

test('shirt pickup interrupts, then watches for 20 seconds without cursor movement extending the deadline', async ({ page }) => {
  await drag(page, -260, -220);
  const dropped = (await companion(page).boundingBox())!;
  await page.mouse.move(dropped.x - 80, dropped.y + 30);
  await page.clock.runFor(32);
  await expect(companion(page)).toHaveAttribute('data-frame', '3');
  await page.clock.fastForward(19000);
  await expect(companion(page)).toHaveAttribute('data-mode', 'watch');
  await page.mouse.move(dropped.x + 240, dropped.y + 30);
  await page.clock.runFor(32);
  await expect(companion(page)).toHaveAttribute('data-frame', '4');
  await page.clock.fastForward(1100);
  await expect(companion(page)).toHaveAttribute('data-mode', 'idle');
  expect((await companion(page).boundingBox())!.y).toBeCloseTo(dropped.y, 0);
});

test('a new drop resets watching; sub-threshold movement does not count as dragging', async ({ page }) => {
  const first = (await character(page).boundingBox())!;
  await page.mouse.move(first.x + first.width / 2, first.y + 40);
  await page.mouse.down();
  await page.mouse.move(first.x + first.width / 2 + 3, first.y + 42);
  await page.mouse.up();
  await expect(companion(page)).not.toHaveAttribute('data-mode', 'watch');
  await drag(page, -180, -180);
  await page.clock.fastForward(15000);
  await drag(page, -80, 30);
  await page.clock.fastForward(6000);
  await expect(companion(page)).toHaveAttribute('data-mode', 'watch');
  await page.clock.fastForward(14100);
  await expect(companion(page)).toHaveAttribute('data-mode', 'idle');
});

test('double-click controls support Cancel, Hide, Show and keyboard movement', async ({ page }) => {
  await character(page).dblclick();
  const menu = page.getByRole('dialog', { name: 'Avatar controls' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Hide', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(character(page)).toBeFocused();
  const before = (await companion(page).boundingBox())!;
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await companion(page).boundingBox())!.x).toBeCloseTo(before.x - 10, 0);
  await page.keyboard.press('Shift+ArrowUp');
  await expect.poll(async () => (await companion(page).boundingBox())!.y).toBeCloseTo(before.y - 1, 0);
  await page.keyboard.press('Enter');
  await menu.getByRole('button', { name: 'Cancel' }).click();
  await expect(character(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await menu.getByRole('button', { name: 'Hide', exact: true }).click();
  await expect(character(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Show avatar', exact: true }).click();
  await expect(character(page)).toBeFocused();
  expect((await companion(page).boundingBox())!.x).toBeCloseTo(before.x, 0);
});

test('walking and running retain the drop baseline and stay in the local lane', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .7; });
  await page.reload();
  await expect(character(page)).toBeVisible();
  await page.clock.fastForward(17700);
  await expect(companion(page)).toHaveAttribute('data-mode', 'walk');
  const start = (await companion(page).boundingBox())!;
  const pose = await page.locator('.companion-sprite').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.clock.runFor(170);
  expect(await page.locator('.companion-sprite').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).not.toBe(pose);
  const stepStart = (await companion(page).boundingBox())!;
  await page.clock.runFor(1000);
  const walked = (await companion(page).boundingBox())!;
  expect(stepStart.x - walked.x).toBeGreaterThan(25);
  expect(stepStart.x - walked.x).toBeLessThan(35);
  expect(walked.y).toBeCloseTo(start.y, 0);
  await page.clock.runFor(5000);
  expect((await companion(page).boundingBox())!.x).toBeGreaterThanOrEqual(start.x - 120);

  await page.addInitScript(() => { Math.random = () => .98; });
  await page.reload();
  await expect(character(page)).toBeVisible();
  await page.clock.fastForward(19900);
  await expect(companion(page)).toHaveAttribute('data-mode', 'run');
  const runStart = (await companion(page).boundingBox())!;
  await page.clock.runFor(1000);
  const ran = (await companion(page).boundingBox())!;
  expect(runStart.x - ran.x).toBeGreaterThan(65);
  expect(runStart.x - ran.x).toBeLessThan(75);
  expect(ran.y).toBeCloseTo(runStart.y, 0);
});

test('reduced motion stays stationary, manual placement works, and resizing clamps position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const start = (await companion(page).boundingBox())!;
  await page.clock.fastForward(60000);
  await expect(companion(page)).toHaveAttribute('data-mode', 'idle');
  expect((await companion(page).boundingBox())!.x).toBeCloseTo(start.x, 0);
  await drag(page, -80, -120);
  await page.clock.fastForward(21000);
  await page.setViewportSize({ width: 320, height: 568 });
  const resized = (await companion(page).boundingBox())!;
  expect(resized.width).toBe(120);
  expect(resized.x).toBeGreaterThanOrEqual(24);
  expect(resized.y).toBeGreaterThanOrEqual(24);
  expect(resized.x + resized.width).toBeLessThanOrEqual(296);
  expect(resized.y + resized.height).toBeLessThanOrEqual(544);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('project dialogs suspend the avatar, and expired background gaze does not replay', async ({ page }) => {
  await drag(page, -200, -150);
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('.project-card h3 button')!.click());
  await expect(page.getByRole('dialog', { name: 'Avatar controls' })).toHaveCount(0);
  await expect(page.locator('[data-pixel-companion]')).toHaveAttribute('aria-hidden', 'true');
  await expect(companion(page)).toHaveAttribute('data-mode', 'suspended');
  await page.getByRole('button', { name: 'Close project details' }).click();
  await expect(character(page)).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(21000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(50);
  await expect(companion(page)).toHaveAttribute('data-mode', 'idle');
});

test('autonomous routes stop before crossing a live page control', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .8; });
  await page.reload();
  await expect(character(page)).toBeVisible();
  const initial = (await companion(page).boundingBox())!;
  await page.evaluate(({ x, y }) => {
    const blocker = document.createElement('button');
    blocker.textContent = 'Test page control';
    Object.assign(blocker.style, { position: 'fixed', left: `${x - 70}px`, top: `${y + 20}px`, width: '80px', height: '80px' });
    document.body.append(blocker);
  }, initial);
  await page.clock.fastForward(18500);
  await expect(companion(page)).toHaveAttribute('data-mode', 'idle');
  expect((await companion(page).boundingBox())!.x).toBeCloseTo(initial.x, 0);
});

test('touch pickup, last-touch watching and double-tap controls work on mobile', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/');
  await expect(character(page)).toBeVisible();
  const box = (await character(page).boundingBox())!;
  const client = await context.newCDPSession(page);
  const start = { x: box.x + box.width / 2, y: box.y + 30 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x - 110, y: start.y - 180 }] });
  await expect(companion(page)).toHaveAttribute('data-mode', 'drag');
  const picked = Number(await companion(page).getAttribute('data-frame'));
  expect(picked).toBeGreaterThanOrEqual(24);
  expect(picked).toBeLessThanOrEqual(27);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(companion(page)).toHaveAttribute('data-mode', 'watch');
  await page.clock.fastForward(19000);
  await expect(companion(page)).toHaveAttribute('data-mode', 'watch');
  await page.clock.fastForward(1100);
  await expect(companion(page)).toHaveAttribute('data-mode', 'idle');
  await character(page).tap();
  await character(page).tap();
  await expect(page.getByRole('dialog', { name: 'Avatar controls' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).tap();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await context.close();
});


test('distant cursor tracking spans the viewport and survives stopped event propagation', async ({ page }) => {
  await drag(page, -500, -450);
  const box = (await companion(page).boundingBox())!;
  await page.mouse.move(2, box.y + box.height * .24);
  await expect(companion(page)).toHaveAttribute('data-frame', '3');
  await page.mouse.move(1438, box.y + box.height * .24);
  await expect(companion(page)).toHaveAttribute('data-frame', '4');
  await page.evaluate(() => {
    const control = document.querySelector('button')!;
    control.addEventListener('pointermove', event => event.stopPropagation());
    control.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 2, clientY: 2 }));
  });
  await expect(companion(page)).toHaveAttribute('data-frame', '3');
});

test('longer idles and the transparent cat remain visible; controls hide both companions', async ({ page }) => {
  await expect(page.locator('.companion-cat')).toBeVisible();
  await page.clock.fastForward(11000);
  await expect(companion(page)).toHaveAttribute('data-mode', 'idle');
  const alpha = await page.locator('.cat-sprite').evaluate((canvas: HTMLCanvasElement) => canvas.getContext('2d')!.getImageData(0,0,1,1).data[3]);
  expect(alpha).toBe(0);
  await character(page).dblclick();
  await expect(page.locator('.companion-cat')).toHaveAttribute('data-cat-mode', 'suspended');
  await page.getByRole('button', { name: 'Hide', exact: true }).click();
  await expect(page.locator('.companion-cat')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show avatar', exact: true }).click();
  await expect(page.locator('.companion-cat')).toBeVisible();
});

test('cat circles independently while the human watches and stops for reduced motion', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .9; });
  await page.reload();
  await expect(page.locator('.companion-cat')).toBeVisible();
  await character(page).focus();
  await page.keyboard.press('ArrowLeft');
  await page.clock.runFor(500);
  await page.clock.fastForward(14000);
  await expect(companion(page)).toHaveAttribute('data-mode', 'watch');
  await expect(page.locator('.companion-cat')).toHaveAttribute('data-cat-activity', 'orbit');
  const first = (await page.locator('.companion-cat').boundingBox())!;
  await page.clock.runFor(2000);
  const second = (await page.locator('.companion-cat').boundingBox())!;
  expect(Math.hypot(second.x-first.x,second.y-first.y)).toBeGreaterThan(10);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(50);
  const stopped = (await page.locator('.companion-cat').boundingBox())!;
  await page.clock.fastForward(15000);
  expect((await page.locator('.companion-cat').boundingBox())!.x).toBeCloseTo(stopped.x,0);
});


