# Folder: byop-proxy
# Create these files with the exact names and contents.

# 1) package.json
{
  "name": "byop-proxy",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {}
}

# 2) vercel.json  (optional, but keeps things tidy)
{
  "version": 2,
  "functions": {
    "api/places-nearby.ts": { "runtime": "nodejs18.x" }
  }
}

# 3) api/places-nearby.ts
import type { VercelRequest, VercelResponse } from 'vercel';

/**
 * BYO-P Places proxy (Vercel serverless)
 * - Hides your Google Maps key on the server
 * - Enables CORS so your app can call from web/mobile
 *
 * Query params required:
 *   lat: number   (e.g., 25.2048)
 *   lon: number   (e.g., 55.2708)
 * Optional:
 *   radius: meters (default 2000)
 *   keyword: string (default 'tourist attraction')
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (adjust origin in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lon, radius = '2000', keyword = 'tourist attraction' } = req.query as Record<string, string>;
  if (!lat || !lon) return res.status(400).json({ error: 'lat & lon are required' });

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing GOOGLE_MAPS_API_KEY' });

  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${lat},${lon}`);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('keyword', String(keyword));
  url.searchParams.set('opennow', 'true');
  url.searchParams.set('key', key);

  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`Upstream error ${resp.status}`);
    const json = await resp.json();
    return res.status(200).json(json);
  } catch (e: any) {
    return res.status(502).json({ error: e.message || 'Proxy failure' });
  }
}

# 4) README.txt  (quick instructions)
1) Create a folder named byop-proxy on your computer.
2) Inside it, create a folder named api.
3) Make three files: package.json, vercel.json, api/places-nearby.ts. Copy content from this canvas.
4) Go to https://vercel.com → New Project → Import → "Add New..." → drag & drop the folder (or connect via GitHub Desktop if you prefer).
5) In Vercel project settings → Environment Variables → add:
   - Name: GOOGLE_MAPS_API_KEY
   - Value: (your Google Maps key)
   - Environment: Production (and Preview)
6) Deploy. Your endpoint will look like:
   https://YOUR-APP-NAME.vercel.app/api/places-nearby?lat=25.2048&lon=55.2708&radius=2000&keyword=cafe
7) Copy that URL base into your mobile/web app as PROXY_URL.
