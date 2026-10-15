import type { EditorView } from '@tiptap/pm/view';

/**
 * Keeps the editor's text in place when a keyboard closes.
 *
 * A closing keyboard gives the editor more room: on Android with
 * `adjustResize` the WebView grows, and on every platform the bottom padding
 * the native side keeps under the caret while a keyboard is up is removed.
 * A document scrolled to its end then has less to scroll than its scroll
 * offset, so the browser clamps the offset and the visible text jumps down.
 *
 * The hold adds the scroll room that was lost back below the document, in the
 * same frame, so the offset stays. That room is handed back as the user
 * scrolls away from it, or a keyboard takes the space again, and never grows
 * for a document that got shorter: deleting text still scrolls as usual.
 */

/** The scrolling element, as the hold reads it. */
export interface ScrollerLike {
  scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

/** The element whose bottom padding the native side sets (`.ProseMirror`). */
export interface PaddedLike {
  style: { paddingBottom: string };
}

const px = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export class ScrollHold {
  /** Extra room below the document, in px. */
  private hold = 0;
  /** The padding the native side set, without the hold. */
  private base: number;
  /** The `paddingBottom` this hold wrote last. */
  private written: string;
  private lastTop: number;
  private lastClient: number;

  constructor(
    private readonly scroller: ScrollerLike,
    private readonly padded: PaddedLike
  ) {
    this.written = padded.style.paddingBottom;
    this.base = px(this.written);
    this.lastTop = scroller.scrollTop;
    this.lastClient = scroller.clientHeight;
  }

  /** Extra room currently held below the document. */
  get held(): number {
    return this.hold;
  }

  /** The scroller changed size (the WebView grew or shrank). */
  onResize(): void {
    const client = this.scroller.clientHeight;
    const grown = client - this.lastClient;
    this.lastClient = client;
    if (grown > 0) this.keep(grown);
    else this.trim();
  }

  /**
   * The padded element's inline style changed. A new `paddingBottom` that is
   * not this hold's own write is the native side's keyboard padding, written
   * over the held room too.
   */
  onStyleChange(): void {
    const value = this.padded.style.paddingBottom;
    if (value === this.written) return;
    const next = px(value);
    const dropped = this.base - next;
    this.base = next;
    if (dropped > 0) {
      this.keep(dropped);
    } else {
      this.write();
      this.trim();
    }
  }

  /** The user (or the selection) scrolled. */
  onScroll(): void {
    // Newer WebViews dispatch the scroll of a clamped offset before the
    // resize callback that explains it: handle that resize first.
    if (Math.abs(this.scroller.clientHeight - this.lastClient) > 0.5) {
      this.onResize();
      return;
    }
    this.trim();
    this.lastTop = this.scroller.scrollTop;
  }

  /** Puts the padding back as the native side set it. */
  release(): void {
    this.hold = 0;
    this.write();
  }

  /**
   * The closing keyboard gave the document `room` more space: hold it below
   * the document, put the offset back where it was, and hand back what that
   * offset does not need.
   */
  private keep(room: number): void {
    this.hold += room;
    this.write();
    if (Math.abs(this.scroller.scrollTop - this.lastTop) > 0.5) {
      this.scroller.scrollTop = this.lastTop;
    }
    this.trim();
    this.lastTop = this.scroller.scrollTop;
  }

  /**
   * The offset as the new layout clamps it. Chromium clamps it after
   * layout, so in a resize callback `scrollTop` can still read the offset
   * the larger scroll range allowed.
   */
  private clampedTop(): number {
    const { scrollTop, scrollHeight, clientHeight } = this.scroller;
    return Math.min(scrollTop, Math.max(0, scrollHeight - clientHeight));
  }

  /** Hands back the held room the current offset no longer needs. */
  private trim(): void {
    if (this.hold <= 0) return;
    const { scrollHeight, clientHeight } = this.scroller;
    const top = this.clampedTop();
    // At the top any scroll range keeps the offset.
    const needed =
      top > 0.5
        ? Math.max(
            0,
            Math.ceil(top + clientHeight - (scrollHeight - this.hold))
          )
        : 0;
    if (needed >= this.hold) return;
    this.hold = needed;
    this.write();
  }

  private write(): void {
    const total = this.base + this.hold;
    this.written = total > 0 ? `${total}px` : '';
    this.padded.style.paddingBottom = this.written;
  }
}

const isScrollContainer = (element: Element): boolean => {
  const { overflowY } = getComputedStyle(element);
  return overflowY === 'auto' || overflowY === 'scroll';
};

/** The element the editor scrolls in: its nearest scroll container. */
export const findScroller = (dom: HTMLElement): HTMLElement | null => {
  for (
    let element = dom.parentElement;
    element !== null && element !== document.body;
    element = element.parentElement
  ) {
    if (isScrollContainer(element)) return element;
  }
  const root = document.scrollingElement;
  return root instanceof HTMLElement ? root : null;
};

/**
 * Holds the editor's scroll offset through a closing keyboard. Returns the
 * stop function. Without `ResizeObserver` or `MutationObserver` (very old
 * WebViews) it does nothing.
 */
export function holdScrollOnKeyboardClose(view: EditorView): () => void {
  const dom = view.dom as HTMLElement;
  const scroller = findScroller(dom);
  if (
    scroller === null ||
    typeof ResizeObserver === 'undefined' ||
    typeof MutationObserver === 'undefined'
  ) {
    return () => {};
  }
  const hold = new ScrollHold(scroller, dom);
  // Both observers report after layout and before the frame is drawn, so the
  // clamped offset is restored before it is seen.
  const resizes = new ResizeObserver(() => hold.onResize());
  resizes.observe(scroller);
  const styles = new MutationObserver(() => hold.onStyleChange());
  styles.observe(dom, { attributes: true, attributeFilter: ['style'] });
  const scrollTarget: EventTarget =
    scroller === document.scrollingElement ? window : scroller;
  const onScroll = () => hold.onScroll();
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    resizes.disconnect();
    styles.disconnect();
    scrollTarget.removeEventListener('scroll', onScroll);
    if (!view.isDestroyed) hold.release();
  };
}
