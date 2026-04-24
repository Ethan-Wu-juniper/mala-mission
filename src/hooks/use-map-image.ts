import { useEffect, useState } from "react";

const cache = new Map<string, string | null>();

export function useMapImage(mapsUrl: string | undefined): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(
    mapsUrl ? (cache.get(mapsUrl) ?? null) : null,
  );

  useEffect(() => {
    if (!mapsUrl) return;
    if (cache.has(mapsUrl)) {
      setImageUrl(cache.get(mapsUrl) ?? null);
      return;
    }

    const params = new URLSearchParams({ url: mapsUrl });
    fetch(`/api/maps-image?${params}`)
      .then((r) => r.json())
      .then(({ imageUrl: url }: { imageUrl: string | null }) => {
        cache.set(mapsUrl, url);
        setImageUrl(url);
      })
      .catch(() => {
        cache.set(mapsUrl, null);
      });
  }, [mapsUrl]);

  return imageUrl;
}
