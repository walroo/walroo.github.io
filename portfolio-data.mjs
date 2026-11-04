// @ts-check

/**
 * @typedef {Object} PortfolioGame
 * @property {string} name
 * @property {number} placeId
 * @property {number} universeId
 * @property {string} thumbnailUrl
 * @property {string} contribution
 * @property {string} highlights
 * @property {string} improvements
 */

/** @type {PortfolioGame[]} */
export const games = [
  {
    name: "Sail For Eggs",
    placeId: 121443295737695,
    universeId: 10765629453,
    thumbnailUrl: "assets/sail-for-eggs.png",
    contribution: "I made this with my friend, with a 50/50 split between us. I worked on the coding, UI, polish, and production. Mostly, I wanted to prove to myself that I could make a Roblox game that could do well.",
    highlights: "We put a ton of effort and passion into this, and that part still matters to me.",
    improvements: "Honestly, it still feels like a trend/slop game to me. We put a lot into it, but that doesn't really change how I feel about it.",
  },
];

// Public Roblox stats served by the game dashboard backend.
/** @type {string} */
export const statsEndpoint = "https://realtimestats.onrender.com/api/public/portfolio-stats";

