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

  describe('with a bottom scroll threshold', () => {
    /**
     * A focused editor at the top of the WebView whose caret ends at
     * `caretBottom`, with the threshold native last set.
     */
    const setupWithCaret = (caretBottom: number, threshold: number) => {
      const frames: (() => void)[] = [];
      vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
        frames.push(callback);
        return frames.length;
      });
      vi.stubGlobal('cancelAnimationFrame', vi.fn());
      resizeTo(710);
      const { dispatch, view } = createView(true);
      const props = { scrollThreshold: { top: 0, bottom: threshold } };
      const caret = { bottom: caretBottom };
      Object.assign(view, {
        someProp: (name: keyof typeof props) => props[name],
        coordsAtPos: () => ({ top: caret.bottom - 20, bottom: caret.bottom }),
        state: {
          selection: { head: 1 },
          tr: { scrollIntoView: () => 'scroll-tr' },
        },
      });
      const stop = revealSelectionOnViewportShrink(view);
      const flush = () => frames.splice(0).forEach((frame) => frame());
      /** Native measured the new layout and sent its threshold. */
      const setThreshold = (bottom: number) => {
        props.scrollThreshold = { top: 0, bottom };
      };
      return { dispatch, stop, flush, setThreshold, caret };
    };

    it('keeps the text in place when a system keyboard takes the place of a custom one', () => {
      // The custom keyboard covered the bottom 279px of a 710px WebView and
      // the toolbar 56px more; the caret sits well above both.
      const { dispatch, flush, setThreshold } = setupWithCaret(105, 335);

      // The system keyboard shrinks the window by its height before native
      // measures the new layout: the old threshold would hide the caret.
      resizeTo(431);
      flush();
      expect(dispatch).not.toHaveBeenCalled();

      setThreshold(56);
      resizeTo(430);
      flush();
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('adds up the shrinks since the threshold was set', () => {
      const { dispatch, flush } = setupWithCaret(370, 335);

      resizeTo(600);
      flush();
      resizeTo(431);
      flush();

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('reveals a caret the shrink itself hid', () => {
      const { dispatch, flush } = setupWithCaret(400, 335);

      resizeTo(431);
      flush();

      expect(dispatch).toHaveBeenCalledWith('scroll-tr');
    });

    it('reveals a caret below the part the threshold left visible', () => {
      const { dispatch, flush, setThreshold, caret } = setupWithCaret(360, 335);
      resizeTo(431);
      setThreshold(56);
      flush();
      expect(dispatch).not.toHaveBeenCalled();

      // Typing moved the caret under the toolbar, then a keyboard grew.
      caret.bottom = 380;
      resizeTo(400);
      flush();
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
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
