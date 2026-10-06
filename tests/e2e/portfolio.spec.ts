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

test('publishes the Rediscovering WebGL note with its image and example link', async ({
  page,
}) => {
  await page.goto('/');
  const note = page.getByRole('link', { name: /Rediscovering WebGL/ });
  await expect(note).toBeVisible();
  await expect(note).toHaveAttribute('href', '/writing/rediscovering-webgl/');
  const cardImage = note.locator('.work-card-thumbnail');
  await expect(cardImage).toHaveAttribute(
    'src',
    '/images/writing/rediscovering-webgl.png',
  );
  await expect(cardImage).toHaveAttribute('alt', '');
  await expect(cardImage).toHaveCSS('object-fit', 'cover');
  await expect(cardImage).toHaveCSS('object-position', '50% 50%');
  await cardImage.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      cardImage.evaluate(
        (element) => (element as HTMLImageElement).naturalWidth,
      ),
    )
    .toBeGreaterThan(0);
  await note.click();

  await expect(page).toHaveURL('/writing/rediscovering-webgl/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Rediscovering WebGL',
  );
  const articleImage = page.locator('.writing-image img');
  await expect(articleImage).toHaveAttribute(
    'src',
    '/images/writing/rediscovering-webgl.png',
  );
  await expect(articleImage).toHaveAttribute(
    'alt',
    'Flowing WebGL fluid visualization with bright white and green currents edged in pink and purple.',
  );
  await expect
    .poll(() =>
      articleImage.evaluate(
        (element) => (element as HTMLImageElement).naturalWidth,
      ),
    )
    .toBeGreaterThan(0);
  await expect(
    page.getByRole('link', { name: 'this', exact: true }),
  ).toHaveAttribute(
    'href',
    'https://paveldogreat.github.io/WebGL-Fluid-Simulation/',
  );
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);
});

test('shows each project screenshot on its homepage case study card', async ({
  page,
}) => {
  const projects = [
    {
      slug: 'robot-parts-accessories-ecommerce',
      image: '/images/projects/robot-parts-accessories-ecommerce.png',
    },
    {
      slug: 'marketing-materials-ordering-ecommerce',
      image: '/images/projects/marketing-materials-ordering-ecommerce.png',
    },
    {
      slug: 'shop-floor-data-collection',
      image: '/images/projects/shop-floor-data-collection.png',
    },
  ];

  await page.goto('/');

  for (const { slug, image: imageSrc } of projects) {
    const card = page.locator(`#work a[href="/work/${slug}/"]`);
    const image = card.locator('.work-card-thumbnail');
    const arrow = card.locator('.work-card-arrow');
    await expect(image).toHaveAttribute('src', imageSrc);
    await expect(image).toHaveAttribute('alt', '');
    await expect(image).toHaveAttribute('aria-hidden', 'true');
    await expect(image).toHaveCSS('object-fit', 'cover');
    await expect(image).toHaveCSS('object-position', '50% 50%');
    await expect(arrow).toHaveText('↗');
    await expect(arrow).toHaveAttribute('aria-hidden', 'true');
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);

    const arrowPosition = await card.evaluate((element) => {
      const arrow = element.querySelector('.work-card-arrow');
      const header = element.querySelector('.work-card-top');
      const thumbnail = element.querySelector('.work-card-thumbnail');
      if (!arrow || !header || !thumbnail) {
        throw new Error(
          'Case study card is missing its arrow, header, or thumbnail.',
        );
      }
      const cardBounds = element.getBoundingClientRect();
      const arrowBounds = arrow.getBoundingClientRect();
      const headerBounds = header.getBoundingClientRect();
      const thumbnailBounds = thumbnail.getBoundingClientRect();
      return {
        rightInset: cardBounds.right - arrowBounds.right,
        arrowWithinHeader:
          arrowBounds.top >= headerBounds.top &&
          arrowBounds.bottom <= headerBounds.bottom,
        headerAboveThumbnail: headerBounds.bottom < thumbnailBounds.top,
      };
    });
    expect(arrowPosition.rightInset).toBeGreaterThan(0);
    expect(arrowPosition.rightInset).toBeLessThan(40);
    expect(arrowPosition.arrowWithinHeader).toBe(true);
    expect(arrowPosition.headerAboveThumbnail).toBe(true);

    const verticalGaps = await card.evaluate((element) => {
      const bounds = (selector: string) => {
        const child = element.querySelector(selector);
        if (!child) throw new Error(`Missing card element: ${selector}`);
        const rect = child.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      };
      const label = bounds('.work-card-top');
      const thumbnail = bounds('.work-card-thumbnail');
      const title = bounds('h3');
      const summary = bounds('p');
      return [
        thumbnail.top - label.bottom,
        title.top - thumbnail.bottom,
        summary.top - title.bottom,
      ];
    });
    for (const gap of verticalGaps) {
      expect(gap).toBeGreaterThanOrEqual(16);
    }
  }

  const cardMetrics = await page
    .locator('#work .work-card')
    .evaluateAll((cards) =>
      cards.map((card) => {
        const bounds = card.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          scrollHeight: card.scrollHeight,
          clientHeight: card.clientHeight,
        };
      }),
    );
  expect(cardMetrics).toHaveLength(3);
  for (const metrics of cardMetrics) {
    expect(Math.abs(metrics.width - cardMetrics[0].width)).toBeLessThan(1);
    expect(Math.abs(metrics.height - cardMetrics[0].height)).toBeLessThan(1);
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight);
  }
});

test('publishes the supplied case studies with their screenshots', async ({
  page,
}) => {
  const caseStudies = [
    {
      slug: 'robot-parts-accessories-ecommerce',
      title: 'Robot Parts & Accessories ECommerce',
      tags: 'Adobe XD · Adobe Illustrator · .NET · C# · Kentico CMS',
      imageAlt:
        'Robotics parts storefront listing pendant protection accessories with product details and add-to-cart controls.',
    },
    {
      slug: 'marketing-materials-ordering-ecommerce',
      title: 'Marketing Materials Ordering and ECommerce',
      tags: 'Figma · Adobe Illustrator · .NET · C# · Angular 12+',
      imageAlt:
        'Retail ordering portal showing an apparel catalog with selectable products and cart controls.',
    },
    {
      slug: 'shop-floor-data-collection',
      title: 'Shop Floor Data Collection Re-imagined',
      tags: 'Adobe XD · .NET · C# · Angular 12+ · Material UI',
      imageAlt:
        'Shop floor job schedule with order details, materials, production quantities, and machine controls.',
    },
  ];

  for (const { slug, title, tags, imageAlt } of caseStudies) {
    await page.goto(`/work/${slug}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    const screenshot = page.locator('.project-screenshot');
    const image = screenshot.getByRole('img');
    await expect(screenshot).toBeVisible();
    await expect(image).toHaveAttribute('alt', imageAlt);
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(page.locator('.site-footer span')).toContainText(tags);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows).toBe(false);
  }
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
        .toBeGreaterThan(0.5);

      const beforeClick = await page.evaluate(
        () => (window as Window & { smokePointer?: number[] }).smokePointer,
      );
      await page.mouse.click(hoverPoint.x, hoverPoint.y);
      await page.waitForTimeout(50);
      const afterClick = await page.evaluate(
        () => (window as Window & { smokePointer?: number[] }).smokePointer,
      );
      expect(afterClick?.slice(0, 2)).toEqual(beforeClick?.slice(0, 2));
      expect(afterClick?.[2] ?? 0).toBeGreaterThan(0.5);

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
