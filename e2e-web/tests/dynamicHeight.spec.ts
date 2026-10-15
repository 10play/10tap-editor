import { expect, test, type Locator } from '@playwright/test';

const iframeHeight = async (iframe: Locator) =>
  (await iframe.boundingBox())?.height ?? 0;

// #205: on web the height has to reach the iframe itself, not just its container.
test('a dynamicHeight editor resizes its iframe to the content', async ({
  page,
}) => {
  await page.goto('/?scenario=dynamic-height');
  await expect(page.getByTestId('dynamic-state')).toContainText('ready:true');

  const iframe = page.getByTestId('dynamic-frame').locator('iframe');
  await expect.poll(() => iframeHeight(iframe)).toBeGreaterThan(0);
  await expect.poll(() => iframeHeight(iframe)).toBeLessThan(120);
  const wrapper = iframe.contentFrame().locator('.dynamic-height');
  // The paragraph margins count too: nothing is left to scroll to.
  await expect
    .poll(() => wrapper.evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBe(0);
  const before = await iframeHeight(iframe);

  await page.getByTestId('grow').click();

  await expect.poll(() => iframeHeight(iframe)).toBeGreaterThan(before + 200);
  const content = iframe.contentFrame().locator('.ProseMirror');
  await expect(content).toContainText('Line 15');
  const contentHeight = (await content.boundingBox())?.height ?? 0;
  expect(await iframeHeight(iframe)).toBeGreaterThanOrEqual(contentHeight);
  await expect
    .poll(() => wrapper.evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBe(0);
});

// #289/#323: a maxHeight parent clamps the editor, which then scrolls.
test('a dynamicHeight editor shrinks to a maxHeight parent', async ({
  page,
}) => {
  await page.goto('/?scenario=capped-dynamic-height');
  await expect(page.getByTestId('capped-state')).toContainText('ready:true');

  const frame = page.getByTestId('capped-frame');
  const iframe = frame.locator('iframe');
  await expect.poll(() => iframeHeight(iframe)).toBeGreaterThan(100);
  const frameHeight = (await frame.boundingBox())?.height ?? 0;
  expect(frameHeight).toBeLessThanOrEqual(150);
  expect(await iframeHeight(iframe)).toBeLessThanOrEqual(frameHeight);

  const wrapper = iframe.contentFrame().locator('.dynamic-height');
  await expect
    .poll(() => wrapper.evaluate((el) => el.scrollHeight > el.clientHeight))
    .toBe(true);
});
