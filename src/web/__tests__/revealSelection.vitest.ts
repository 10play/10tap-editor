import type { EditorView } from '@tiptap/pm/view';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  revealSelectionOnImageLoad,
  revealSelectionOnViewportShrink,
} from '../revealSelection';

const createView = (focused: boolean) => {
  const dom = document.createElement('div');
  document.body.appendChild(dom);
  const dispatch = vi.fn();
  const view = {
    dom,
    isDestroyed: false,
    hasFocus: () => focused,
    state: { tr: { scrollIntoView: () => 'scroll-tr' } },
    dispatch,
  } as unknown as EditorView;
  return { dom, dispatch, view };
};

const loadImage = (dom: HTMLElement) => {
  const image = document.createElement('img');
  dom.appendChild(image);
  image.dispatchEvent(new Event('load'));
};

describe('revealSelectionOnImageLoad', () => {
  it('scrolls the selection into view when an image in a focused editor loads', () => {
    const { dom, dispatch, view } = createView(true);
    const stop = revealSelectionOnImageLoad(view);

    loadImage(dom);
    expect(dispatch).toHaveBeenCalledWith('scroll-tr');

    stop();
    loadImage(dom);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('leaves an unfocused editor alone', () => {
    const { dom, dispatch, view } = createView(false);
    revealSelectionOnImageLoad(view);

    loadImage(dom);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('revealSelectionOnViewportShrink', () => {
  const resizeTo = (height: number) => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    resizeTo(768);
  });

  const setup = (focused: boolean) => {
    const frames: (() => void)[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    resizeTo(360);
    const { dispatch, view } = createView(focused);
    const stop = revealSelectionOnViewportShrink(view);
    const flush = () => frames.splice(0).forEach((frame) => frame());
    return { dispatch, stop, flush };
  };

  it('scrolls the selection into view once a growing keyboard shrank the viewport', () => {
    const { dispatch, flush } = setup(true);

    resizeTo(320);
    resizeTo(280);
    expect(dispatch).not.toHaveBeenCalled();
    flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith('scroll-tr');
  });

  it('leaves the scroll position alone when the viewport grows', () => {
    const { dispatch, flush } = setup(true);

    resizeTo(400);
    flush();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('leaves an unfocused editor alone and stops listening', () => {
    const unfocused = setup(false);
    resizeTo(300);
    unfocused.flush();
    expect(unfocused.dispatch).not.toHaveBeenCalled();
    unfocused.stop();

    const focused = setup(true);
    focused.stop();
    resizeTo(200);
    focused.flush();
    expect(focused.dispatch).not.toHaveBeenCalled();
  });
});
