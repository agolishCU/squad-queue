export const STEAM_LISTS = ["coming_soon", "new_releases", "top_sellers"];

const MULTIPLAYER_MODES = ["Co-op", "PvP", "MMO", "Multi-player"];

export async function fetchSteamGames(list) {
  if (!STEAM_LISTS.includes(list)) throw new Error("Unsupported Steam list");

  const featuredResponse = await fetch("https://store.steampowered.com/api/featuredcategories?cc=us&l=english");
  if (!featuredResponse.ok) throw new Error("Steam featured list request failed");
  const featured = await featuredResponse.json();
  const items = featured[list]?.items;
  if (!Array.isArray(items)) throw new Error("Steam did not return the requested list");

  const ids = [...new Set(items.map((item) => item.id).filter(Boolean))].slice(0, 40);
  const details = new Array(ids.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(5, ids.length) }, async () => {
      while (next < ids.length) {
        const index = next++;
        const id = ids[index];
        try {
          const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&cc=us&l=english`);
          const result = await response.json();
          details[index] = response.ok && result[id]?.success ? result[id].data : null;
        } catch {
          details[index] = null;
        }
      }
    })
  );

  return details
    .filter((game) => game && game.type === "game")
    .map((game) => {
      const categories = (game.categories || []).map((category) => category.description);
      const modes = MULTIPLAYER_MODES.filter((mode) => categories.some((category) => category.includes(mode)));
      return {
        id: game.steam_appid,
        name: game.name,
        image: game.header_image,
        release: game.release_date?.date || "",
        comingSoon: !!game.release_date?.coming_soon,
        price: game.is_free ? "Free" : game.price_overview?.final_formatted || "TBA",
        genres: (game.genres || []).map((genre) => genre.description).slice(0, 3),
        modes,
      };
    })
    .filter((game) => game.modes.length);
}
