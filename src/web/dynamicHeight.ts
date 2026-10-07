import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

/**
 * Dynamic height (`useEditorBridge({dynamicHeight: true})`): the WebView is
 * sized to the editor content, so the web side reports the content height and
 * decides how to scroll.
 *
 * Native normally grows the WebView to every reported height. Until it does,
 * a new line overflows the viewport for a moment; ProseMirror and the browser
 * would scroll that transient overflow, which is the jitter of #236/#244. So
 * while native follows the reports, selection scrolling is suppressed and the
 * scroll container is kept at the top.
 *
 * When native clamps the WebView (a `maxHeight`, a fixed-height parent) the
 * content really overflows and must scroll like a normal editor, keeping its
 * scroll position (#289, #323). Native reports its height with
 * `container-height`; bundles talking to a 1.0 native side use the viewport
 * height instead.
 */

/** How long native may take to apply a reported height. */
const FOLLOW_GRACE_MS = 500;
/**
 * A `container-height` this long after a report answers it: native re-posts
 * its height once it applied a report (#323), while one that arrives sooner
 * may still describe an earlier layout.
 */
const ANSWER_MIN_MS = 200;
const TOLERANCE_PX = 1;
/**
 * Space kept below the caret when a clamped editor scrolls it into view,
 * about one line. Insets RichText applies as `editorProps` take precedence.
 */
export const CLAMPED_CARET_MARGIN = 24;
/** ProseMirror's default `scrollMargin`. */
const DEFAULT_SCROLL_MARGIN = 5;

export interface CaretRect {
  top: number;
  bottom: number;
}

export interface DynamicHeightOptions {
  /** Receives every new content height, rounded up to whole CSS pixels. */
  onHeight: (height: number) => void;
  /**
   * Receives the caret whenever the editor would scroll to its selection
   * but leaves it to native, which grows the WebView instead.
   */
  onCaret?: (rect: CaretRect) => void;
  now?: () => number;
}

interface Report {
  height: number;
  at: number;
}

type FrameHandle = ReturnType<typeof setTimeout> | number;

const requestFrame = (callback: () => void): FrameHandle =>
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(callback)
    : setTimeout(callback, 16);

const cancelFrame = (handle: FrameHandle) => {
  if (
    typeof cancelAnimationFrame === 'function' &&
    typeof handle === 'number'
  ) {
    cancelAnimationFrame(handle);
  } else {
    clearTimeout(handle);
  }
};

export const measureHeight = (element: Element): number =>
  Math.ceil(element.getBoundingClientRect().height);

/** The element that scrolls the editor: the `.dynamic-height` wrapper. */
const scrollContainerOf = (element: Element): Element | null =>
  element.closest('.dynamic-height') ??
  element.ownerDocument.scrollingElement ??
  null;

export class DynamicHeight {
  private readonly onHeight: (height: number) => void;
  private readonly onCaret: ((rect: CaretRect) => void) | undefined;
  private readonly now: () => number;
  private reports: Report[] = [];
  private containerHeight: number | null = null;
  private containerAt = -Infinity;
  private element: Element | null = null;
  /**
   * The plugin's scroll props. ProseMirror reads their sides on every
   * scroll, so they follow `observe`; unobserved they are its defaults.
   */
  readonly scrollThreshold = { top: 0, right: 0, bottom: 0, left: 0 };
  readonly scrollMargin = {
    top: DEFAULT_SCROLL_MARGIN,
    right: DEFAULT_SCROLL_MARGIN,
    bottom: DEFAULT_SCROLL_MARGIN,
    left: DEFAULT_SCROLL_MARGIN,
  };
  private view: EditorView | null = null;

  constructor({ onHeight, onCaret, now = Date.now }: DynamicHeightOptions) {
    this.onHeight = onHeight;
    this.onCaret = onCaret;
    this.now = now;
  }

  /** The height last reported to native, if any. */
  get height(): number | null {
    return this.reports[this.reports.length - 1]?.height ?? null;
  }

  /**
   * Observes the editor element and reports its height now and after every
   * resize, at most once per frame. Returns the disconnect function.
   */
  observe(view: EditorView): () => void {
    const element = view.dom;
    this.view = view;
    this.element = element;
    this.scrollThreshold.bottom = CLAMPED_CARET_MARGIN;
    this.scrollMargin.bottom = CLAMPED_CARET_MARGIN;
    let frame: FrameHandle | undefined;
    let scheduled = false;
    const measure = () => {
      scheduled = false;
      if (this.element === element) this.report(measureHeight(element));
    };
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (scheduled) return;
            scheduled = true;
            frame = requestFrame(measure);
          })
        : null;
    observer?.observe(element);
    // A detached element measures 0; the observer reports it once attached.
    if (element.isConnected) measure();
    return () => {
      observer?.disconnect();
      if (scheduled && frame !== undefined) cancelFrame(frame);
      if (this.element === element) {
        this.element = null;
        this.view = null;
        this.scrollThreshold.bottom = 0;
        this.scrollMargin.bottom = DEFAULT_SCROLL_MARGIN;
        this.reports = [];
        this.containerHeight = null;
        this.containerAt = -Infinity;
      }
    };
  }

  /**
   * Native's WebView height (`container-height`, sent after every layout and
   * once native applied a reported height). When native keeps the WebView
   * smaller than the content, the caret may have ended up below the visible
   * area, so it is scrolled back into view.
   */
  setContainerHeight(height: number): void {
    this.containerHeight = height;
    this.containerAt = this.now();
    if (this.isClamped()) this.revealSelection();
  }

  /**
   * Whether native keeps the WebView smaller than `contentHeight` (by default
   * the current content height). Native follows when the WebView matches a
   * report and every later report is recent enough for native to still be
   * catching up with it, and native has not answered it with a smaller height.
   */
  isClamped(contentHeight: number | null = this.currentHeight()): boolean {
    if (contentHeight === null) return false;
    const container = this.containerHeight ?? this.viewportHeight();
    if (container === null || container + TOLERANCE_PX >= contentHeight) {
      return false;
    }
    const since = this.now() - FOLLOW_GRACE_MS;
    for (const report of [...this.reports].reverse()) {
      if (Math.abs(report.height - container) <= TOLERANCE_PX) return false;
      if (report.at < since) return true;
      if (report.at + ANSWER_MIN_MS <= this.containerAt) return true;
    }
    return true;
  }

  /** `handleScrollToSelection` prop: true suppresses ProseMirror's scroll. */
  handleScrollToSelection(): boolean {
    if (!this.element || this.isClamped()) return false;
    this.resetScroll();
    this.reportCaret();
    return true;
  }

  /** The caret relative to the top of the document, for native to scroll to. */
  private reportCaret() {
    const view = this.view;
    if (!this.onCaret || !view || view.isDestroyed || !view.hasFocus()) return;
    try {
      const { top, bottom } = view.coordsAtPos(view.state.selection.head);
      const scrollTop = this.element
        ? (scrollContainerOf(this.element)?.scrollTop ?? 0)
        : 0;
      this.onCaret({ top: top + scrollTop, bottom: bottom + scrollTop });
    } catch {
      // No layout for the position (a detached or hidden editor).
    }
  }

  private report(height: number) {
    if (height === this.height) return;
    if (!this.isClamped(height)) this.resetScroll();
    this.reports.push({ height, at: this.now() });
    if (this.reports.length > 8) this.reports.shift();
    this.onHeight(height);
  }

  private currentHeight(): number | null {
    return this.element ? measureHeight(this.element) : this.height;
  }

  private viewportHeight(): number | null {
    const container = this.element && scrollContainerOf(this.element);
    return container ? container.clientHeight : null;
  }

  private resetScroll() {
    const container = this.element && scrollContainerOf(this.element);
    if (container && container.scrollTop !== 0) container.scrollTop = 0;
  }

  private revealSelection() {
    const view = this.view;
    if (view && !view.isDestroyed && view.hasFocus()) {
      view.dispatch(view.state.tr.scrollIntoView());
    }
  }
}

export const dynamicHeightPluginKey = new PluginKey('tentapDynamicHeight');

/**
 * Applies the scroll policy through a plugin rather than `editorProps`, so a
 * later `editor.setOptions({editorProps})` cannot drop it, while a user's own
 * `editorProps.handleScrollToSelection` still takes precedence.
 */
export function createDynamicHeightExtension(dynamicHeight: DynamicHeight) {
  return Extension.create({
    name: 'tentapDynamicHeight',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: dynamicHeightPluginKey,
          props: {
            handleScrollToSelection: () =>
              dynamicHeight.handleScrollToSelection(),
            scrollThreshold: dynamicHeight.scrollThreshold,
            scrollMargin: dynamicHeight.scrollMargin,
          },
        }),
      ];
    },
  });
}
