import { expect, test, type Page } from '@playwright/test';
import { DYNAMIC_HEIGHT_CSS } from '../../src/web/styles';

/** The `.ProseMirror` rules of the 1.0 `index.html` template. */
const TEMPLATE_1_0_CSS = `
  #root > div:nth-of-type(1) { position: absolute; height: 100%; overflow: auto; width: 100%; }
  #root > div.dynamic-height { height: unset; }
  #root div .ProseMirror { min-height: 100%; overflow: visible; }
  #root div.dynamic-height .ProseMirror { height: unset; }
`;

const editorBox = async (page: Page, css: string[]) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.setContent(
    `${css.map((sheet) => `<style>${sheet}</style>`).join('')}` +
      '<div id="root"><div class="dynamic-height">' +
      '<div class="ProseMirror"><p>Line</p></div></div></div>'
  );
  return page.locator('.ProseMirror').evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      minHeight: style.minHeight,
      display: style.display,
    };
  });
};

// #336: the 1.0 template sized the editor to the viewport, so the reported
// height fed back into the WebView height.
test('the dynamic-height stylesheet sizes a 1.0 template editor to its content', async ({
  page,
}) => {
  const box = await editorBox(page, [TEMPLATE_1_0_CSS, DYNAMIC_HEIGHT_CSS]);
  expect(box.minHeight).toBe('0px');
  expect(box.display).toBe('flow-root');
  expect(box.height).toBeLessThan(100);
});

test('app CSS still sets a minimum height on a dynamic-height editor', async ({
  page,
}) => {
  const box = await editorBox(page, [
    TEMPLATE_1_0_CSS,
    DYNAMIC_HEIGHT_CSS,
    '.ProseMirror{min-height:120px !important}',
  ]);
  expect(box.minHeight).toBe('120px');
  expect(box.height).toBe(120);
});
