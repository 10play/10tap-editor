import type { EditorView } from '@tiptap/pm/view';
import { describe, expect, it, vi } from 'vitest';
import { revealSelectionOnImageLoad } from '../revealSelection';

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
