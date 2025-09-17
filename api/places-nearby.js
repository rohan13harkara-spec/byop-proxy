export default async function handler(req, res) {
  // CORS (you can restrict the origin later)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { lat, lon, radius = "2000", keyword = "tourist attraction" } = req.query || {};
  if (!lat || !lon) return res.status(400).json({ error: "lat & lon are required" });

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing GOOGLE_MAPS_API_KEY" });

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lon}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("keyword", String(keyword));
  url.searchParams.set("opennow", "true");
  url.searchParams.set("key", key);

  try {
    const upstream = await fetch(url.toString());
    if (!upstream.ok) {
      const text = await upstream.text();
      throw new Error(`Upstream ${upstream.status}: ${text.slice(0, 200)}`);
    }
    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message || "Proxy failure" });
  }
}
