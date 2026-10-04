import { expect, test } from '@playwright/test';

// #318: with two editors on a page, messages from one must not reach the other.
test('two editors on one page stay independent', async ({ page }) => {
  await page.goto('/?scenario=two-editors');

  const firstState = page.getByTestId('first-state');
  const secondState = page.getByTestId('second-state');
  await expect(firstState).toContainText('ready:true');
  await expect(secondState).toContainText('ready:true');

  const firstEditor = page
    .getByTestId('first-editor')
    .locator('iframe')
    .contentFrame()
    .locator('.ProseMirror');
  const secondEditor = page
    .getByTestId('second-editor')
    .locator('iframe')
    .contentFrame()
    .locator('.ProseMirror');
  await expect(firstEditor).toHaveText('Alpha');
  await expect(secondEditor).toHaveText('Bravo');

  await secondEditor.click();
  await page.keyboard.press('End');
  await page.keyboard.press('ControlOrMeta+b');
  await page.keyboard.type(' typed');

  await expect(secondState).toHaveText('ready:true focused:true bold:true');
  await expect(firstState).toHaveText('ready:true focused:false bold:false');

  await page.getByTestId('first-read').click();
  await expect(page.getByTestId('first-html')).toHaveText('<p>Alpha</p>');
  await page.getByTestId('second-read').click();
  await expect(page.getByTestId('second-html')).toHaveText(
    '<p>Bravo<strong> typed</strong></p>'
  );
});
