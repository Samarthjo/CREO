# Scenery

Bakes the calm scene (dawn and night) into `public/scene/*.webp`. Everything is deterministic and runs without a GPU:
shaders are rendered by a headless Chromium on its software WebGL, sprites are painted on a 2D canvas.

You need Node 22 and a Chromium that Playwright can drive (`PLAYWRIGHT_DIR` points at a `node_modules` that has `playwright`,
`CHROMIUM_PATH` at a browser binary if Playwright has none of its own). The repo's own `sharp` and `esbuild` do the rest.

```bash
# 1. terrain: open elevation data (USGS 3DEP / SRTM via the AWS terrain tiles), about 90 MB, cached in scripts/scenery/.cache
node scripts/scenery/fetch-dem.mjs tetons 43.55 -110.95 44.15 -110.35 13

# 2. the big pictures: sky, moon, stars, mountains, forest, lake (about 8 minutes each, 3200 x 1800, 2x2 anti-aliased)
node scripts/scenery/back.mjs both

# 3. the small ones: grassy banks with stones, near trees, clouds (about a minute)
node scripts/scenery/banks.mjs both
node scripts/scenery/trees.mjs both
node scripts/scenery/clouds.mjs

# 4. convert to WebP into public/scene
node scripts/scenery/pack.mjs
```

| file | what it does |
| --- | --- |
| `back.frag` | Ray-marches the elevation grid: terrain with fall-line gullies, rock, snow and forest (little conifers), soft shadows, haze, a rippled lake that mirrors everything, stars, a Milky Way, the moon. |
| `cloud.frag` | A cumulus as a lit 3D density, drawn once per seed. |
| `trees-lib.js` | Paints one tree in 3D (branches, twigs, needles; broadleaf crowns from clusters of leaves), lit from one side. |
| `banks-lib.js` | Paints a bank: ground, thousands of grass blades, flowers, faceted stones with moss and lichen, tree shadows. |
| `render.mjs` | The shader runner. `pack.mjs` the converter. `lib.mjs` shared paths and tools. |

The light comes from the left at dawn and from the right at night. Stones, banks and trees take the same direction, so the
whole scene agrees. Positions come from `src/components/scene/geometry.ts`.

## Credit

Terrain: elevation data from the U.S. Geological Survey 3D Elevation Program and NASA SRTM (public domain), served as open data
by the Mapzen/AWS terrain tiles. Used here only as the shape of the land.
