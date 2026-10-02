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

test('reduces the marquee animation when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page
    .locator('.ticker-track')
    .evaluate((element) => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(duration)).toBeLessThan(0.001);
});
