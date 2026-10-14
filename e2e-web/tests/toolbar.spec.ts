import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 390, height: 844 };

const editorIn = (page: Page, testID: string) =>
  page
    .getByTestId(testID)
    .locator('iframe')
    .contentFrame()
    .locator('.ProseMirror');

const button = (page: Page, label: string) =>
  page.getByRole('button', { name: label, exact: true });

test.describe('web toolbar', () => {
  test.use({ viewport: PHONE });

  test('scrolls its own row instead of the page on a phone-width window', async ({
    page,
  }) => {
    await page.goto('/?scenario=toolbar');
    await expect(page.getByTestId('toolbar-state')).toContainText('ready:true');

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);

    // The last item is reachable by scrolling the toolbar.
    const redo = button(page, 'Redo');
    await redo.scrollIntoViewIfNeeded();
    const box = await redo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(PHONE.width);
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
  });

  test('keeps the editor focused through the heading sub-toolbar', async ({
    page,
  }) => {
    await page.goto('/?scenario=toolbar');
    const state = page.getByTestId('toolbar-state');
    await expect(state).toContainText('ready:true');
    const editor = editorIn(page, 'toolbar-editor');

    await editor.click();
    await page.keyboard.press('End');
    await expect(state).toContainText('focused:true');

    await button(page, 'Heading').click();
    await button(page, 'Heading 1').click();
    await button(page, 'Close headings').click();
    await page.keyboard.type('Z');

    await expect(editor.locator('h1')).toHaveText('Hello toolbarZ');
    await expect(state).toContainText('focused:true');
  });

  test('keeps the link bar one row high in a column', async ({ page }) => {
    await page.goto('/?scenario=toolbar');
    await expect(page.getByTestId('toolbar-state')).toContainText('ready:true');
    const editor = editorIn(page, 'toolbar-editor');

    await editor.click();
    await page.keyboard.press('ControlOrMeta+a');
    await button(page, 'Link').click();

    const input = page.getByPlaceholder('Type your URL here...');
    await expect(input).toBeVisible();
    const bar = await input.locator('..').boundingBox();
    expect(bar!.height).toBeLessThanOrEqual(50);

    await input.fill('https://example.com');
    await page.getByRole('button', { name: 'Insert' }).click();
    await expect(editor.locator('a')).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });
});

test('a toolbar item opens the color keyboard and it stays open', async ({
  page,
}) => {
  await page.goto('/?scenario=color-keyboard');
  await expect(page.getByTestId('color-state')).toContainText('ready:true');
  const editor = editorIn(page, 'color-editor');

  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await button(page, 'Color keyboard').click();

  const keyboard = page.getByTestId('tentap-custom-keyboard');
  await expect(keyboard).toBeVisible();
  await expect(page.getByTestId('active-keyboard')).toHaveText(
    'active:keyboard.color'
  );
  // A blur that arrives after the open must not close it again.
  await page.waitForTimeout(500);
  await expect(keyboard).toBeVisible();
  // Nor does a click inside the keyboard, which moves focus out of the editor.
  await keyboard.getByText('Highlight').click();
  await expect(page.getByTestId('color-state')).toContainText('focused:false');
  await page.waitForTimeout(300);
  await expect(keyboard).toBeVisible();

  // Pressing the item again closes it.
  await button(page, 'Color keyboard').click();
  await expect(keyboard).toHaveCount(0);
  await expect(page.getByTestId('active-keyboard')).toHaveText('active:-');
});
