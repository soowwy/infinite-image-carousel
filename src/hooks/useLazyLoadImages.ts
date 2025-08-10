import { useEffect } from "react";

export function useLazyLoadImages(
  root: HTMLElement | null,
  deps: unknown[] = []
) {
  useEffect(() => {
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const img = e.target as HTMLImageElement;
          const dataSrc = img.getAttribute("data-src");
          if (dataSrc) {
            img.src = dataSrc;
            img.removeAttribute("data-src");
          }
          obs.unobserve(img);
        }
      },
      {
        root,
        rootMargin: "200px", // start loading a bit early
        threshold: 0,
      }
    );

    root
      .querySelectorAll<HTMLImageElement>("img[data-src]")
      .forEach((img) => observer.observe(img));
    return () => observer.disconnect();
  }, [root, ...deps]);
}
