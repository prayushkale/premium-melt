import { expect, test, type Page } from '@playwright/test';

async function waitForSceneReady(page: Page) {
  await page.waitForSelector('canvas', { state: 'visible' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForTimeout(350);
}

test.describe('Premium Melt E2E', () => {
  test('1. default page renders canvas cleanly with ATM premium ₹186.73 and no console errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await waitForSceneReady(page);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(800);
    expect(box!.height).toBeGreaterThan(500);

    await expect(page.getByTestId('atm-premium')).toHaveText('₹186.73');
    await expect(
      page.getByText('Teaching model, not advice. Not affiliated with NSE.'),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('2. URL with 1 hour left and flag shows ₹14.41, 92% melted, and fell ₹172.3', async ({
    page,
  }) => {
    await page.goto('/?s=26000&iv=13&t=60&k=26000&c=26000');
    await waitForSceneReady(page);

    await expect(page.getByTestId('atm-premium')).toHaveText('₹14.41');
    await expect(page.getByTestId('melted-pct')).toHaveText('92% melted');
    await expect(page.locator('.flag-explain-line')).toContainText('fell ₹172.3');
  });

  test('3. focusing expiry clock and pressing End expires option to ₹0.00', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForSceneReady(page);

    const clock = page.getByRole('slider', { name: 'Expiry clock' });
    await clock.focus();
    await page.keyboard.press('End');

    await expect(page.getByTestId('time-left')).toHaveText('Expired');
    await expect(page.getByTestId('atm-premium')).toHaveText('₹0.00');
  });

  test('4. clicking terrain plants a flag and adds k to URL', async ({ page }) => {
    await page.goto('/');
    await waitForSceneReady(page);

    const canvas = page.locator('canvas');
    const box = (await canvas.boundingBox())!;
    // Click near center of the glowing terrain ridge
    await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.48);

    await expect(page.locator('.flag-strike-value')).toBeVisible();
    await expect(page.locator('.flag-explain-line')).toBeVisible();
    // Wait for 250ms URL debounce
    await page.waitForTimeout(400);
    expect(page.url()).toMatch(/[?&]k=\d+/);
  });

  test('5. raising IV increases ATM premium', async ({ page }) => {
    await page.goto('/');
    await waitForSceneReady(page);

    const ivSlider = page.getByLabel('Implied volatility');
    await ivSlider.fill('22');
    await ivSlider.dispatchEvent('input');
    await ivSlider.dispatchEvent('change');

    const text = await page.getByTestId('atm-premium').textContent();
    const numeric = Number((text ?? '').replace(/[^0-9.]/g, ''));
    expect(numeric).toBeGreaterThan(250);
  });

  test('6. copy link restores exact spot, IV, strike, and time in a new page', async ({
    page,
    context,
  }) => {
    await page.goto('/?s=26200&iv=18.5&t=1440&k=26300&c=26000');
    await waitForSceneReady(page);

    const copyBtn = page.getByRole('button', { name: 'Copy link' });
    await copyBtn.click();
    await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();

    const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedUrl).toContain('s=26200');
    expect(copiedUrl).toContain('iv=18.5');
    expect(copiedUrl).toContain('t=1440');
    expect(copiedUrl).toContain('k=26300');
    expect(copiedUrl).toContain('c=26000');

    const page2 = await context.newPage();
    await page2.goto(copiedUrl);
    await waitForSceneReady(page2);

    await expect(page2.locator('#spot-input')).toHaveValue('26200');
    await expect(page2.locator('.slider-value')).toHaveText('18.5%');
    await expect(page2.locator('.flag-strike-value')).toHaveText('26,300');
    await expect(page2.getByTestId('time-left')).toHaveText('1d 0h 0m');
    await page2.close();
  });

  test('7. junk parameters fall back safely to defaults', async ({ page }) => {
    await page.goto('/?s=nope&iv=bad&t=NaN&k=xyz&c=???');
    await waitForSceneReady(page);

    await expect(page.locator('#spot-input')).toHaveValue('26000');
    await expect(page.getByTestId('atm-premium')).toHaveText('₹186.73');
    await expect(page.getByText('Click any strike to plant a flag')).toBeVisible();
  });

  test('8. capture verification screenshots and OG image', async ({ page }) => {
    const desktopViews: Array<{ path: string; file: string; width?: number; height?: number }> = [
      { path: '/', file: 'shots/01-default.png' },
      { path: '/?s=26000&iv=13&t=1440&c=26000', file: 'shots/02-1day.png' },
      { path: '/?s=26000&iv=13&t=60&c=26000', file: 'shots/03-1hour.png' },
      { path: '/?s=26000&iv=13&t=0&c=26000', file: 'shots/04-expired.png' },
      { path: '/?s=26000&iv=8&t=10080&c=26000', file: 'shots/05-iv8.png' },
      { path: '/?s=26000&iv=30&t=10080&c=26000', file: 'shots/06-iv30.png' },
      { path: '/?s=25200&iv=13&t=10080&c=26000', file: 'shots/07-spot-low.png' },
      { path: '/?s=26800&iv=13&t=10080&c=26000', file: 'shots/08-spot-high.png' },
      { path: '/?s=26000&iv=13&t=60&k=26000&c=26000', file: 'shots/09-flag-explain.png' },
      { path: '/', file: 'shots/10-desktop-1280x720.png', width: 1280, height: 720 },
      { path: '/', file: 'public/og.png', width: 1200, height: 630 },
    ];

    for (const v of desktopViews) {
      await page.setViewportSize({ width: v.width ?? 1440, height: v.height ?? 900 });
      await page.goto(v.path);
      await waitForSceneReady(page);
      await expect(
        page.getByText('Teaching model, not advice. Not affiliated with NSE.'),
      ).toBeVisible();
      await page.screenshot({ path: v.file });
    }

    // Phone 390x844 views
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForSceneReady(page);
    await expect(
      page.getByText('Teaching model, not advice. Not affiliated with NSE.'),
    ).toBeVisible();
    await page.screenshot({ path: 'shots/11-phone-default.png' });

    await page.goto('/?s=26000&iv=13&t=60&k=26000&c=26000');
    await waitForSceneReady(page);
    await expect(
      page.getByText('Teaching model, not advice. Not affiliated with NSE.'),
    ).toBeVisible();
    await page.screenshot({ path: 'shots/12-phone-flag.png' });
  });
});
