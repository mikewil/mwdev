import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('presents the portfolio structure and working in-page navigation', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'I make complex things',
  );
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Good work makes/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Let’s make something/ }),
  ).toBeVisible();
  await expect(page.locator('.ticker')).toHaveCount(0);
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/#about$/);
});

test('falls back cleanly when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = new Proxy(original, {
      apply(target, thisArg, argumentsList) {
        if (String(argumentsList[0]).startsWith('webgl')) return null;
        return Reflect.apply(target, thisArg, argumentsList);
      },
    });
  });

  await page.goto('/');
  const visual = page.locator('[data-fluid-visual]');
  await expect(visual).toHaveAttribute('data-webgl', 'unsupported');
  await expect(visual.locator('canvas')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('initializes the WebGL visual or reports its CSS fallback', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('[data-fluid-visual]')).toHaveAttribute(
    'data-webgl',
    /^(ready|unsupported)$/,
  );
});

test('fills the viewport and responds to hover with the dark smoke palette', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const prototype = WebGLRenderingContext.prototype;
    const uniform4f = prototype.uniform4f;
    prototype.uniform4f = function (location, x, y, z, w) {
      (window as Window & { smokePointer?: number[] }).smokePointer = [
        x,
        y,
        z,
        w,
      ];
      return uniform4f.call(this, location, x, y, z, w);
    };
  });

  await page.goto('/');
  const hero = page.locator('.hero');
  const visual = page.locator('[data-fluid-visual]');
  const dimensions = await hero.evaluate((element) => {
    const heroBounds = element.getBoundingClientRect();
    const visualBounds = element
      .querySelector('[data-fluid-visual]')!
      .getBoundingClientRect();
    return {
      hero: [heroBounds.x, heroBounds.y, heroBounds.width, heroBounds.height],
      visual: [
        visualBounds.x,
        visualBounds.y,
        visualBounds.width,
        visualBounds.height,
      ],
      viewportWidth: window.innerWidth,
    };
  });
  expect(dimensions.visual).toEqual(dimensions.hero);
  expect(dimensions.hero[0]).toBe(0);
  expect(dimensions.hero[2]).toBe(dimensions.viewportWidth);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveCSS(
    'background-color',
    'rgb(8, 9, 18)',
  );
  await expect(page.locator('html')).toHaveCSS('color', 'rgb(245, 243, 255)');

  if ((await visual.getAttribute('data-webgl')) === 'ready') {
    const bounds = await hero.boundingBox();
    if (!bounds) throw new Error('Hero shell has no rendered bounds.');
    const hoverPoint = {
      x: bounds.x + bounds.width * 0.82,
      y: bounds.y + bounds.height * 0.35,
    };
    const mobile = test.info().project.name === 'mobile-chromium';

    if (mobile) {
      await page.touchscreen.tap(hoverPoint.x, hoverPoint.y);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as Window & { smokePointer?: number[] })
                .smokePointer?.[2] ?? 0,
          ),
        )
        .toBe(0);
    } else {
      await page.mouse.move(hoverPoint.x, hoverPoint.y);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as Window & { smokePointer?: number[] })
                .smokePointer?.[2] ?? 0,
          ),
        )
        .toBeGreaterThan(0.999);

      const beforeClick = await page.evaluate(
        () => (window as Window & { smokePointer?: number[] }).smokePointer,
      );
      await page.mouse.click(hoverPoint.x, hoverPoint.y);
      await page.waitForTimeout(50);
      const afterClick = await page.evaluate(
        () => (window as Window & { smokePointer?: number[] }).smokePointer,
      );
      expect(afterClick?.slice(0, 2)).toEqual(beforeClick?.slice(0, 2));
      expect(afterClick?.[2]).toBeCloseTo(beforeClick?.[2] ?? 0, 2);

      await page.mouse.move(0, 0);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as Window & { smokePointer?: number[] })
                .smokePointer?.[2] ?? 0,
          ),
        )
        .toBeLessThan(0.05);
    }
  }

  await page.locator('.hero-actions .button-link').click();
  await expect(page).toHaveURL(/#work$/);
});

test('keeps the mobile layout within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test('has no automated accessibility violations on the landing page', async ({
  page,
}) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('keeps smoke still when reduced motion is requested', async ({ page }) => {
  await page.addInitScript(() => {
    const requestFrame = window.requestAnimationFrame.bind(window);
    (window as Window & { scheduledFrames?: number }).scheduledFrames = 0;
    window.requestAnimationFrame = (callback) => {
      const state = window as Window & { scheduledFrames?: number };
      state.scheduledFrames = (state.scheduledFrames ?? 0) + 1;
      return requestFrame(callback);
    };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const visual = page.locator('[data-fluid-visual]');
  await expect(visual).toHaveAttribute('data-webgl', /^(ready|unsupported)$/);
  if ((await visual.getAttribute('data-webgl')) === 'ready') {
    await page.waitForTimeout(100);
    expect(
      await page.evaluate(
        () => (window as Window & { scheduledFrames?: number }).scheduledFrames,
      ),
    ).toBe(0);
  }
});
