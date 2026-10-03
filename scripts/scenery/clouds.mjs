// node scripts/scenery/clouds.mjs   Bakes the five cloud pictures the calm scenes use (see BAKED in components/scene/cloud.tsx).
import { spawnSync } from "node:child_process";
import { CACHE, HERE } from "./lib.mjs";

// [time (0 dawn, 1 night), seed, how long the tail is]
const CLOUDS = [[0, 2, 0.55], [0, 7, 0.35], [0, 5, 0.6], [0, 9, 0.3], [1, 11, 0.5]];
for (const [mode, seed, wisp] of CLOUDS) {
  const time = mode ? "night" : "dawn";
  const r = spawnSync("node", [`${HERE}render.mjs`, `${HERE}cloud.frag`, `${CACHE}out/clouds/cloud-${time}-${seed}.png`, "1040", "440", String(mode), `uSeed=${seed}`, `uWisp=${wisp}`], { stdio: "inherit" });
  if (r.status) process.exit(r.status);
}
