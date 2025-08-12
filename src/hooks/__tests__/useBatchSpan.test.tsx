import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { useRef, useEffect, useState } from "react";
import { useBatchSpan } from "../useBatchSpan";

// --- helpers only for this file ---
function mockMeasurement() {
  // Return the inline width for .image-card
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const width = this.classList.contains("image-card")
        ? parseFloat(this.style.width || "0") || 0
        : 0;
      const left = 0;
      return {
        x: left,
        y: 0,
        width,
        height: 180,
        top: 0,
        left,
        right: left + width,
        bottom: 180,
        toJSON() {},
      } as DOMRect;
    }
  );
}

function Harness() {
  const ref = useRef<HTMLDivElement>(null);
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => setEl(ref.current), []);
  const span = useBatchSpan(el); // your hook signature (container only)

  return (
    <div ref={ref}>
      <div className="gallery-strip" style={{ display: "flex", gap: "16px" }}>
        <div className="image-card" style={{ width: "300px" }} />
        <div className="image-card" style={{ width: "300px" }} />
      </div>
      <output data-testid="s">{span(1)}</output>
      <output data-testid="s3">{span(3)}</output>
    </div>
  );
}

describe("useBatchSpan", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockMeasurement();
  });

  it("returns width for one step 316)", () => {
    const { getByTestId } = render(<Harness />);
    const v = Number(getByTestId("s").textContent);
    expect(Math.round(v)).toBe(316);
  });

  it("scales linearly with count", () => {
    const { getByTestId } = render(<Harness />);
    const v3 = Number(getByTestId("s3").textContent);
    expect(Math.round(v3)).toBe(948); // 316 * 3
  });
});
