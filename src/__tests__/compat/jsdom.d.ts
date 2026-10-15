// Minimal typings for the parts of jsdom the legacy bundle harness uses
// (jsdom ships no types and @types/jsdom is not a dependency).
declare module 'jsdom' {
  export type DOMWindow = Window & typeof globalThis;

  export class VirtualConsole {
    on(event: 'jsdomError', listener: (error: Error) => void): this;
  }

  export interface ConstructorOptions {
    url?: string;
    runScripts?: 'dangerously' | 'outside-only';
    pretendToBeVisual?: boolean;
    virtualConsole?: VirtualConsole;
    beforeParse?: (window: DOMWindow) => void;
  }

  export class JSDOM {
    constructor(html?: string, options?: ConstructorOptions);
    readonly window: DOMWindow;
  }
}
