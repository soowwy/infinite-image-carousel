import { vi, describe, it, expect, beforeEach } from "vitest";
import { fetchImages } from "../imagesApi";

describe("fetchImages (Pexels)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("maps Pexels payload to {id,url,page}", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        photos: [
          { id: 101, src: { large: "https://img/101.jpg" } },
          { id: 102, src: { large: "https://img/102.jpg" } },
        ],
      }),
    } as any);

    const out = await fetchImages(5, 2);
    expect(out).toEqual([
      { id: "101", url: "https://img/101.jpg", page: 5 },
      { id: "102", url: "https://img/102.jpg", page: 5 },
    ]);
  });

  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as any);
    await expect(fetchImages(1, 3)).rejects.toThrow(/401/);
  });
});
