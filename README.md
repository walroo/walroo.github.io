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

GitHub Pages cannot run the relay, and Roblox's game metadata API does not allow requests directly from arbitrary website origins. `ccu-worker.mjs` is prepared as a Cloudflare Worker; it serves only the games listed in `portfolio-data.mjs` and does not require Roblox credentials.

After choosing and signing into a Cloudflare account, deploy from this directory using Wrangler and the included `wrangler.jsonc`. Then set `statsEndpoint` in `portfolio-data.mjs` to `https://YOUR-WORKER-HOST/api/ccu`. The allowed browser origins are `https://walroo.github.io`, `http://localhost:4173`, and `http://127.0.0.1:4173`.

The relay has not been deployed. Its local endpoint works only while the preview server runs.

## GitHub Pages

Publish `index.html`, `styles.css`, `script.js`, `games.mjs`, `portfolio-data.mjs`, `.nojekyll`, and `assets/` at the root of `walroo/walroo.github.io`. In Settings → Pages, select the `main` branch and `/ (root)` folder. Set the production stats endpoint before publishing. The preview server, relay source, tests, and Wrangler configuration are development/deployment files and are not needed in the public site output.

## Validation

Run `node --test ccu-worker.test.mjs` to check zero counts, caching, missing counts, expired-data failures, and request restrictions.

Sail For Eggs artwork comes from its public Roblox thumbnail. Contribution and reflection copy is based on walroo's notes.
