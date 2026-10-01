// Cloudflare Pages Function: GET /api/games?list=coming_soon|new_releases|top_sellers
// Pulls a Steam store list, fetches details per game, keeps only multiplayer games.

import { fetchSteamGames, STEAM_LISTS } from "../../lib/steam.mjs";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const requestedList = url.searchParams.get("list");
  const list = STEAM_LISTS.includes(requestedList) ? requestedList : "coming_soon";

  // Cache each live list for 30 minutes to stay well under Steam's rate limits.
  const cache = caches.default;
  const key = new Request(`${url.origin}/api/games?list=${list}`);
  const hit = await cache.match(key);
  if (hit) return hit;

  try {
    const games = await fetchSteamGames(list);
    const response = new Response(JSON.stringify({ games }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=1800" },
    });
    await cache.put(key, response.clone());
    return response;
  } catch {
    return new Response(JSON.stringify({ games: [], error: "Steam fetch failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
