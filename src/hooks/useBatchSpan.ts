import { useCallback, useEffect, useState } from "react";

export function useBatchSpan(
  container: HTMLDivElement | null,
  gapPx: number = 16
) {
  const [itemSpan, setItemSpan] = useState<number>(0);

  useEffect(() => {
    if (!container) return;
    const card = container.querySelector<HTMLElement>(".image-card");
    if (!card) return;

    const measure = () => {
      const width = card.getBoundingClientRect().width;
      setItemSpan(width + gapPx);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [container, gapPx]);

  return useCallback((count: number) => itemSpan * count, [itemSpan]);
}
