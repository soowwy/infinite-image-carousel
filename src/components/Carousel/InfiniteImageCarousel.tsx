import React, { useEffect, useRef, useState, useCallback } from "react";
import { fetchImages } from "../../api/imagesApi";
import { useLazyLoadImages } from "../../hooks/useLazyLoadImages";
import "./InfiniteImageCarousel.css";

interface Image {
  id: string;
  url: string;
}

const CARD_WIDTH = 320;
const CARD_GAP = 16;
const FULL_CARD_WIDTH = CARD_WIDTH + CARD_GAP * 2;
const PAGE_SIZE = 10;
const MAX_BATCHES = 6; // keep at most 6 batches (60 images)
const INITIAL_PAGE = 50; // Start at this point in order to have images preloaded and to be able to scroll to the left

const InfiniteImageCarousel: React.FC = () => {
  const [photos, setPhotos] = useState<Image[]>([]);
  const galleryRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);
  const lastScrollX = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextScroll = useRef(false);
  const nextPageRight = useRef(INITIAL_PAGE + 1);
  const nextPageLeft = useRef(INITIAL_PAGE - 1);

  // Initialize lazy loading
  useLazyLoadImages(galleryRef.current, [photos]);

  const fetchMoreImages = async (side: "left" | "right") => {
    if (isFetching.current) return;
    isFetching.current = true;

    // Pick the page to fetch based on direction
    const page =
      side === "right" ? nextPageRight.current : nextPageLeft.current;

    const newPhotos = await fetchImages(page, PAGE_SIZE);

    // Advance cursor for next time
    if (side === "right") nextPageRight.current += 1;
    else nextPageLeft.current = Math.max(1, nextPageLeft.current - 1);

    setPhotos((prev) => {
      let updated =
        side === "right" ? [...prev, ...newPhotos] : [...newPhotos, ...prev];

      // Prune to keep 60 items max
      if (updated.length > MAX_BATCHES * PAGE_SIZE) {
        if (side === "right") {
          updated = updated.slice(PAGE_SIZE);
          requestAnimationFrame(() => {
            const el = galleryRef.current;
            if (el) el.scrollLeft -= FULL_CARD_WIDTH * PAGE_SIZE;
          });
        } else {
          updated = updated.slice(0, -PAGE_SIZE);
        }
      }
      return updated;
    });

    if (side === "left") {
      ignoreNextScroll.current = true;
      requestAnimationFrame(() => {
        const el = galleryRef.current;
        if (el) el.scrollLeft = FULL_CARD_WIDTH * (PAGE_SIZE - 1);
        ignoreNextScroll.current = false;
      });
    }

    isFetching.current = false;
  };

  const onScroll = useCallback(() => {
    if (!galleryRef.current || ignoreNextScroll.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const el = galleryRef.current!;
      const scrollX = el.scrollLeft;
      const maxScrollX = el.scrollWidth - el.clientWidth;
      const distanceRight = maxScrollX - scrollX;

      const direction = scrollX > lastScrollX.current ? "right" : "left";
      lastScrollX.current = scrollX;

      if (direction === "right" && distanceRight <= FULL_CARD_WIDTH * 2) {
        fetchMoreImages("right");
      }
      if (direction === "left" && scrollX <= FULL_CARD_WIDTH * 2) {
        fetchMoreImages("left");
      }
    }, 100);
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      const initialPhotos = await fetchImages(INITIAL_PAGE, PAGE_SIZE);
      setPhotos(initialPhotos);
    };
    loadInitial();
  }, []);

  return (
    <div className="gallery-container" ref={galleryRef} onScroll={onScroll}>
      <div className="gallery-strip">
        {photos.map((photo, idx) => (
          <div key={`${photo.id}-${idx}`} className="image-card">
            <img
              data-src={photo.url}
              alt={`Photo ${idx}`}
              className="lazy-image"
            />
            <span>{idx}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfiniteImageCarousel;
