import { describe, expect, it } from 'vitest';
import { ScrollHold, type ScrollerLike } from '../scrollHold';

/**
 * A scroll container with a document of `content` px plus the editor's
 * bottom padding, which clamps its offset like a browser lays it out.
 */
const createScroller = (content: number, client: number, padding = 0) => {
  const padded = { style: { paddingBottom: padding ? `${padding}px` : '' } };
  let top = 0;
  const state = { content, client };
  const scrollHeight = () =>
    state.content + (parseFloat(padded.style.paddingBottom) || 0);
  const clamp = (value: number) =>
    Math.max(0, Math.min(value, scrollHeight() - state.client));
  const scroller: ScrollerLike = {
    get scrollTop() {
      top = clamp(top);
      return top;
    },
    set scrollTop(value: number) {
      top = clamp(value);
    },
    get scrollHeight() {
      return Math.max(scrollHeight(), state.client);
    },
    get clientHeight() {
      return state.client;
    },
  };
  return { scroller, padded, state };
};

describe('ScrollHold', () => {
  // Galaxy Note 9, Android 10, adjustResize, in CSS px: a 30 line document
  // scrolled to its end above the toolbar and the keyboard, with the
  // keyboard padding under the caret.
  const setup = () => {
    const t = createScroller(1300, 330, 24);
    t.scroller.scrollTop = 10_000;
    const hold = new ScrollHold(t.scroller, t.padded);
    return { ...t, hold, top: t.scroller.scrollTop };
  };

  it('keeps the text in place when the WebView grows as the keyboard closes', () => {
    const { scroller, state, hold, top } = setup();
    expect(top).toBe(994);
    state.client = 700;
    hold.onResize();
    expect(scroller.scrollTop).toBe(top);
    expect(hold.held).toBe(370);
  });

  it('keeps the text in place when the keyboard padding is removed', () => {
    const { scroller, padded, hold, top } = setup();
    padded.style.paddingBottom = '';
    hold.onStyleChange();
    expect(scroller.scrollTop).toBe(top);
    expect(hold.held).toBe(24);
    expect(padded.style.paddingBottom).toBe('24px');
  });

  it('keeps it through both, in either order', () => {
    const { scroller, padded, state, hold, top } = setup();
    state.client = 700;
    hold.onResize();
    padded.style.paddingBottom = '';
    hold.onStyleChange();
    expect(scroller.scrollTop).toBe(top);
    expect(hold.held).toBe(394);
  });

  it('restores the held room the native padding write replaced, even after a layout', () => {
    const { scroller, padded, state, hold, top } = setup();
    state.client = 700;
    hold.onResize();
    // The native script sets the whole padding, held room included, and a
    // layout runs before the observer.
    padded.style.paddingBottom = '';
    expect(scroller.scrollTop).toBe(600);
    hold.onStyleChange();
    expect(scroller.scrollTop).toBe(top);
    expect(padded.style.paddingBottom).toBe('394px');
  });

  it('hands the room back as the user scrolls up, and never takes it again', () => {
    const { scroller, padded, state, hold, top } = setup();
    state.client = 700;
    hold.onResize();
    padded.style.paddingBottom = '';
    hold.onStyleChange();
    scroller.scrollTop = top - 100;
    hold.onScroll();
    expect(hold.held).toBe(294);
    scroller.scrollTop = 0;
    hold.onScroll();
    expect(hold.held).toBe(0);
    expect(padded.style.paddingBottom).toBe('');
    scroller.scrollTop = 10_000;
    hold.onScroll();
    expect(scroller.scrollTop).toBe(600);
  });

  it('gives the room back to a keyboard that comes back', () => {
    const { scroller, padded, state, hold, top } = setup();
    state.client = 700;
    hold.onResize();
    state.client = 330;
    hold.onResize();
    expect(hold.held).toBe(0);
    padded.style.paddingBottom = '24px';
    hold.onStyleChange();
    expect(scroller.scrollTop).toBe(top);
  });

  it('lets a document that got shorter scroll as usual', () => {
    const { scroller, state, hold } = setup();
    state.content = 600;
    hold.onScroll();
    expect(scroller.scrollTop).toBe(294);
    expect(hold.held).toBe(0);
  });

  it('leaves a document that fits alone', () => {
    const t = createScroller(200, 330, 24);
    const hold = new ScrollHold(t.scroller, t.padded);
    t.state.client = 700;
    hold.onResize();
    t.padded.style.paddingBottom = '';
    hold.onStyleChange();
    expect(hold.held).toBe(0);
    expect(t.padded.style.paddingBottom).toBe('');
  });

  it('restores the native padding on release', () => {
    const { padded, state, hold } = setup();
    state.client = 700;
    hold.onResize();
    hold.release();
    expect(padded.style.paddingBottom).toBe('24px');
  });
});

describe('ScrollHold with a lazily clamped offset', () => {
  it('holds the offset that Chromium has not clamped yet in the resize callback', () => {
    // Android System WebView: the scroll range shrinks with the layout, but
    // `scrollTop` keeps the old offset until after the resize callbacks.
    const padded = { style: { paddingBottom: '24px' } };
    const state = { content: 1240, client: 379, top: 885 };
    const scroller: ScrollerLike = {
      get scrollTop() {
        return state.top;
      },
      set scrollTop(value: number) {
        state.top = Math.max(
          0,
          Math.min(value, this.scrollHeight - state.client)
        );
      },
      get scrollHeight() {
        return state.content + (parseFloat(padded.style.paddingBottom) || 0);
      },
      get clientHeight() {
        return state.client;
      },
    };
    const hold = new ScrollHold(scroller, padded);
    state.client = 706;
    hold.onResize();
    expect(hold.held).toBe(327);
    expect(state.top).toBe(885);
  });
});

describe('ScrollHold when the clamp is reported before the resize', () => {
  it('restores the offset from the scroll event of the clamp', () => {
    // Android 14 WebView: the clamped offset's scroll event comes first.
    const t = createScroller(1300, 330, 24);
    t.scroller.scrollTop = 10_000;
    const hold = new ScrollHold(t.scroller, t.padded);
    t.state.client = 700;
    expect(t.scroller.scrollTop).toBe(624);
    hold.onScroll();
    expect(t.scroller.scrollTop).toBe(994);
    hold.onResize();
    expect(t.scroller.scrollTop).toBe(994);
    expect(hold.held).toBe(370);
  });
});
