// @ts-check
import { games } from "./portfolio-data.mjs";

/** @typedef {{ universeId: number, playing: number | null, likes: number | null, dislikes: number | null }} PlayerCount */
/** @typedef {{ checkedAt: string, games: PlayerCount[] }} Stats */

/** @type {Stats | null} */
let cachedStats = null;
/** @type {number} */
let expiresAt = 0;
/** @type {Promise<Stats> | null} */
let pending = null;

export default {
  /** @param {Request} request @returns {Promise<Response>} */
  async fetch(request) {
    /** @type {string | null} */
    const origin = request.headers.get("Origin");
    /** @type {Headers} */
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Vary": "Origin",
    });
    if (origin && !["https://walroo.github.io", "http://localhost:4173", "http://127.0.0.1:4173"].includes(origin)) {
      return new Response('{"error":"Origin not allowed"}', { status: 403, headers });
    }
    if (origin) headers.set("Access-Control-Allow-Origin", origin);
    if (new URL(request.url).pathname !== "/api/ccu") {
      return new Response('{"error":"Not found"}', { status: 404, headers });
    }
    if (request.method !== "GET") {
      headers.set("Allow", "GET");
      return new Response('{"error":"Method not allowed"}', { status: 405, headers });
    }

    /** @type {number[]} */
    const ids = [...new Set(games.map((game) => game.universeId))];
    if (ids.length === 0) {
      return Response.json({ checkedAt: new Date().toISOString(), games: [] }, { headers });
    }
    if (ids.length > 50 || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      return new Response('{"error":"Invalid game configuration"}', { status: 500, headers });
    }

    try {
      if (!cachedStats || Date.now() >= expiresAt) {
        if (!pending) {
          pending = (async () => {
            const [gameResult, voteResult] = await Promise.allSettled([
              fetch(`https://games.roblox.com/v1/games?universeIds=${ids.join(",")}`, {
                headers: { Accept: "application/json" },
                signal: AbortSignal.timeout(10000),
              }),
              fetch(`https://games.roblox.com/v1/games/votes?universeIds=${ids.join(",")}`, {
                headers: { Accept: "application/json" },
                signal: AbortSignal.timeout(10000),
              }).then(async (response) => {
                if (!response.ok) throw new Error("Roblox votes unavailable");
                return response.json();
              }),
            ]);
            if (gameResult.status !== "fulfilled") throw new Error("Roblox request failed");
            /** @type {Response} */
            const response = gameResult.value;
            if (!response.ok) throw new Error("Roblox request failed");
            /** @type {{ data?: Array<{ id?: unknown, playing?: unknown }> }} */
            const payload = await response.json();
            if (!Array.isArray(payload.data)) throw new Error("Invalid Roblox response");
            /** @type {Map<number, number>} */
            const counts = new Map();
            for (const entry of payload.data) {
              if (typeof entry?.id === "number" && typeof entry.playing === "number" && Number.isSafeInteger(entry.playing) && entry.playing >= 0) {
                counts.set(entry.id, entry.playing);
              }
            }
            /** @type {Map<number, { likes: number, dislikes: number }>} */
            const votes = new Map();
            if (voteResult.status === "fulfilled") {
              /** @type {{ data?: Array<{ id?: unknown, upVotes?: unknown, downVotes?: unknown }> } | null} */
              const votePayload = voteResult.value;
              if (Array.isArray(votePayload?.data)) {
                for (const entry of votePayload.data) {
                  if (typeof entry?.id === "number" && typeof entry.upVotes === "number" && typeof entry.downVotes === "number"
                    && Number.isSafeInteger(entry.upVotes) && entry.upVotes >= 0
                    && Number.isSafeInteger(entry.downVotes) && entry.downVotes >= 0) {
                    votes.set(entry.id, { likes: entry.upVotes, dislikes: entry.downVotes });
                  }
                }
              }
            }
            /** @type {Stats} */
            const stats = {
              checkedAt: new Date().toISOString(),
              games: ids.map((id) => ({ universeId: id, playing: counts.get(id) ?? null, likes: votes.get(id)?.likes ?? null, dislikes: votes.get(id)?.dislikes ?? null })),
            };
            cachedStats = stats;
            expiresAt = Date.now() + 60000;
            return stats;
          })().finally(() => { pending = null; });
        }
        await pending;
      }
      return Response.json(cachedStats, { headers });
    } catch {
      return new Response('{"error":"Player counts unavailable"}', { status: 503, headers });
    }
  },
};
