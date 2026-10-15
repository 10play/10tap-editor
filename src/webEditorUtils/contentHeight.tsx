import { measureHeight } from '../web/dynamicHeight';

/**
 * @deprecated Dynamic height is measured per editor by `useTenTap`. Kept for
 * deep imports; importing it no longer touches the DOM (#339).
 */
class ContentHeightListener {
  public connected = false;
  private resizeObserver: ResizeObserver | null = null;
  private currentHeight: number | null = null;

  public connect(element: Element, cb: (height: number) => void) {
    this.disconnect();
    this.connected = true;
    this.currentHeight = measureHeight(element);
    cb(this.currentHeight);
    this.resizeObserver = new ResizeObserver(() => {
      const height = measureHeight(element);
      if (height === this.currentHeight) return;
      this.currentHeight = height;
      cb(height);
    });
    this.resizeObserver.observe(element);
  }

  public disconnect() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.connected = false;
  }

  public get height() {
    return this.currentHeight;
  }
}

export const contentHeightListener = new ContentHeightListener();
