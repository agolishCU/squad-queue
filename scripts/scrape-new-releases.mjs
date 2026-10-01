import { mkdir, writeFile } from "node:fs/promises";
import { fetchSteamGames } from "../lib/steam.mjs";

const games = await fetchSteamGames("new_releases");
const snapshot = {
  scannedAt: new Date().toISOString(),
  source: "Steam featured New Releases list",
  games,
};

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(new URL("../data/new-releases.json", import.meta.url), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Saved ${games.length} multiplayer Steam new releases at ${snapshot.scannedAt}.`);
