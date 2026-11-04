import test from "node:test";
import assert from "node:assert/strict";
import worker from "./ccu-worker.mjs";
import { games } from "./portfolio-data.mjs";

test("CCU relay preserves zero, caches results, and never serves expired counts after an error", async (context) => {
  const id = games[0].universeId;
  let clock = Date.now();
  let calls = 0;
  let upstream = { data: [{ id, playing: 0 }] };
  let failing = false;
  let votesFailing = false;
  let votes = { data: [{ id, upVotes: 90, downVotes: 10 }] };
  context.mock.method(Date, "now", () => clock);
  context.mock.method(globalThis, "fetch", async (url) => {
    calls += 1;
    if (String(url).includes("/votes?")) return votesFailing ? new Response("Unavailable", { status: 503 }) : Response.json(votes);
    return failing ? new Response("Unavailable", { status: 429 }) : Response.json(upstream);
  });
  const request = () => new Request("https://ccu.example/api/ccu", {
    headers: { Origin: "https://walroo.github.io" },
  });

  let result = await worker.fetch(request());
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("Access-Control-Allow-Origin"), "https://walroo.github.io");
  assert.deepEqual((await result.json()).games[0], { universeId: id, playing: 0, likes: 90, dislikes: 10 });
  await worker.fetch(request());
  assert.equal(calls, 2);

  clock += 61000;
  failing = true;
  result = await worker.fetch(request());
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { error: "Player counts unavailable" });

  failing = false;
  upstream = { data: [] };
  result = await worker.fetch(request());
  assert.equal((await result.json()).games[0].playing, null);

  clock += 61000;
  upstream = { data: [{ id, playing: -1 }] };
  result = await worker.fetch(request());
  assert.equal((await result.json()).games[0].playing, null);

  clock += 61000;
  upstream = { data: [{ id, playing: 5 }] };
  votesFailing = true;
  result = await worker.fetch(request());
  assert.deepEqual((await result.json()).games[0], { universeId: id, playing: 5, likes: null, dislikes: null });

  clock += 61000;
  votesFailing = false;
  votes = { data: [{ id, upVotes: 0, downVotes: 0 }] };
  result = await worker.fetch(request());
  assert.deepEqual((await result.json()).games[0], { universeId: id, playing: 5, likes: 0, dislikes: 0 });

  clock += 61000;
  votes = { data: [{ id, upVotes: -1, downVotes: 10 }] };
  result = await worker.fetch(request());
  assert.equal((await result.json()).games[0].likes, null);

  const callsBefore = calls;
  assert.equal((await worker.fetch(new Request("https://ccu.example/api/ccu", { method: "POST" }))).status, 405);
  assert.equal((await worker.fetch(new Request("https://ccu.example/other"))).status, 404);
  assert.equal((await worker.fetch(new Request("https://ccu.example/api/ccu", { headers: { Origin: "https://unrelated.example" } }))).status, 403);
  assert.equal(calls, callsBefore);
});
