// src/components/__tests__/InfiniteImageCarousel.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Hoisted mock — no external refs!
vi.mock("../../api/imagesApi", () => ({
  fetchImages: vi.fn(async (_page: number, count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `init-${i}`,
      url: `https://img/init-${i}.jpg`,
      page: 42,
    }))
  ),
}));

// Import AFTER the mock so component uses it
import { fetchImages } from "../../api/imagesApi";
import InfiniteImageCarousel from "../../components/Carousel/InfiniteImageCarousel";

describe("InfiniteImageCarousel (smoke)", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // keep the module mocked, just reset call history
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the initial batch without crashing", async () => {
    const { container } = render(<InfiniteImageCarousel />);

    await waitFor(() =>
      expect(screen.queryByText(/loading images/i)).not.toBeInTheDocument()
    );

    const cards = container.querySelectorAll(".image-card");
    expect(cards.length).toBeGreaterThanOrEqual(10);

    expect(
      screen.getByRole("region", { name: /infinite image carousel/i })
    ).toBeInTheDocument();

    const imgs = container.querySelectorAll(".image-card img");
    expect(imgs.length).toBe(cards.length);
  });

  it("calls fetchImages with initial page & size and renders exactly what API returns", async () => {
    // Make FIRST call resolve 7 items regardless of requested count
    (fetchImages as unknown as any).mockResolvedValueOnce(
      Array.from({ length: 7 }, (_, i) => ({
        id: `seven-${i}`,
        url: `https://img/seven-${i}.jpg`,
        page: 999,
      }))
    );

    const { container } = render(<InfiniteImageCarousel />);

    await waitFor(() =>
      expect(screen.queryByText(/loading images/i)).not.toBeInTheDocument()
    );

    // Assert first call args (INITIAL_PAGE=50, PAGE_SIZE=10 from component)
    const calls = (fetchImages as unknown as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toBe(50);
    expect(calls[0][1]).toBe(10);

    const cards = container.querySelectorAll(".image-card");
    expect(cards.length).toBe(7);
  });
});
