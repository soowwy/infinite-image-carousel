import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { useRef, useEffect, useState } from "react";
import { useLazyLoadImages } from "../useLazyLoadImages";

// Mock IO with a capturable instance
class MockIO {
  static cb: IntersectionObserverCallback;
  static last: MockIO | undefined;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(cb: IntersectionObserverCallback) {
    MockIO.cb = cb;
    MockIO.last = this;
  }
}
vi.stubGlobal(
  "IntersectionObserver",
  MockIO as unknown as typeof IntersectionObserver
);

describe("useLazyLoadImages", () => {
  let rootEl: HTMLElement;

  beforeEach(() => {
    rootEl = document.createElement("div");
    document.body.appendChild(rootEl);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  // Harness that passes a non-null root *after* mount
  function Harness() {
    const ref = useRef<HTMLDivElement>(null);
    const [root, setRoot] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
      setRoot(ref.current); // triggers effect in the hook with a real element
    }, []);

    useLazyLoadImages(root);

    return (
      <div ref={ref}>
        <img data-src="https://example.com/pic.jpg" alt="lazy" />
      </div>
    );
  }

  it("loads img src and removes data-src when intersecting", () => {
    const { container } = render(<Harness />, { container: rootEl });

    // IO must have been created now
    expect(MockIO.last).toBeDefined();

    const img = container.querySelector("img")!;
    // observed by IO
    expect(MockIO.last!.observe).toHaveBeenCalledWith(img);

    // simulate intersection
    MockIO.cb(
      [{ target: img, isIntersecting: true } as any],
      MockIO.last as any
    );

    // img should be swapped to real src and data-src removed
    expect(img.getAttribute("data-src")).toBeNull();
    expect(img.getAttribute("src")).toBe("https://example.com/pic.jpg");

    // unobserve after load
    expect(MockIO.last!.unobserve).toHaveBeenCalledWith(img);
  });

  it("disconnects observer on unmount", () => {
    const { unmount } = render(<Harness />, { container: rootEl });
    // IO created?
    expect(MockIO.last).toBeDefined();

    unmount();
    expect(MockIO.last!.disconnect).toHaveBeenCalled();
  });
});
