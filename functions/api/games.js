// Cloudflare Pages Function: GET /api/games?list=coming_soon|new_releases|top_sellers
// Pulls a Steam store list, fetches details per game, keeps only multiplayer games.

const LISTS = ["coming_soon", "new_releases", "top_sellers"];
const MODES = ["Co-op", "PvP", "MMO", "Multi-player"]; // matched against Steam category names

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const list = LISTS.includes(url.searchParams.get("list")) ? url.searchParams.get("list") : "coming_soon";

  // cache each list for 30 minutes so we stay well under Steam's rate limits
  const cache = caches.default;
  const key = new Request(`${url.origin}/api/games?list=${list}`);
  const hit = await cache.match(key);
  if (hit) return hit;

  try {
    const fc = await (await fetch("https://store.steampowered.com/api/featuredcategories?cc=us&l=english")).json();
    const ids = [...new Set((fc[list]?.items || []).map((i) => i.id))].slice(0, 40);

    const details = await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&cc=us&l=english`);
          const j = await r.json();
          return j[id]?.success ? j[id].data : null;
        } catch (e) {
          return null;
        }
      })
    );

    const games = details
      .filter((d) => d && d.type === "game")
      .map((d) => {
        const cats = (d.categories || []).map((c) => c.description);
        const modes = MODES.filter((m) => cats.some((c) => c.includes(m)));
        return {
          id: d.steam_appid,
          name: d.name,
          image: d.header_image,
          release: d.release_date?.date || "",
          comingSoon: !!d.release_date?.coming_soon,
          price: d.is_free ? "Free" : d.price_overview?.final_formatted || "TBA",
          genres: (d.genres || []).map((g) => g.description).slice(0, 3),
          modes,
        };
      })
      .filter((g) => g.modes.length);

    const res = new Response(JSON.stringify({ games }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=1800" },
    });
    await cache.put(key, res.clone());
    return res;
  } catch (e) {
    return new Response(JSON.stringify({ games: [], error: "Steam fetch failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
