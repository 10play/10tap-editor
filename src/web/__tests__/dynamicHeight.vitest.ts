import type { EditorView } from '@tiptap/pm/view';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamicHeight } from '../dynamicHeight';

let resize: () => void = () => {};

class FakeResizeObserver {
  constructor(callback: () => void) {
    resize = callback;
  }
  observe() {}
  disconnect() {
    resize = () => {};
  }
}

/** `.dynamic-height` scroll container around an editor element of `height`. */
const createEditor = () => {
  const wrapper = document.createElement('div');
  wrapper.className = 'dynamic-height';
  const dom = document.createElement('div');
  dom.className = 'ProseMirror';
  wrapper.appendChild(dom);
  document.body.appendChild(wrapper);

  let contentHeight = 100;
  let viewportHeight = 100;
  dom.getBoundingClientRect = () => new DOMRect(0, 0, 300, contentHeight);
  Object.defineProperty(wrapper, 'clientHeight', {
    get: () => viewportHeight,
  });
  const dispatch = vi.fn();
  const view = {
    dom,
    isDestroyed: false,
    hasFocus: () => true,
    state: { tr: { scrollIntoView: () => 'scroll-tr' } },
    dispatch,
  } as unknown as EditorView;

  return {
    view,
    wrapper,
    dispatch,
    /** Content grows or shrinks and the ResizeObserver fires. */
    setContent: (height: number) => {
      contentHeight = height;
      resize();
    },
    /** Content changes without a resize notification yet. */
    setContentSilently: (height: number) => {
      contentHeight = height;
    },
    setViewport: (height: number) => {
      viewportHeight = height;
    },
  };
};

let now = 0;
const heights: number[] = [];
const create = () =>
  new DynamicHeight({
    onHeight: (height) => heights.push(height),
    now: () => now,
  });

beforeEach(() => {
  now = 0;
  heights.length = 0;
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
    callback();
    return 1;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('DynamicHeight reports', () => {
  it('reports the height on observe and after resizes, rounded up and deduplicated', () => {
    const editor = createEditor();
    const dynamicHeight = create();

    dynamicHeight.observe(editor.view);
    editor.setContent(120.2);
    editor.setContent(120.4);
    editor.setContent(80);

    expect(heights).toEqual([100, 121, 80]);
    expect(dynamicHeight.height).toBe(80);
  });

  it('waits for a detached editor to be attached', () => {
    const editor = createEditor();
    editor.wrapper.remove();
    const dynamicHeight = create();

    dynamicHeight.observe(editor.view);
    expect(heights).toEqual([]);

    document.body.appendChild(editor.wrapper);
    editor.setContent(90);
    expect(heights).toEqual([90]);
  });

  it('stops reporting after disconnect', () => {
    const editor = createEditor();
    const disconnect = create().observe(editor.view);

    disconnect();
    editor.setContent(300);

    expect(heights).toEqual([100]);
  });
});

describe('DynamicHeight scroll policy', () => {
  it('suppresses selection scrolling while native follows the content (#236, #289)', () => {
    const editor = createEditor();
    const dynamicHeight = create();
    dynamicHeight.observe(editor.view);
    dynamicHeight.setContainerHeight(100);

    // A new line: content is taller than the WebView until native catches up.
    editor.setContentSilently(120);
    editor.wrapper.scrollTop = 20;

    expect(dynamicHeight.handleScrollToSelection()).toBe(true);
    expect(editor.wrapper.scrollTop).toBe(0);
  });

  it('suppresses selection scrolling for the first new line after a pause', () => {
    const editor = createEditor();
    const dynamicHeight = create();
    dynamicHeight.observe(editor.view);
    dynamicHeight.setContainerHeight(100);
    now += 5000;

    editor.setContentSilently(120);
    expect(dynamicHeight.handleScrollToSelection()).toBe(true);

    editor.wrapper.scrollTop = 20;
    editor.setContent(120);
    expect(editor.wrapper.scrollTop).toBe(0);
    expect(dynamicHeight.isClamped()).toBe(false);
  });

  it('detects the clamp when native stops short of the latest report', () => {
    const editor = createEditor();
    const dynamicHeight = create();
    dynamicHeight.observe(editor.view);
    dynamicHeight.setContainerHeight(100);
    now += 5000;
    editor.setContent(120);

    now += 16;
    dynamicHeight.setContainerHeight(110);

    expect(dynamicHeight.isClamped()).toBe(true);
    expect(editor.dispatch).toHaveBeenCalledWith('scroll-tr');
  });

  it('keeps following while native lags a few reports behind', () => {
    const editor = createEditor();
    const dynamicHeight = create();
    dynamicHeight.observe(editor.view);
    editor.setContent(120);
    editor.setContent(140);

    now += 100;
    dynamicHeight.setContainerHeight(120);
    editor.setContentSilently(160);

    expect(dynamicHeight.isClamped()).toBe(false);
  });

  it('scrolls normally and keeps the position when native clamps the WebView (#323)', () => {
    const editor = createEditor();
    const dynamicHeight = create();
    dynamicHeight.observe(editor.view);
    dynamicHeight.setContainerHeight(100);
    editor.setContent(150);
    now += 1000;
    dynamicHeight.setContainerHeight(120);

    expect(dynamicHeight.isClamped()).toBe(true);
    expect(dynamicHeight.handleScrollToSelection()).toBe(false);

    editor.wrapper.scrollTop = 30;
    editor.setContent(170);
    expect(editor.wrapper.scrollTop).toBe(30);
    expect(heights).toEqual([100, 150, 170]);
  });

  it('reveals the selection when the WebView becomes clamped', () => {
    const editor = createEditor();
    const dynamicHeight = create();
    dynamicHeight.observe(editor.view);
    editor.setContent(150);
    now += 1000;

    dynamicHeight.setContainerHeight(120);

    expect(editor.dispatch).toHaveBeenCalledWith('scroll-tr');
  });

  it('is not clamped once the content fits again', () => {
    const editor = createEditor();
    const dynamicHeight = create();
    dynamicHeight.observe(editor.view);
    editor.setContent(150);
    now += 1000;
    dynamicHeight.setContainerHeight(120);

    editor.setContent(110);

    expect(dynamicHeight.isClamped()).toBe(false);
  });

  it('uses the viewport height when native never sends container-height', () => {
    const editor = createEditor();
    const dynamicHeight = create();
    dynamicHeight.observe(editor.view);
    editor.setContent(150);
    now += 1000;

    editor.setViewport(150);
    expect(dynamicHeight.isClamped()).toBe(false);

    editor.setViewport(120);
    expect(dynamicHeight.isClamped()).toBe(true);
  });
});
