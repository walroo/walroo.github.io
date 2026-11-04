# walroo.github.io

A minimal personal website with a purple and charcoal background, falling sakura petals, a short bio, social links, and Roblox game reflections. No site build step or runtime dependencies.

## Local preview

Run `node preview.cjs` in this directory and open http://localhost:4173. The preview includes `/api/ccu`, which reads public player counts and votes from Roblox. HTML, CSS, and JavaScript edits refresh the browser. Restart the server after editing `portfolio-data.mjs` or `ccu-worker.mjs` so the server reloads its game list. Stop it with Ctrl+C.

## Editing

- Bio and page structure: `index.html`.
- Palette, petals, and layout: `styles.css`.
- Cursor motion: `script.js`.
- Featured games and your written reflections: `portfolio-data.mjs`.
- Game rendering and player-count refresh: `games.mjs`.

CCU is the experience-wide `playing` count returned by Roblox, not a count of this website's visitors. It is requested once per minute while the page is visible. The relay caches successful responses for 60 seconds. Missing or failed counts display "Players unavailable"; a real zero displays "0 playing". Counts older than two minutes are rejected by the client.

Like ratio is likes divided by total votes, shown as a percentage with one decimal place. Zero votes display "No votes yet"; failed votes display "Likes unavailable" without hiding a valid player count.

## Hosting live player counts

The public site uses `https://realtimestats.onrender.com/api/public/portfolio-stats` on the existing game dashboard backend. It returns only public Roblox counts and votes for explicitly listed universe IDs, without dashboard login or Roblox credentials. Browser access is allowed from `https://walroo.github.io` and the local preview origins.

To add a featured game, update `portfolio-data.mjs` here and the universe ID list in `server/src/publicPortfolio.ts` in `walroo/game-dashboard`, then deploy both repositories. The dashboard caches stats for 60 seconds and briefly backs off when Roblox is unavailable.

`ccu-worker.mjs` and `wrangler.jsonc` remain an optional standalone relay; the production site does not use Cloudflare hosting. The preview server's `/api/ccu` route can still be used by temporarily setting `statsEndpoint` to `/api/ccu` for local testing.

## GitHub Pages

Publish `index.html`, `styles.css`, `script.js`, `games.mjs`, `portfolio-data.mjs`, `.nojekyll`, and `assets/` at the root of `walroo/walroo.github.io`. In Settings → Pages, select the `main` branch and `/ (root)` folder. The production stats endpoint is configured in `portfolio-data.mjs`. The preview server, relay source, tests, and Wrangler configuration are development/deployment files and are not needed in the public site output.

## Validation

Run `node --test ccu-worker.test.mjs` to check zero counts, caching, missing counts, expired-data failures, and request restrictions.

Sail For Eggs artwork comes from its public Roblox thumbnail. Contribution and reflection copy is based on walroo's notes.
