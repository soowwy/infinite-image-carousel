import "@testing-library/jest-dom";

const g = globalThis as any;

class MockIntersectionObserver {
  private _cb: any;
  constructor(cb: any) {
    this._cb = cb;
  }
  observe(target: Element) {
    // Immediately “intersect”
    this._cb([{ target, isIntersecting: true }], this);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
class MockResizeObserver {
  constructor(_cb: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

g.IntersectionObserver = MockIntersectionObserver;
g.ResizeObserver = MockResizeObserver;

g.requestAnimationFrame =
  g.requestAnimationFrame ||
  ((cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0));
g.cancelAnimationFrame =
  g.cancelAnimationFrame || ((id: number) => clearTimeout(id as any));

if (
  !Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollLeft")?.set
) {
  Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
    configurable: true,
    get() {
      return (this as any)._scrollLeft ?? 0;
    },
    set(v: number) {
      (this as any)._scrollLeft = v;
    },
  });
}
