// @ts-check
import { games, statsEndpoint } from "./portfolio-data.mjs";

/** @type {HTMLElement | null} */
const section = document.getElementById("games");
/** @type {HTMLElement | null} */
const list = document.getElementById("game-list");
/** @type {HTMLTemplateElement | null} */
const template = document.querySelector("#game-template");
/** @type {Map<number, Array<{ count: HTMLElement, rating: HTMLElement }>>} */
const counters = new Map();
/** @type {Intl.NumberFormat} */
const numberFormat = new Intl.NumberFormat();
/** @type {number | undefined} */
let refreshTimer;
/** @type {AbortController | null} */
let activeRequest = null;

if (section && list && template && games.length > 0) {
  for (const game of games) {
    /** @type {DocumentFragment} */
    const card = /** @type {DocumentFragment} */ (template.content.cloneNode(true));
    /** @type {HTMLAnchorElement | null} */
    const link = card.querySelector(".game-link");
    /** @type {HTMLImageElement | null} */
    const thumbnail = card.querySelector(".game-image");
    /** @type {HTMLElement | null} */
    const name = card.querySelector(".game-name");
    /** @type {HTMLElement | null} */
    const count = card.querySelector(".game-count");
    /** @type {HTMLElement | null} */
    const rating = card.querySelector(".game-rating");
    if (!link || !thumbnail || !name || !count || !rating) continue;
    link.href = `https://www.roblox.com/games/${game.placeId}`;
    link.setAttribute("aria-label", `Play ${game.name} on Roblox`);
    thumbnail.src = game.thumbnailUrl;
    thumbnail.alt = "";
    thumbnail.hidden = !game.thumbnailUrl;
    name.textContent = game.name;
    for (const field of /** @type {const} */ (["contribution", "highlights", "improvements"])) {
      /** @type {HTMLElement | null} */
      const paragraph = card.querySelector(`[data-field="${field}"]`);
      if (paragraph) paragraph.textContent = game[field];
    }
    counters.set(game.universeId, [...(counters.get(game.universeId) ?? []), { count, rating }]);
    list.append(card);
  }
  section.hidden = false;
  void refreshCounts();
  document.addEventListener("visibilitychange", () => {
    window.clearTimeout(refreshTimer);
    if (document.hidden) activeRequest?.abort();
    else void refreshCounts();
  });
}

/** @returns {Promise<void>} */
async function refreshCounts() {
  if (document.hidden) return;
  window.clearTimeout(refreshTimer);
  activeRequest?.abort();
  /** @type {AbortController} */
  const controller = new AbortController();
  activeRequest = controller;
  /** @type {number} */
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    /** @type {Response} */
    const response = await fetch(statsEndpoint, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("Stats unavailable");
    /** @type {{ checkedAt?: unknown, games?: Array<{ universeId?: unknown, playing?: unknown, likes?: unknown, dislikes?: unknown }> }} */
    const payload = await response.json();
    if (activeRequest !== controller) return;
    if (!Array.isArray(payload.games) || typeof payload.checkedAt !== "string") throw new Error("Invalid stats");
    /** @type {number} */
    const checkedAt = Date.parse(payload.checkedAt);
    if (!Number.isFinite(checkedAt) || Math.abs(Date.now() - checkedAt) > 120000) throw new Error("Stats expired");
    for (const [id, labels] of counters) {
      const game = payload.games.find((game) => game.universeId === id);
      const playing = game?.playing;
      const likes = game?.likes;
      const dislikes = game?.dislikes;
      for (const { count: label, rating } of labels) {
        rating.removeAttribute("title");
        if (typeof likes === "number" && Number.isSafeInteger(likes) && likes >= 0
          && typeof dislikes === "number" && Number.isSafeInteger(dislikes) && dislikes >= 0) {
          const total = likes + dislikes;
          rating.textContent = total > 0 ? `${(likes / total * 100).toFixed(1)}% liked` : "No votes yet";
          rating.title = `${numberFormat.format(likes)} likes · ${numberFormat.format(dislikes)} dislikes`;
        } else {
          rating.textContent = "Likes unavailable";
        }
        if (typeof playing === "number" && Number.isSafeInteger(playing) && playing >= 0) {
          label.textContent = `${numberFormat.format(playing)} playing`;
          label.dataset.state = "live";
          label.title = `Checked ${new Date(checkedAt).toLocaleTimeString()}`;
        } else {
          label.textContent = "Players unavailable";
          label.dataset.state = "unavailable";
          label.removeAttribute("title");
        }
      }
    }
  } catch {
    if (activeRequest !== controller) return;
    for (const labels of counters.values()) {
      for (const { count: label, rating } of labels) {
        rating.textContent = "Likes unavailable";
        rating.removeAttribute("title");
        label.textContent = "Players unavailable";
        label.dataset.state = "unavailable";
        label.removeAttribute("title");
      }
    }
  } finally {
    window.clearTimeout(timeout);
    if (activeRequest === controller) {
      activeRequest = null;
      if (!document.hidden) refreshTimer = window.setTimeout(refreshCounts, 60000);
    }
  }
}

