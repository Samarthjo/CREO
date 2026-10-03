// Shared by the scenery scripts: where things live, and how to reach the repo's tools and a headless Chromium.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

export const HERE = fileURLToPath(new URL(".", import.meta.url));
export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const CACHE = `${HERE}.cache/`;          // elevation tiles and the full-size pictures (not committed)
export const PUBLIC = `${ROOT}public/scene/`;   // what the page loads
mkdirSync(`${CACHE}dem`, { recursive: true });
mkdirSync(`${CACHE}out/trees`, { recursive: true });
mkdirSync(`${CACHE}out/banks`, { recursive: true });
mkdirSync(`${CACHE}out/clouds`, { recursive: true });

const repo = createRequire(`${ROOT}package.json`);
export const esbuild = repo("esbuild");
export const sharp = repo("sharp");

/** Playwright is not a dependency of the site. Point PLAYWRIGHT_DIR at a node_modules that has it (default: the global one). */
export function chromium() {
  const dir = process.env.PLAYWRIGHT_DIR ?? "/opt/node22/lib/node_modules/";
  return createRequire(dir)("playwright").chromium;
}
export const CHROMIUM_PATH = process.env.CHROMIUM_PATH; // optional: a Chromium binary to use instead of Playwright's own

/** geometry.ts, compiled on the fly, so the pictures are baked from the very numbers the page uses. */
export async function loadGeometry() {
  const out = esbuild.buildSync({ entryPoints: [`${ROOT}src/components/scene/geometry.ts`], bundle: true, format: "esm", write: false });
  return import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));
}
