# Squad Queue

Squad Queue is a small browser app for finding multiplayer Steam games. Cloudflare Pages serves the page and its `/api/games` function.

## Daily Steam scan

GitHub Actions checks Steam's featured **New Releases** list every day at 12:17 UTC, fetches details for up to 40 games, and keeps multiplayer titles in `data/new-releases.json`. When that snapshot changes, the workflow commits it to `main`; Cloudflare Pages automatically deploys the new snapshot. The app shows when the last daily scan ran.

The daily scan uses Steam's featured list, not a crawl of Steam's entire catalog. The Coming soon and Top sellers lists continue to load from Steam when requested and are cached at the edge for 30 minutes.

## Run the scanner manually

With Node.js 18 or newer and an internet connection, run:

```sh
node scripts/scrape-new-releases.mjs
```

The command replaces `data/new-releases.json`. Commit and push that file to publish the updated snapshot.
