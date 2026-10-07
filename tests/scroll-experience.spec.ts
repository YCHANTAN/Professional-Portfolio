import { test, expect, type Locator, type Page } from '@playwright/test';

const scale = (surface: Locator) => surface.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11);
const scrollTo = async (page: Page, y: number) => {
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
};
const documentTop = (surface: Locator) => surface.evaluate(el => el.getBoundingClientRect().top + scrollY);

// Sample actual presentation frames. Unwrap marquee repeats so crossing its seam
// is not mistaken for a direction change; do not depend on its exact speed.
async function travel(track: Locator, duration = 350) {
  return track.evaluate(async (el, duration) => {
    const width = el.querySelector('.marquee-unit')!.getBoundingClientRect().width;
    const x = () => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
    let previous = x(), distance = 0;
    const start = performance.now();
    while (performance.now() - start < duration) {
      await new Promise(requestAnimationFrame);
      const next = x();
      let delta = next - previous;
      if (delta > width / 2) delta -= width;
      if (delta < -width / 2) delta += width;
      distance += delta;
      previous = next;
    }
    return distance;
  }, duration);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('marquee moves automatically, pauses by keyboard, and reverses with native scroll', async ({ page }) => {
  const marquee = page.locator('[data-motion="discipline-marquee"]');
  const track = marquee.locator('.marquee-track');
  const button = page.getByRole('button', { name: /^Think it\. Design it\./ });
  await expect(button).toHaveAttribute('data-motion', 'discipline-marquee');
  await expect(marquee.locator('button')).toHaveCount(0);
  const top = await documentTop(marquee);
  await scrollTo(page, top - 600);
  await expect(marquee).toHaveAttribute('data-static', 'false');
  await expect.poll(() => travel(track)).toBeLessThan(-2);
  await button.focus();
  await page.keyboard.press('Space');
  await expect(marquee).toHaveAttribute('data-paused', 'true');
  await expect(button).toHaveAccessibleName(/Paused\. Press Space or Enter to resume\./);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(Math.abs(await travel(track))).toBeLessThan(.1);
  await page.evaluate(() => window.scrollBy({ top: 100, behavior: 'instant' }));
  expect(Math.abs(await travel(track))).toBeLessThan(.1);
  await page.keyboard.press('Enter');
  await expect(marquee).toHaveAttribute('data-paused', 'false');
  await expect(button).toHaveAccessibleName(/Hold to pause\. Press Space or Enter to pause\./);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await scrollTo(page, top - 400);
  await expect.poll(() => travel(track)).toBeLessThan(-2);
  await scrollTo(page, top - 700);
  await expect.poll(() => travel(track)).toBeGreaterThan(2);
});

test('pointer hold freezes text and captured release outside resumes without a visible Pause button', async ({ page }, testInfo) => {
  const marquee = page.locator('[data-motion="discipline-marquee"]');
  const track = marquee.locator('.marquee-track');
  await scrollTo(page, (await documentTop(marquee)) - 400);
  await expect(marquee.locator('button')).toHaveCount(0);
  await expect.poll(async () => Math.abs(await travel(track))).toBeGreaterThan(2);
  const box = (await marquee.boundingBox())!;
  await marquee.evaluate(el => el.addEventListener('pointerdown', event => el.setAttribute('data-test-pointer', String((event as PointerEvent).pointerId)), { once: true }));
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(marquee).toHaveAttribute('data-paused', 'true');
  expect(Math.abs(await travel(track))).toBeLessThan(.1);
  await marquee.screenshot({ path: testInfo.outputPath('moving-strip-held.png') });
  await page.mouse.move(10, box.y + box.height + 100);
  expect(await marquee.evaluate(el => el.hasPointerCapture(Number(el.getAttribute('data-test-pointer'))))).toBe(true);
  expect(Math.abs(await travel(track))).toBeLessThan(.1);
  await page.mouse.up();
  await expect(marquee).toHaveAttribute('data-paused', 'false');
  await expect.poll(async () => Math.abs(await travel(track))).toBeGreaterThan(2);
  // A pointer release must not undo a persistent keyboard pause.
  await marquee.focus();
  await page.keyboard.press('Space');
  await marquee.click();
  await expect(marquee).toHaveAttribute('data-paused', 'true');
  expect(Math.abs(await travel(track))).toBeLessThan(.1);
  await page.keyboard.press('Enter');
  await expect.poll(async () => Math.abs(await travel(track))).toBeGreaterThan(2);
});

test('real touch pointer hold, release and cancellation resume motion', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Trusted touch injection requires Chromium CDP');
  await page.setViewportSize({ width: 375, height: 900 });
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  const marquee = page.locator('[data-motion="discipline-marquee"]');
  const track = marquee.locator('.marquee-track');
  await scrollTo(page, (await documentTop(marquee)) - 350);
  await marquee.evaluate(el => {
    for (const type of ['pointerdown', 'pointerup', 'pointercancel']) el.addEventListener(type, event => {
      const pointer = event as PointerEvent;
      el.setAttribute(`data-test-${type}`, `${pointer.pointerType}:${pointer.isTrusted}`);
      if (type === 'pointerdown') el.setAttribute('data-test-pointer', String(pointer.pointerId));
    });
  });
  const box = (await marquee.boundingBox())!;
  for (const ending of ['touchEnd', 'touchCancel'] as const) {
    await expect.poll(async () => Math.abs(await travel(track))).toBeGreaterThan(2);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: box.y + box.height / 2, id: 1 }] });
    await expect(marquee).toHaveAttribute('data-test-pointerdown', 'touch:true');
    await expect(marquee).toHaveAttribute('data-paused', 'true');
    expect(Math.abs(await travel(track))).toBeLessThan(.1);
    expect(await marquee.evaluate(el => el.hasPointerCapture(Number(el.getAttribute('data-test-pointer'))))).toBe(true);
    await session.send('Input.dispatchTouchEvent', { type: ending, touchPoints: [] });
    await expect(marquee).toHaveAttribute(ending === 'touchEnd' ? 'data-test-pointerup' : 'data-test-pointercancel', 'touch:true');
    await expect(marquee).toHaveAttribute('data-paused', 'false');
    await expect.poll(async () => Math.abs(await travel(track))).toBeGreaterThan(2);
  }
  await session.detach();
});

test('AT detail-zero activation persistently toggles pause independently of pointer hold', async ({ page }) => {
  const marquee = page.locator('[data-motion="discipline-marquee"]');
  const track = marquee.locator('.marquee-track');
  await scrollTo(page, (await documentTop(marquee)) - 400);
  await marquee.dispatchEvent('click', { detail: 0 });
  await expect(marquee).toHaveAttribute('aria-pressed', 'true');
  expect(Math.abs(await travel(track))).toBeLessThan(.1);
  await marquee.click();
  await expect(marquee).toHaveAttribute('data-paused', 'true');
  await marquee.dispatchEvent('click', { detail: 0 });
  await expect(marquee).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => Math.abs(await travel(track))).toBeGreaterThan(2);
});

test('each repeat contains all four phrases and a visible trailing seam separator between last and first', async ({ page }, testInfo) => {
  const marquee = page.locator('[data-motion="discipline-marquee"]');
  await scrollTo(page, (await documentTop(marquee)) - 400);
  await expect.poll(() => marquee.locator('.marquee-seam-star').first().evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.left > 30 && r.right < innerWidth - 30;
  })).toBe(true);
  await marquee.focus();
  await page.keyboard.press('Space');
  for (const unit of await marquee.locator('.marquee-unit').all()) {
    await expect(unit.locator('.marquee-word')).toHaveText(['THINK IT.', 'DESIGN IT.', 'BUILD IT.', 'MAKE IT MATTER.']);
    await expect(unit.locator('.marquee-star')).toHaveCount(3);
    await expect(unit.locator('.marquee-seam-star')).toHaveText('✳');
  }
  const seam = await marquee.evaluate(el => {
    const units = el.querySelectorAll('.marquee-unit');
    const last = units[0].querySelector('.marquee-word:last-of-type')!.getBoundingClientRect();
    const star = units[0].querySelector('.marquee-seam-star')!;
    const r = star.getBoundingClientRect();
    const first = units[1].querySelector('.marquee-word')!.getBoundingClientRect();
    return { lastRight: last.right, starLeft: r.left, starRight: r.right, firstLeft: first.left, width: r.width, position: getComputedStyle(star).position };
  });
  expect(seam.position, 'separator does not redistribute flex gaps').toBe('absolute');
  expect(seam.width).toBeGreaterThan(0);
  expect(seam.starLeft).toBeGreaterThan(seam.lastRight);
  expect(seam.starRight).toBeLessThan(seam.firstLeft);
  await marquee.screenshot({ path: testInfo.outputPath('desktop-marquee-seam.png') });
});

for (const width of [375, 768, 1366, 1440, 1920]) {
  test(`strip ${width}px preserves original typography, spacing and viewport coverage`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const marquee = page.locator('[data-motion="discipline-marquee"]');
    await scrollTo(page, (await documentTop(marquee)) - 350);
    await page.evaluate(() => {
      const wrapper = document.createElement('div');
      wrapper.id = 'original-strip-reference';
      wrapper.style.cssText = 'width:100vw;position:relative;';
      const strip = document.createElement('div');
      strip.className = 'discipline-strip';
      for (const text of ['THINK IT.', '✳', 'DESIGN IT.', '✳', 'BUILD IT.', '✳', 'MAKE IT MATTER.']) {
        const span = document.createElement('span');
        span.textContent = text;
        strip.append(span);
      }
      wrapper.append(strip);
      document.querySelector('[data-motion="discipline-marquee"]')!.after(wrapper);
    });
    await page.evaluate(() => document.fonts.ready);
    await marquee.focus();
    await page.keyboard.press('Space');
    await expect(marquee).toHaveAttribute('data-paused', 'true');
    expect(Math.abs(await travel(marquee.locator('.marquee-track')))).toBeLessThan(.1);
    const geometry = await page.evaluate(() => {
      const measure = (el: Element) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return { width: rect.width, height: rect.height, gap: style.gap, children: Array.from(el.children).filter(child => child.tagName === 'SPAN').map(child => {
          const r = child.getBoundingClientRect(), s = getComputedStyle(child);
          return { text: child.textContent, visible: s.display !== 'none', fontSize: s.fontSize, fontFamily: s.fontFamily, lineHeight: s.lineHeight, height: r.height, width: r.width, x: r.left - rect.left };
        }) };
      };
      return { moving: measure(document.querySelector('.marquee-unit')!), original: measure(document.querySelector('#original-strip-reference .discipline-strip')!) };
    });
    console.log(`Strip geometry ${width}px:`, JSON.stringify(geometry));
    await testInfo.attach('strip-geometry', { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' });
    await page.locator('#original-strip-reference').screenshot({ path: testInfo.outputPath('original-static-strip.png') });
    await marquee.screenshot({ path: testInfo.outputPath('moving-strip-keyboard-paused.png') });
    expect.soft(geometry.moving.width, 'repeat must be exactly viewport width').toBeCloseTo(width, 1);
    expect.soft(geometry.moving.height, 'original strip height').toBeCloseTo(geometry.original.height, 1);
    expect.soft(geometry.moving.gap).toBe(geometry.original.gap);
    expect.soft(geometry.moving.children).toHaveLength(7);
    for (const [index, original] of geometry.original.children.entries()) {
      const moving = geometry.moving.children[index];
      expect.soft({ text: moving.text, visible: moving.visible, fontSize: moving.fontSize, fontFamily: moving.fontFamily, lineHeight: moving.lineHeight }, `span ${index + 1} typography`).toEqual({ text: original.text, visible: original.visible, fontSize: original.fontSize, fontFamily: original.fontFamily, lineHeight: original.lineHeight });
      for (const dimension of ['height', 'width'] as const) expect.soft(moving[dimension], `span ${index + 1} ${dimension}`).toBeCloseTo(original[dimension], 1);
      // display:none has a zero viewport rectangle, not a position in the unit.
      if (original.visible) expect.soft(moving.x, `span ${index + 1} relative x`).toBeCloseTo(original.x, 1);
    }
    await page.keyboard.press('Enter');
    // Scroll toward the nearest repeat boundary while the strip stays in view,
    // without setting transforms or animation state.
    const coverage = await marquee.locator('.marquee-track').evaluate(async track => {
      const viewport = track.parentElement!;
      let worstBlank = 0, worstSeam = 0, wraps = 0, emptyFrames = 0;
      let previousX = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
      const unitWidth = track.firstElementChild!.getBoundingClientRect().width;
      window.scrollBy({ top: previousX < -unitWidth / 2 ? 150 : -150, behavior: 'instant' });
      const start = performance.now();
      while (performance.now() - start < 6000) {
        await new Promise(requestAnimationFrame);
        const view = viewport.getBoundingClientRect();
        const units = Array.from(track.children).map(el => el.getBoundingClientRect());
        const nextX = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
        if (Math.abs(nextX - previousX) > units[0].width / 2) wraps++;
        previousX = nextX;
        if (!Array.from(track.querySelectorAll('span')).some(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.right > view.left && rect.left < view.right;
        })) emptyFrames++;
        worstBlank = Math.max(worstBlank, units[0].left - view.left, view.right - units.at(-1)!.right);
        for (let i = 1; i < units.length; i++) worstSeam = Math.max(worstSeam, units[i].left - units[i - 1].right);
      }
      return { worstBlank, worstSeam, wraps, emptyFrames };
    });
    console.log(`Strip motion coverage ${width}px:`, coverage);
    expect(coverage.wraps, 'observe a real motion wrap boundary').toBeGreaterThan(0);
    expect(coverage.emptyFrames, 'text remains visible throughout motion including wrap').toBe(0);
    expect(coverage.worstBlank, 'moving repeats cover both viewport boundaries').toBeLessThanOrEqual(.1);
    expect(coverage.worstSeam, 'no blank space between moving repeats').toBeLessThanOrEqual(.1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('desktop opening stays beneath the foreground until fully covered, then releases', async ({ page }, testInfo) => {
  const opening = page.locator('[data-motion="opening-depth"]');
  const plane = opening.locator('.opening-plane');
  const work = page.locator('#work');
  await expect(opening).toHaveAttribute('data-depth-enabled', 'true');
  const workTop = await documentTop(work);
  await scrollTo(page, 100);
  const pinnedY = (await plane.boundingBox())!.y;
  const firstWorkY = (await work.boundingBox())!.y;
  await scrollTo(page, workTop - 400);
  expect(await scale(plane)).toBe(1);
  expect((await plane.boundingBox())!.y).toBeCloseTo(pinnedY, 0);
  expect((await work.boundingBox())!.y).toBeLessThan(firstWorkY);
  const openingBox = (await plane.boundingBox())!;
  const workBox = (await work.boundingBox())!;
  expect(openingBox.y + openingBox.height).toBeGreaterThan(workBox.y + 20);
  expect(await work.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + 20, rect.top + 20);
    return !!hit && el.contains(hit);
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('desktop-hero-overlap.png') });
  // The opaque marquee is the leading edge of the same Work foreground.
  // It covers the hero before the Work section heading itself reaches the pin.
  const foregroundTop = await documentTop(page.locator('.selected-work-foreground'));
  await scrollTo(page, foregroundTop - pinnedY);
  expect((await plane.boundingBox())!.y).toBeCloseTo(pinnedY, 0);
  expect((await page.locator('.selected-work-foreground').boundingBox())!.y).toBeLessThanOrEqual(pinnedY + 1);
  await scrollTo(page, workTop + 200);
  expect((await plane.boundingBox())!.y).toBeLessThan(pinnedY - 100);
  expect(await scale(plane)).toBe(1);
  await scrollTo(page, 0);
  await expect.poll(() => scale(plane)).toBeGreaterThan(.99);
});

test('mouse project interaction preserves LIFO stacking in both scroll directions', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const cards = page.locator('.featured-spreads .stack-card');
  await expect(page.locator('.featured-spreads')).toHaveAttribute('data-stack-enabled', 'true');
  const tops = await cards.evaluateAll(els => els.map(el => el.getBoundingClientRect().top + scrollY));
  await cards.first().getByRole('button', { name: /^Read project notes/ }).click();
  await page.getByRole('button', { name: 'Close project details' }).click();
  for (const index of [1, 2, 3, 2, 1, 0]) {
    const card = cards.nth(index);
    const pin = await card.evaluate(el => parseFloat(getComputedStyle(el).top));
    await scrollTo(page, tops[index] - pin + 1);
    await expect.poll(() => card.evaluate(el => {
      const box = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(box.left + 30, box.top + 60));
    })).toBe(true);
  }
});

test('desktop cards sequentially stack without scaling and the terminal card releases the pile to About', async ({ page }, testInfo) => {
  const stack = page.locator('[data-motion="project-stack"]');
  const cards = stack.locator('.stack-card');
  const first = cards.first();
  const plane = first.locator('.project-spread');
  await expect(stack).toHaveAttribute('data-stack-enabled', 'true');
  expect(await cards.count()).toBeGreaterThan(1);
  const firstTop = await documentTop(first);
  const secondTop = await documentTop(cards.nth(1));
  await scrollTo(page, firstTop - 100);
  await expect.poll(() => scale(plane)).toBeGreaterThan(.99);
  await scrollTo(page, secondTop - 160);
  expect(await scale(plane)).toBe(1);
  const pinnedTop = (await first.boundingBox())!.y;
  await scrollTo(page, secondTop - 100);
  expect((await first.boundingBox())!.y).toBeCloseTo(pinnedTop, 0);
  const firstBox = (await plane.boundingBox())!;
  const secondBox = (await cards.nth(1).boundingBox())!;
  expect(secondBox.y).toBeLessThan(firstBox.y + firstBox.height);
  await page.screenshot({ path: testInfo.outputPath('desktop-mid-stack.png') });
  await scrollTo(page, 0);
  const tops = await cards.evaluateAll(els => els.map(el => el.getBoundingClientRect().top + scrollY));
  for (const [index, top] of tops.entries()) {
    const card = cards.nth(index);
    const stickyTop = await card.evaluate(el => parseFloat(getComputedStyle(el).top));
    await scrollTo(page, top - stickyTop);
    const y = (await card.boundingBox())!.y;
    expect(y, `card ${index + 1} reaches its sequential stack offset`).toBeCloseTo(stickyTop, 0);
    if (index > 0) expect(await card.evaluate(el => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + 30, r.top + 30);
      return !!hit && el.contains(hit);
    }), `card ${index + 1} paints above preceding cards`).toBe(true);
    await scrollTo(page, top - stickyTop + 60);
    expect((await card.boundingBox())!.y, `card ${index + 1} pins through the completed stack hold`).toBeCloseTo(y, 0);
    for (const spread of await cards.locator('.project-spread').all()) expect(await scale(spread)).toBe(1);
  }
  const lastY = (await cards.last().boundingBox())!.y;
  await scrollTo(page, await documentTop(page.locator('#about')));
  expect((await cards.last().boundingBox())!.y).toBeLessThan(lastY - 60);
  await page.screenshot({ path: testInfo.outputPath('desktop-stack-release-about.png') });
});

for (const viewport of [{ width: 375, height: 1000 }, { width: 768, height: 1000 }, { width: 1280, height: 720 }]) {
  test(`stack fits ${viewport.width}x${viewport.height}, holds all layers, then releases`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const stack = page.locator('[data-motion="project-stack"]');
    const cards = stack.locator('.stack-card');
    await expect(stack).toHaveAttribute('data-stack-enabled', 'true');
    const tops = await cards.evaluateAll(els => els.map(el => el.getBoundingClientRect().top + scrollY));
    const pin = await cards.last().evaluate(el => parseFloat(getComputedStyle(el).top));
    await scrollTo(page, tops.at(-1)! - pin + 60);
    for (const card of await cards.all()) {
      const top = await card.evaluate(el => parseFloat(getComputedStyle(el).top));
      const box = (await card.boundingBox())!;
      expect(box.y).toBeCloseTo(top, 0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await scrollTo(page, await documentTop(page.locator('#about')));
    expect((await cards.last().boundingBox())!.y).toBeLessThan(0);
    await page.setViewportSize({ width: viewport.width, height: 400 });
    await expect(stack).toHaveAttribute('data-stack-enabled', 'false');
    expect(await cards.first().evaluate(el => getComputedStyle(el).position)).not.toBe('sticky');
  });
}

test('all stacked cards keep keyboard focus visible through project dialogs', async ({ page }, testInfo) => {
  const cards = page.locator('[data-motion="project-stack"] .stack-card');

  // Tab from the preceding section link, rather than programmatically focusing
  // each card. Opening/closing each dialog proves the covered controls work.
  await page.locator('#work .section-heading a').focus();
  for (let index = 0; index < await cards.count(); index++) {
    const notes = cards.nth(index).getByRole('button', { name: /^Read project notes/ });
    await page.keyboard.press('Tab');
    await expect(notes).toBeFocused();
    await expect.poll(() => scale(cards.nth(index).locator('.project-spread'))).toBe(1);
    try {
      await expect.poll(() => notes.evaluate(el => {
        const r = el.getBoundingClientRect();
        return { inViewport: r.top >= 59 && r.bottom <= innerHeight + 1, uncovered: el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) };
      }), { message: `Card ${index + 1}: keyboard-focused project notes must be visible and uncovered` }).toEqual({ inViewport: true, uncovered: true });
    } catch (error) {
      const geometry = await notes.evaluate(el => {
        const r = el.getBoundingClientRect();
        return { name: el.getAttribute('aria-label'), top: r.top, bottom: r.bottom, scrollY, viewportHeight: innerHeight, focused: document.activeElement === el };
      });
      console.log('Keyboard card failure:', geometry);
      await testInfo.attach('focused-card-geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
      throw error;
    }
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(notes).toBeFocused();
    expect(await notes.evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.top >= 59 && r.bottom <= innerHeight + 1 && el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
    }), 'restored focus stays visible after dialog closes').toBe(true);
    await page.keyboard.press('Tab');
    await expect(cards.nth(index).getByRole('button', { name: /^Explore / })).toBeFocused();
  }
});

test('live reduced motion keeps marquee focus and gives a noninteractive static fallback', async ({ page }) => {
  const marquee = page.locator('[data-motion="discipline-marquee"]');
  const button = marquee;
  await button.focus();
  await expect(button).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(marquee).toHaveAttribute('data-static', 'true');
  await expect(button).toBeFocused();
  await expect(button).toBeVisible();
  await expect(button).toHaveAccessibleName(/Motion disabled by reduced motion preference\./);
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(button.locator('button')).toHaveCount(0);
  await expect(marquee.locator('.marquee-static')).toBeVisible();
  await expect(marquee.locator('.marquee-viewport')).not.toBeVisible();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(marquee).toHaveAttribute('data-paused', 'false');
  await expect(page.locator('[data-motion="opening-depth"]')).toHaveAttribute('data-depth-enabled', 'false');
  await expect(page.locator('[data-motion="project-stack"]')).toHaveAttribute('data-stack-enabled', 'false');
  await scrollTo(page, await documentTop(page.locator('#work')));
  for (const selector of ['.opening-plane', '.stack-card .project-spread']) {
    for (const plane of await page.locator(selector).all()) expect(await scale(plane)).toBe(1);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(button).toBeFocused();
  await expect(button).toHaveAccessibleName(/Hold to pause\. Press Space or Enter to pause\./);
  await expect(button).not.toHaveAttribute('aria-disabled', 'true');
  await expect(marquee).toHaveAttribute('data-static', 'false');
  await scrollTo(page, (await documentTop(marquee)) - 500);
  // The return scroll can legitimately reverse its retained direction.
  await expect.poll(async () => Math.abs(await travel(marquee.locator('.marquee-track')))).toBeGreaterThan(2);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 700 }]) {
  test(`hero recedes, shrinks and disappears beneath Work at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const opening = page.locator('.opening-depth');
    const surface = opening.locator('.opening-surface');
    const foreground = page.locator('.selected-work-foreground');
    await expect(opening).toHaveAttribute('data-depth-enabled', 'true');
    await expect.poll(() => opening.evaluate(el => parseFloat(el.style.getPropertyValue('--opening-runway')))).toBeGreaterThan(0);
    const headerHeight = await page.locator('.site-header').evaluate(el => (el as HTMLElement).offsetHeight);
    const top = await documentTop(opening);
    const pin = await opening.evaluate(el => parseFloat(el.style.getPropertyValue('--opening-pin-top')));
    const start = Math.max(0, top - pin);
    const end = (await documentTop(foreground)) - headerHeight;
    expect(await scale(surface)).toBe(1);
    await scrollTo(page, start + (end - start) * .5);
    await expect.poll(() => scale(surface)).toBeCloseTo(.955, 2);
    expect(await surface.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeLessThan(-10);
    expect(Number(await surface.evaluate(el => getComputedStyle(el).opacity))).toBe(1);
    const frame = (await foreground.boundingBox())!;
    expect(frame.y).toBeLessThan(viewport.height);
    expect(await foreground.evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(innerWidth / 2, r.top + 30));
    })).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('hero-receding-under-work.png') });
    await scrollTo(page, end);
    await expect.poll(() => surface.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.01);
    await scrollTo(page, start + (end - start) * .25);
    await expect.poll(() => scale(surface)).toBeCloseTo(.9775, 2);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(opening).toHaveAttribute('data-depth-enabled', 'false');
    expect(await scale(surface)).toBe(1);
    expect(await surface.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  });
}

for (const width of [375, 768]) {
  test(`mobile ${width}px uses normal-flow cards without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 500 });
    await expect(page.locator('[data-motion="opening-depth"]')).toHaveAttribute('data-depth-enabled', 'true');
    const stack = page.locator('[data-motion="project-stack"]');
    await expect(stack).toHaveAttribute('data-stack-enabled', 'false');
    const cards = stack.locator('.stack-card');
    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      expect(await card.evaluate(el => getComputedStyle(el).position)).not.toBe('sticky');
      expect(await scale(card.locator('.project-spread'))).toBe(1);
      const before = (await card.boundingBox())!.y;
      await page.evaluate(() => window.scrollBy({ top: 80, behavior: 'instant' }));
      expect((await card.boundingBox())!.y).toBeCloseTo(before - 80, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    const boxes = await cards.evaluateAll(els => els.map(el => el.getBoundingClientRect()));
    for (let index = 1; index < boxes.length; index++) expect(boxes[index].top).toBeGreaterThanOrEqual(boxes[index - 1].bottom);
    for (const section of ['#home', '#work', '#about', '#archive', '#contact']) {
      await page.locator(section).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}

test('section entrances visibly reveal once and reduced motion leaves them readable', async ({ page }) => {
  for (const selector of ['#about > [data-reveal]', '#archive > [data-reveal]', '#contact > [data-reveal]']) {
    const reveal = page.locator(selector).first();
    const samples = await reveal.evaluate(async el => {
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight / 2, behavior: 'instant' });
      const frames: { opacity: number; y: number }[] = [];
      const start = performance.now();
      while (performance.now() - start < 750) {
        await new Promise(requestAnimationFrame);
        const style = getComputedStyle(el);
        frames.push({ opacity: Number(style.opacity), y: new DOMMatrixReadOnly(style.transform).m42 });
      }
      return frames;
    });
    expect(samples.some(frame => frame.opacity < .95 && frame.y > 1)).toBe(true);
    expect(samples.at(-1)!.opacity).toBeCloseTo(1, 2);
    expect(samples.at(-1)!.y).toBeCloseTo(0, 1);
    await scrollTo(page, 0);
    await scrollTo(page, (await documentTop(reveal)) - 300);
    expect(await reveal.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  for (const reveal of await page.locator('[data-reveal]').all()) {
    expect(await reveal.evaluate(el => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))).toEqual({ opacity: '1', transform: 'none' });
  }
});
