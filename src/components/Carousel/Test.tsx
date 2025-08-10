import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { fetchImages } from "../../api/imagesApi";
import type { Image } from "../../api/imagesApi";
import { useLazyLoadImages } from "../../hooks/useLazyLoadImages";
import "./InfiniteImageCarousel.css";

const PAGE_SIZE = 10;
const MAX_BATCHES = 6;
const INITIAL_PAGE = 50;

/** Measure the visual span of one item (card width + gap). */
const useItemSpan = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [span, setSpan] = useState(340);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const calc = () => {
      const strip = el.querySelector<HTMLElement>(".gallery-strip");
      const card = el.querySelector<HTMLElement>(".image-card");
      if (!strip || !card) return;
      const styles = getComputedStyle(strip);
      const gap = parseFloat(styles.columnGap || styles.gap || "0");
      setSpan(card.getBoundingClientRect().width + gap);
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    const card = el.querySelector<HTMLElement>(".image-card");
    if (card) ro.observe(card);

    return () => ro.disconnect();
  }, [containerRef]);

  return span;
};

// State to manage scroll adjustments declaratively
type ScrollAdjustmentState = {
  side: "left" | "right";
  isPruning: boolean;
} | null;

const InfiniteImageCarousel: React.FC = () => {
  const [photos, setPhotos] = useState<(Image & { _key: string })[]>([]);
  const [shouldAdjustScroll, setShouldAdjustScroll] =
    useState<ScrollAdjustmentState>(null);

  const galleryRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);
  const lastScrollX = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextScroll = useRef(false);
  const nextPageRight = useRef(INITIAL_PAGE + 1);
  const nextPageLeft = useRef(INITIAL_PAGE - 1);
  const itemSpan = useItemSpan(galleryRef);

  useLazyLoadImages(galleryRef.current, [photos]);

  const toggleSmooth = (enable: boolean) => {
    const el = galleryRef.current;
    if (!el) return;
    if (enable) el.classList.remove("nosmooth");
    else el.classList.add("nosmooth");
  };

  const fetchMoreImages = useCallback(
    async (side: "left" | "right") => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const page =
          side === "right" ? nextPageRight.current : nextPageLeft.current;
        const batch = await fetchImages(page, PAGE_SIZE);

        if (side === "right") nextPageRight.current += 1;
        else nextPageLeft.current = Math.max(1, nextPageLeft.current - 1);

        setPhotos((prev) => {
          const withKeys = batch.map((img, i) => ({
            ...img,
            _key: `${img.id}-${i}`,
          }));
          let updated =
            side === "right" ? [...prev, ...withKeys] : [...withKeys, ...prev];

          let didPrune = false;
          if (updated.length > MAX_BATCHES * PAGE_SIZE) {
            didPrune = true;
            if (side === "right") {
              updated = updated.slice(PAGE_SIZE);
            } else {
              updated = updated.slice(0, -PAGE_SIZE);
            }
          }

          if (didPrune) {
            setShouldAdjustScroll({ side, isPruning: true });
          }

          return updated;
        });
      } finally {
        isFetching.current = false;
      }
    },
    [itemSpan]
  );

  const onScroll = useCallback(() => {
    if (!galleryRef.current || ignoreNextScroll.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const el = galleryRef.current!;
      const x = el.scrollLeft;
      const maxX = el.scrollWidth - el.clientWidth;
      const distRight = maxX - x;
      const direction: "left" | "right" =
        x > lastScrollX.current ? "right" : "left";
      lastScrollX.current = x;

      if (direction === "right" && distRight <= itemSpan * 2) {
        fetchMoreImages("right");
      }
      if (direction === "left" && x <= itemSpan * 2) {
        fetchMoreImages("left");
      }
    }, 80);
  }, [itemSpan, fetchMoreImages]);

  // Use useLayoutEffect for synchronous scroll adjustments after state updates
  useLayoutEffect(() => {
    if (!galleryRef.current || !shouldAdjustScroll) return;

    const el = galleryRef.current;
    toggleSmooth(false);
    if (shouldAdjustScroll.side === "right" && shouldAdjustScroll.isPruning) {
      el.scrollLeft -= itemSpan * PAGE_SIZE;
    } else if (
      shouldAdjustScroll.side === "left" &&
      shouldAdjustScroll.isPruning
    ) {
      el.scrollLeft += itemSpan * PAGE_SIZE;
    }
    toggleSmooth(true);
    setShouldAdjustScroll(null); // Reset the state
  }, [shouldAdjustScroll, itemSpan]);

  // Initial load
  useEffect(() => {
    (async () => {
      const initial = await fetchImages(INITIAL_PAGE, PAGE_SIZE);
      setPhotos(
        initial.map((img, i) => ({
          ...img,
          _key: `${img.id}-${i}`,
        }))
      );
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <div
      className="gallery-container"
      ref={galleryRef}
      onScroll={onScroll}
      role="region"
      aria-label="Infinite image carousel"
    >
      <div className="gallery-strip">
        {photos.map((photo, idx) => (
          <div
            key={photo._key}
            className="image-card"
            aria-roledescription="slide"
            aria-label={`Image ${idx + 1}`}
          >
            <img
              data-src={photo.url}
              alt={`Random image ${idx + 1}`}
              className="lazy-image"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfiniteImageCarousel;
