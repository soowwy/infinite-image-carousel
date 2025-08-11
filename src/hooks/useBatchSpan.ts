// src/hooks/useBatchSpan.ts
import { useCallback } from "react";

export type SpanSide = "start" | "end";

/**
 * Precise block-span measurer for carousels with gaps & sub-pixels.
 *
 * Measures the span of a contiguous block of cards using the DOM's actual
 * layout (first.left → last.right), so it naturally includes CSS `gap`,
 * borders, and any fractional pixel rounding.
 *
 * Usage:
 *   const measureSpan = useBatchSpan(containerRef.current);
 *   const width = measureSpan("start", 10); // width of first 10 cards
 *   const width = measureSpan("end", 10);   // width of last 10 cards
 */
export function useBatchSpan(container: HTMLDivElement | null) {
  const snap = (x: number) => {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(x * dpr) / dpr;
  };

  const measure = useCallback(
    (side: SpanSide, count: number): number => {
      if (!container || count <= 0) return 0;

      // Query only within the container; cards must have the .image-card class
      const cards = container.querySelectorAll<HTMLElement>(".image-card");
      const n = cards.length;
      if (n === 0) return 0;

      if (side === "start") {
        // span = from the left edge of the first card to the right edge
        // of the Nth card (inclusive). Includes CSS `gap` and sub-pixel rounding.
        const endIndex = Math.min(count - 1, n - 1);
        const left = cards[0].getBoundingClientRect().left;
        const right = cards[endIndex].getBoundingClientRect().right;
        return snap(Math.max(0, right - left));
      } else {
        // "end": measure the last `count` cards
        const startIndex = Math.max(0, n - count);
        const left = cards[startIndex].getBoundingClientRect().left;
        const right = cards[n - 1].getBoundingClientRect().right;
        return snap(Math.max(0, right - left));
      }
    },
    [container]
  );

  return measure;
}

/**
 * Optional helper if you want to set scrollLeft with device-pixel snapping.
 * Not required by the hook; export for convenience.
 */
export function snapScrollLeft(el: HTMLElement, value: number) {
  const dpr = window.devicePixelRatio || 1;
  el.scrollLeft = Math.round(value * dpr) / dpr;
}
