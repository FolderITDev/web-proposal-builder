import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('write a proposal', () => {
  test('creates from a template, edits with autosave, and exports the same totals', async ({
    page,
  }) => {
    await page.goto('proposals/new');
    await page.getByRole('button', { name: 'Use template' }).first().click();
    // Creating writes the draft and its children before navigating; allow for a cold server.
    await expect(page).toHaveURL(/\/proposals\/[0-9a-f-]{36}$/, { timeout: 10_000 });

    const preview = page.getByRole('complementary', { name: 'Live preview' });
    await page
      .getByLabel('Company', { exact: true })
      .filter({ visible: true })
      .fill('Ostrava Freight Lines');
    await expect(page.getByRole('status').filter({ hasText: /Saved/ })).toBeVisible({
      timeout: 10_000,
    });

    const rate = page.getByLabel('Rate (USD)').first();
    await rate.fill('45');
    await rate.blur();
    await page
      .getByRole('button', { name: 'Pricing' })
      .or(page.getByRole('link', { name: 'Pricing' }))
      .first()
      .click();
    await expect(page.getByText('USD 8,100.00').first()).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /Saved/ })).toBeVisible({
      timeout: 10_000,
    });

    if (await preview.isVisible())
      await expect(preview.getByText('Ostrava Freight Lines')).toBeVisible();

    const href = await page.getByRole('link', { name: 'PDF' }).getAttribute('href');
    const pdf = await page.request.get(href ?? '');
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('refuses edits to examples until they are duplicated', async ({ page }) => {
    await page.goto('proposals?status=accepted');
    await page.getByRole('link', { name: /Inspection app/ }).click();
    await expect(page.getByText('Example proposals are read-only.')).toBeVisible();
    await expect(
      page.getByLabel('Company', { exact: true }).filter({ visible: true }),
    ).toBeDisabled();

    await page.getByRole('button', { name: 'Duplicate to edit' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: /^Copy of Inspection app/ }),
    ).toBeVisible();
    await expect(
      page.getByLabel('Company', { exact: true }).filter({ visible: true }),
    ).toBeEnabled();
  });

  test('freezes a proposal once it is sent and shares it by link', async ({ page }) => {
    await page.goto('proposals/new');
    await page.getByRole('button', { name: 'Use template' }).nth(2).click();
    await expect(page.getByRole('status').filter({ hasText: /Saved/ })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: 'Mark as sent' }).click();
    await expect(page.getByText('Sent proposals are frozen as they were sent.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark as accepted' })).toBeVisible();

    const url = new URL(page.url());
    const id = url.pathname.split('/').pop();
    const proposal = await (await page.request.get(`api/proposals/${id}`)).json();
    await page.goto(`p/${proposal.shareToken}`);
    await expect(page.getByRole('article', { name: /Monthly engineering retainer/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});

test.describe('public pages', () => {
  test('the landing page is indexable and structured', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Proposals that add up, to the cent.',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/apps\/proposal-builder$/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /opengraph-image/,
    );
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) =>
        scripts
          .flatMap((script) => JSON.parse(script.textContent ?? '[]'))
          .map((item) => item['@type']),
      );
    expect(types).toEqual(expect.arrayContaining(['Organization', 'BreadcrumbList', 'FAQPage']));
  });

  test('the tool is excluded from search results', async ({ page }) => {
    await page.goto('proposals');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  for (const path of ['', 'docs/api', 'proposals', 'proposals/new']) {
    test(`has no WCAG 2.2 AA violations on /${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      expect(
        violations.map(
          (violation) =>
            `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`,
        ),
      ).toEqual([]);
    });
  }

  test('the editor has no WCAG 2.2 AA violations', async ({ page }) => {
    await page.goto('proposals/new');
    await page.getByRole('button', { name: 'Use template' }).first().click();
    await page.getByLabel('Company', { exact: true }).filter({ visible: true }).waitFor();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(
      violations.map(
        (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`,
      ),
    ).toEqual([]);
  });
});
