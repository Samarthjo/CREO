// node scripts/scenery/back.mjs [dawn|night|both] [scale=2]
// Renders the sky, moon, stars, mountains, forest and lake: a 3D view of real terrain (USGS elevation data, see fetch-dem.mjs)
// from a boat on Jackson Lake looking south-west, ray-marched in software and anti-aliased 2x2. Takes about 8 minutes per picture.
import { spawnSync } from "node:child_process";
import { CACHE, HERE } from "./lib.mjs";

const [which = "both", ...rest] = process.argv.slice(2);
const scale = Number(Object.fromEntries(rest.map((a) => a.split("="))).scale ?? 2);
const W = 1600 * scale, H = 900 * scale;
const camera = [
  "dem=tetons", "crop=0,1000,3584,3400",
  "uCamX=1650", "uCamY=1900", `uAz=${(228 * Math.PI) / 180}`,   // where the boat is (elevation-grid pixels) and which way it looks
  "uLake=2063", "uTan=0.364", "uSnow=850", "uTree=650", "uSS=2",
];
for (const time of which === "both" ? ["dawn", "night"] : [which]) {
  const r = spawnSync("node", [`${HERE}render.mjs`, `${HERE}back.frag`, `${CACHE}out/back-${time}.png`, String(W), String(H), time === "night" ? "1" : "0", ...camera], { stdio: "inherit" });
  if (r.status) process.exit(r.status);
}
