import { expect, test, type Locator } from '@playwright/test';

const iframeHeight = async (iframe: Locator) =>
  (await iframe.boundingBox())?.height ?? 0;

// #205: on web the height has to reach the iframe itself, not just its container.
test('a dynamicHeight editor resizes its iframe to the content', async ({
  page,
}) => {
  // TODO(WP-E): drop once RichText puts the height on the WebView style.
  // Until then this reproduces #205.
  test.fail();
  await page.goto('/?scenario=dynamic-height');
  await expect(page.getByTestId('dynamic-state')).toContainText('ready:true');

  const iframe = page.getByTestId('dynamic-frame').locator('iframe');
  await expect.poll(() => iframeHeight(iframe)).toBeGreaterThan(0);
  await expect.poll(() => iframeHeight(iframe)).toBeLessThan(120);
  const before = await iframeHeight(iframe);

  await page.getByTestId('grow').click();

  await expect.poll(() => iframeHeight(iframe)).toBeGreaterThan(before + 200);
  const content = iframe.contentFrame().locator('.ProseMirror');
  await expect(content).toContainText('Line 15');
  const contentHeight = (await content.boundingBox())?.height ?? 0;
  expect(await iframeHeight(iframe)).toBeGreaterThanOrEqual(contentHeight);
});
