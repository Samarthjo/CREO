// Bundles the scene for the look-dev lab: node scripts/layer-lab/build.mjs [--measure]
// --measure also bundles the scene alone (no lab entry) and prints its minified and gzip -9 size.
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

await build({
  entryPoints: [join(here, "entry.ts")],
  outfile: join(here, "dist/lab.js"),
  bundle: true,
  format: "esm",
  minify: true,
  target: "es2022",
  logLevel: "warning",
});
console.log("built scripts/layer-lab/dist/lab.js");

if (process.argv.includes("--measure")) {
  const r = await build({
    entryPoints: [join(root, "src/components/layer/scene/index.ts")],
    bundle: true,
    format: "esm",
    minify: true,
    target: "es2022",
    write: false,
    metafile: true,
    logLevel: "warning",
  });
  const code = r.outputFiles[0].contents;
  const gz = gzipSync(code, { level: 9 }).length;
  console.log(`scene chunk: ${(code.length / 1024).toFixed(1)} KiB minified, ${(gz / 1024).toFixed(1)} KiB gzip -9`);
  const out = Object.values(r.metafile.outputs)[0];
  const three = Object.entries(out.inputs)
    .filter(([p]) => p.includes("node_modules/three/"))
    .sort((a, b) => b[1].bytesInOutput - a[1].bytesInOutput);
  const sum = three.reduce((a, [, i]) => a + i.bytesInOutput, 0);
  console.log(`three share: ${(sum / 1024).toFixed(1)} KiB minified of ${(code.length / 1024).toFixed(1)}`);
  console.log("largest inputs:");
  for (const [p, i] of three.slice(0, 8)) console.log(`  ${(i.bytesInOutput / 1024).toFixed(1).padStart(6)} KiB  ${p.replace("node_modules/three/", "")}`);
}
