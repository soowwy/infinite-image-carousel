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
import { useBatchSpan } from "../../hooks/useBatchSpan";
import "./InfiniteImageCarousel.scss";

// The limit of images loaded in the DOM is controlled by multiplying the PAGE_SIZE and MAX_BATCHES constants.
const PAGE_SIZE = 10;
const MAX_BATCHES = 6;
const INITIAL_PAGE = 50;

type ScrollAdjustmentState = {
  side: "left" | "right";
  isPruning: boolean;
} | null;

const InfiniteImageCarousel: React.FC = () => {
  const [photos, setPhotos] = useState<(Image & { _key: string })[]>([]);
  const [shouldAdjustScroll, setShouldAdjustScroll] =
    useState<ScrollAdjustmentState>(null);
  const [loading, setLoading] = useState(true);

  const galleryRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);
  const inFlightDir = useRef<null | "left" | "right">(null);
  const lastScrollX = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextScroll = useRef(false);
  const nextPageRight = useRef(INITIAL_PAGE + 1);
  const nextPageLeft = useRef(INITIAL_PAGE - 1);

  const measureSpan = useBatchSpan(galleryRef.current);
  useLazyLoadImages(galleryRef.current, [photos]);

  const toggleSmooth = (enable: boolean) => {
    const el = galleryRef.current;
    if (!el) return;
    if (enable) el.classList.remove("nosmooth");
    else el.classList.add("nosmooth");
  };

  const fetchMoreImages = useCallback(async (side: "left" | "right") => {
    if (isFetching.current || inFlightDir.current === side) return;
    isFetching.current = true;
    inFlightDir.current = side;

    try {
      const page =
        side === "right" ? nextPageRight.current : nextPageLeft.current;
      const batch = await fetchImages(page, PAGE_SIZE);

      if (side === "right") nextPageRight.current += 1;
      else nextPageLeft.current = Math.max(1, nextPageLeft.current - 1);

      setPhotos((prev) => {
        const withKeys = batch.map((img, i) => ({
          ...img,
          _key: `${img.id}-${page}-${i}`, // include page for stability
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

        if (didPrune || side === "left") {
          setShouldAdjustScroll({ side, isPruning: didPrune });
        }

        return updated;
      });
    } finally {
      isFetching.current = false;
      inFlightDir.current = null;
    }
  }, []);

  const onScroll = useCallback(() => {
    if (!galleryRef.current) return;
    if (ignoreNextScroll.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const el = galleryRef.current!;
      const x = el.scrollLeft;
      const maxX = el.scrollWidth - el.clientWidth;
      const distRight = maxX - x;
      const threshold = Math.max(1, measureSpan(1)) * 2; // 2 cards width
      const direction: "left" | "right" =
        x > lastScrollX.current ? "right" : "left";
      lastScrollX.current = x;

      if (direction === "right" && distRight <= threshold) {
        fetchMoreImages("right");
      }
      if (direction === "left" && x <= threshold) {
        fetchMoreImages("left");
      }
    }, 80);
  }, [measureSpan, fetchMoreImages]);

  // Synchronous scroll adjustment after photos update
  useLayoutEffect(() => {
    if (!galleryRef.current || !shouldAdjustScroll) return;
    const el = galleryRef.current;

    ignoreNextScroll.current = true;

    toggleSmooth(false);

    if (shouldAdjustScroll.side === "right" && shouldAdjustScroll.isPruning) {
      el.scrollLeft -= measureSpan(PAGE_SIZE);
    } else if (shouldAdjustScroll.side === "left") {
      el.scrollLeft += measureSpan(PAGE_SIZE);
    }

    lastScrollX.current = el.scrollLeft;

    requestAnimationFrame(() => {
      toggleSmooth(true);
      ignoreNextScroll.current = false;
    });

    setShouldAdjustScroll(null);
  }, [shouldAdjustScroll, measureSpan]);

  // Initial load
  useEffect(() => {
    const initialFetch = async () => {
      try {
        setLoading(true);
        const initial = await fetchImages(INITIAL_PAGE, PAGE_SIZE);
        setPhotos(
          initial.map((img, i) => ({
            ...img,
            _key: `${img.id}-${i}`,
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    initialFetch();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  if (loading) {
    return <div className="loading-container">Loading images...</div>;
  }

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
              onLoad={(e) => e.currentTarget.classList.add("loaded")}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfiniteImageCarousel;
