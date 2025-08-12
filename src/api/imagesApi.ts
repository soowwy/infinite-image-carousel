// There was a last minute change - I've replaced PICSUM with PEXELS since PICSUM's response was waaaay to slow and it was making my life miserable.
// The only thing that PEXELS required was an API KEY, generated on registration, i've added it so we dont need more registrations for now.
import { PEXELS_BASE_URL, PEXELS_KEY } from "../config/endpoints";

export interface Image {
  id: string;
  url: string;
  page?: number;
}

export const fetchImages = async (
  page: number,
  count = 30
): Promise<Image[]> => {
  try {
    const res = await fetch(
      `${PEXELS_BASE_URL}/curated?page=${page}&per_page=${count}`,
      {
        headers: {
          Authorization: PEXELS_KEY!,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Error fetching images: ${res.status}`);
    }

    const data = await res.json();

    return data.photos.map((img: any) => ({
      id: String(img.id),
      url: img.src.large as string,
      page,
    }));
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
};
