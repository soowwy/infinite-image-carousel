import { PICSUM_BASE_URL } from "../config/endpoints";

export interface Image {
  id: string;
  url: string;
  page?: number;
}

export const fetchImages = async (
  page: number,
  count = 30
): Promise<Image[]> => {
  const controller = new AbortController();
  try {
    const res = await fetch(
      `${PICSUM_BASE_URL}/v2/list?page=${page}&limit=${count}`,
      {
        signal: controller.signal,
      }
    );
    if (!res.ok) throw new Error(`Error fetching images: ${res.status}`);
    const data = await res.json();
    return data.map((img: any) => ({
      id: String(img.id),
      url: img.download_url as string,
      page,
    }));
  } finally {
    controller.abort(); // ensure no leaked network activity
  }
};
