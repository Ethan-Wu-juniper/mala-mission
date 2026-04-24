export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ imageUrl: null }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return Response.json({ imageUrl: null });
    }

    const html = await res.text();

    const match =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);

    const raw = match?.[1] ?? null;
    const imageUrl = raw ? raw.replace(/&amp;/g, "&") : null;
    return Response.json({ imageUrl });
  } catch {
    return Response.json({ imageUrl: null });
  }
}
