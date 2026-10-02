import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  FogExp2,
  Group,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SpotLight,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import type { Material, Object3D, Texture } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { layerBus } from "../bus";
import type { AnchorId } from "../bus";
import { makeStudioEnv } from "./env";
import { createFloor } from "./floor";
import { paneGeometries } from "./glass";
import { LAYOUTS } from "./layout";
import { buildNetwork } from "./network";
import { etchMaps, LIME, loadFonts, softBlob } from "./paint";
import { backdropFragment, backdropVertex, finishShader, GROUND_HEX, overlayFragment, overlayVertex, quadFragment, quadVertex } from "./shaders";
import { buildTiles } from "./tiles";
import type { AnchorMap, LayerScene, LayerSceneOptions } from "./types";
import { clamp, damp, easeInOut, lerp, rng, smooth } from "./util";

export type { AnchorMap, LayerScene, LayerSceneOptions, SceneSample } from "./types";

const AUTO_DELAY = 0.35; // seconds after the first frame
const AUTO_SECONDS = 3;
const PAYOFF_SECONDS = 1.6; // after the scan: the performance tile rises and its pool of light comes up
const IDLE_FRAME_MS = 33; // idle motion redraws at about 30 fps
const IDLE_UNTIL = 0.15; // and only while the hero is the page
const HERO_IDS: Exclude<AnchorId, "mark">[] = ["content", "audience", "trends", "deals", "perf"];
/** The signal each story beat is about, in beat order: Sees, Knows you, Creates, Monetizes, Learns. The light bar parks on it. */
const BEAT_FOCUS: Exclude<AnchorId, "mark">[] = ["trends", "audience", "content", "deals", "perf"];
/** Multisample the composer target at 4x up to this many pixels, then at 2x: a 4K canvas would need a few hundred MB at 4x. */
const MSAA4_MAX_PX = 4e6;
/** Share of the canvas the transmission pass may use, by pixels: full-ish on a laptop, less on a big screen. */
const transmissionScale = (px: number) => clamp(2.4e6 / px, 0.5, 0.85);

/**
 * three keeps one module-level DFG lookup texture for every physical material and registers a "dispose" listener on it
 * for each renderer that uploads it. The listener closes over that renderer's whole texture state, so the texture (which
 * lives as long as the page) keeps every renderer, its WebGL context and its canvas alive after renderer.dispose().
 * Disposing the shared texture while its material is still known to the renderer removes the listener.
 */
function releaseSharedLut(renderer: WebGLRenderer, material: Material) {
  const uniforms = (renderer.properties.get(material) as { uniforms?: Record<string, { value?: { dispose?: () => void } | null } | undefined> }).uniforms;
  uniforms?.dfgLUT?.value?.dispose?.();
}

/**
 * How far the scene has faded to the ground colour at story progress p: clear through the Monetizes beat and the start of
 * Learns (which begins at 0.825), gone when the page's loop stops drawing. FADE_END must not be later than the progress at
 * which loop.ts stops (CTA_PROGRESS, 0.92): the last frame the loop draws stays on screen. When the loop is changed to run
 * to the end of the story, or to stop on scene.settled(), set FADE_START 0.86 and FADE_END 1 so the whole Learns beat
 * keeps the glass and the brightening network.
 */
const FADE_START = 0.83;
const FADE_END = 0.92;
const fadeAt = (p: number) => smooth(FADE_START, FADE_END, p);
const GLASS_DEPTH = 0.08;
const BEVEL = 0.085;

/**
 * "The Layer": a dark studio with the creator's sample signals lying on an obsidian floor and one clear pane hanging
 * in front of them, etched with the CREO mark and the Creator DNA network. Vanilla three, no React. The caller owns the
 * rAF loop and the canvas size; the scene reads layerBus once per frame.
 */
export async function createLayerScene(opts: LayerSceneOptions): Promise<LayerScene> {
  const { canvas, variant, sample, onAnchors, still } = opts;
  let tier = opts.tier;
  const layout = LAYOUTS[variant];
  await loadFonts(sample);

  // powerPreference stays at the default: "high-performance" wakes the discrete GPU of a dual-GPU laptop for a landing page
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!still, stencil: false });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.transmissionResolutionScale = still ? 1 : 0.85;
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new Scene();
  scene.fog = new FogExp2(GROUND_HEX, 0.032);
  const envTex = makeStudioEnv();
  const camera = new PerspectiveCamera(layout.cam.fov, 1, 0.1, 120);

  const disposables: { dispose(): void }[] = [envTex];
  const own = <T extends { dispose(): void }>(o: T): T => (disposables.push(o), o);

  // ---- floor and tiles
  const glow = { col: new Color(0.012, 0.021, 0.03), at: new Vector4(...layout.glow) };
  const floor = own(createFloor(glow));
  scene.add(floor.mesh);
  floor.material.uniforms.uQuiet!.value.set(...layout.quiet);
  floor.material.uniforms.uGlassX!.value = layout.glass.x;
  const built = buildTiles(layout, sample, aniso, envTex);
  disposables.push(built);
  scene.add(built.root);
  const tiles = built.tiles;
  const heroes = HERO_IDS.map((id) => tiles.find((t) => t.spec.id === id)!);
  const perf = heroes[HERO_IDS.indexOf("perf")]!;
  const focusAt = BEAT_FOCUS.map((id) => HERO_IDS.indexOf(id));

  // ---- a few dozen motes of light in the air: scale and parallax, nothing animated
  {
    const r = rng(31);
    const n = 64;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const span = variant === "wide" ? 15 : 7;
    for (let i = 0; i < n; i++) {
      pos.set([(r() - 0.5) * span, 0.9 + r() * 2, -4.5 + r() * 7.5], i * 3);
      const k = 0.1 + r() * 0.35;
      const lime = r() < 0.25;
      col.set(lime ? [k * 0.78, k, k * 0.24] : [k * 0.85, k * 0.95, k], i * 3);
    }
    const geo = own(new BufferGeometry());
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new Float32BufferAttribute(col, 3));
    const mat = own(new PointsMaterial({ map: own(softBlob()), size: 0.05, vertexColors: true, blending: AdditiveBlending, depthWrite: false }));
    scene.add(new Points(geo, mat));
  }

  // ---- lights: one cool key, one lime rim, no ambient wash (the strip-light environment does the rest)
  const key = new SpotLight(0xdfe8ff, 150, 40, 0.5, 0.95, 1.3);
  key.position.set(-5, 9, 5);
  key.target.position.set(0, 0, -0.5);
  const rimA = new PointLight(LIME, 16, 12, 1.8);
  rimA.position.set(5.6, 0.7, -2.6);
  const rimB = new PointLight(LIME, 8, 10, 1.9);
  rimB.position.set(-5.2, 0.6, -2.4);
  scene.add(key, key.target, rimA, rimB);

  // ---- the glass
  const g = layout.glass;
  const glass = new Group();
  glass.position.set(g.x, g.y, g.z);
  glass.rotation.set(g.rx, g.ry, 0, "YXZ");
  scene.add(glass);
  const { cap, rim, faceZ } = paneGeometries(g.w, g.h, g.r, GLASS_DEPTH, BEVEL, BEVEL);
  disposables.push(cap, rim);

  // seat the camera at its start pose so projections below match the first frame
  camera.position.set(...layout.cam.pos);
  camera.lookAt(...layout.cam.look);
  camera.updateMatrixWorld();
  scene.updateMatrixWorld();

  // network nodes: where each signal sits when seen through the pane from the start camera
  const heroPts = heroes.map((t) => {
    const p = new Vector3(0, t.spec.h * 0.5, 0.03);
    t.group.localToWorld(p);
    const dir = p.clone().sub(camera.position).normalize();
    const origin = glass.localToWorld(new Vector3(0, 0, faceZ));
    const n = new Vector3(0, 0, 1).transformDirection(glass.matrixWorld);
    const t0 = origin.clone().sub(camera.position).dot(n) / dir.dot(n);
    const hit = glass.worldToLocal(camera.position.clone().addScaledVector(dir, t0));
    return { x: clamp(hit.x, -g.w / 2 + 0.35, g.w / 2 - 0.35), y: clamp(hit.y, -g.h / 2 + 0.3, g.h / 2 - 0.3) };
  });
  const markScale = variant === "wide" ? 0.64 : 0.62;
  const markHalf = { x: markScale * 1.6, y: markScale * 0.55 };
  const net = buildNetwork(g.w, g.h, heroPts, { x: 0, y: layout.markY }, markHalf, rng(7));
  const ppu = variant === "wide" ? 400 : 480;
  const etch = etchMaps({ w: g.w, h: g.h, ppu, nodes: net.nodes, links: net.links, markScale, markY: layout.markY });
  etch.overlay.anisotropy = aniso;
  etch.rough.anisotropy = aniso;
  disposables.push(etch.overlay, etch.rough);

  // tier 3: transmission glass. Roughness comes from the etch map, so the mark and network frost what is behind them.
  const glass3 = new Group();
  const m3 = own(
    new MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 1,
      roughnessMap: etch.rough,
      transmission: 1,
      thickness: 1.4,
      ior: 1.5,
      dispersion: 0.4,
      attenuationColor: new Color(0xf2f6ff),
      attenuationDistance: 20,
      envMap: envTex,
      specularIntensity: 0.6,
      envMapIntensity: 0.45,
    }),
  );
  glass3.add(new Mesh(cap, m3), new Mesh(rim, m3));
  // tier 2: faux glass. A faint dark tint, plus the environment reflection added on top.
  const glass2 = new Group();
  const tint = own(new MeshBasicMaterial({ color: 0x0b1308, transparent: true, opacity: 0.2, depthWrite: false, fog: false }));
  const sheen = own(
    new MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.14, clearcoat: 0.5, clearcoatRoughness: 0.05, transparent: true, blending: AdditiveBlending, depthWrite: false, envMap: envTex, envMapIntensity: 0.4 }),
  );
  glass2.add(new Mesh(cap, tint), new Mesh(rim, tint), new Mesh(cap, sheen), new Mesh(rim, sheen));
  glass.add(glass3, glass2);

  const overlayMat = own(
    new ShaderMaterial({
      uniforms: {
        tEtch: { value: etch.overlay as Texture },
        uSize: { value: new Vector2(g.w, g.h) },
        uR: { value: g.r },
        uBevel: { value: BEVEL },
        uMem: { value: 0 },
        uSweep: { value: 0 },
        uAmt: { value: 0 },
        uEdge: { value: 1 },
        uStreak: { value: 0 },
        uLime: { value: new Color(LIME) },
      },
      vertexShader: overlayVertex,
      fragmentShader: overlayFragment,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  const overlay = new Mesh(own(new PlaneGeometry(g.w + 2 * BEVEL, g.h + 2 * BEVEL)), overlayMat);
  overlay.position.z = faceZ + 0.003;
  overlay.renderOrder = 5;
  glass.add(overlay);

  // ---- finish: the frame fades to the ground colour at its edges and, at the end of the story, everywhere
  const quadGeo = new BufferGeometry();
  quadGeo.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const backdropMat = own(
    new ShaderMaterial({
      uniforms: { uGroundLinear: { value: new Color(GROUND_HEX) }, uGlowCol: { value: glow.col }, uGlowAt: { value: glow.at } },
      vertexShader: backdropVertex,
      fragmentShader: backdropFragment,
      depthTest: false,
      depthWrite: false,
      fog: false,
    }),
  );
  const backdrop = new Mesh(quadGeo, backdropMat);
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  scene.add(backdrop);
  const quadMat = own(
    new ShaderMaterial({
      uniforms: { uFade: { value: 0 }, uGroundLinear: { value: new Color(GROUND_HEX) } },
      vertexShader: quadVertex,
      fragmentShader: quadFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
  );
  const quad = new Mesh(own(quadGeo), quadMat);
  quad.frustumCulled = false;
  quad.renderOrder = 1000;
  scene.add(quad);

  let composer: EffectComposer | null = null;
  let finishPass: ShaderPass | null = null;
  function disposeComposer() {
    if (!composer) return;
    for (const pass of composer.passes) pass.dispose();
    composer.dispose();
    composer = null;
    finishPass = null;
  }
  function ensureComposer() {
    if (composer) return;
    const size = renderer.getSize(new Vector2());
    const dpr = renderer.getPixelRatio();
    const rt = new WebGLRenderTarget(Math.max(2, size.x * dpr), Math.max(2, size.y * dpr), { type: HalfFloatType, samples: size.x * size.y * dpr * dpr > MSAA4_MAX_PX ? 2 : 4 });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(dpr);
    composer.setSize(size.x, size.y);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new Vector2(size.x, size.y), 0.22, 0.45, 1));
    composer.addPass(new OutputPass());
    finishPass = new ShaderPass(finishShader);
    finishPass.uniforms.uGround!.value = new Vector3(7 / 255, 8 / 255, 11 / 255);
    composer.addPass(finishPass);
  }

  // ---- per-frame state
  let cssW = 1;
  let cssH = 1;
  let dpr = 1;
  let dirty = true;
  let first = true;
  let lastT = -1;
  let t0 = -1;
  let prog = 0;
  let mem = 0;
  let par = 0;
  let sweepX = 0;
  let amt = 0;
  let usedPointer = false;
  let lastFade = -1;
  let settled = false;
  let lastDraw = -1e9;
  let lastBeat = -9;
  let pulse = 0;
  let idleOn = false;
  let lastIn = { p: -1, b: -9, x: NaN };
  const reported: Partial<AnchorMap> = {};
  const v = new Vector3();
  const ndcX: number[] = [0, 0, 0, 0, 0];
  const ndcLR = { l: -0.5, r: 0.5 };
  const anchors = {} as AnchorMap;
  const limeC = new Color(LIME);

  const memOf = (b: number) => (clamp(b, -1, 4) + 1) / 5;

  function applyTier() {
    const t3 = tier === "t3";
    glass3.visible = t3;
    glass2.visible = !t3;
    quad.visible = !t3;
    floor.material.uniforms.uTaps!.value = t3 ? 3 : 1;
    floor.material.uniforms.uDither!.value = t3 ? 0 : 1;
    if (t3) ensureComposer();
    else disposeComposer();
    sizeFloor();
    dirty = true;
  }

  function sizeFloor() {
    const s = tier === "t3" ? 0.5 : 0.33;
    floor.setSize(Math.round(cssW * dpr * s), Math.round(cssH * dpr * s));
    floor.material.uniforms.uRes!.value.set(cssW * dpr, cssH * dpr);
  }

  /** The camera: the hero pose, then the story's opening pose by e (the first screen of scroll), then the end pose by d (the beats). */
  function pose(e: number, d: number, px: number) {
    const a = layout.cam;
    const b = layout.cam1;
    const c = layout.cam2;
    const at = (k: "pos" | "look", i: number) => lerp(lerp(a[k][i]!, b[k][i]!, e), c[k][i]!, d);
    camera.position.set(at("pos", 0) + px, at("pos", 1), at("pos", 2));
    camera.fov = lerp(lerp(a.fov, b.fov, e), c.fov, d);
    camera.lookAt(at("look", 0), at("look", 1), at("look", 2));
    camera.updateProjectionMatrix();
    const s = layout.glass1;
    glass.rotation.set(lerp(g.rx, s.rx, e), lerp(g.ry, s.ry, e), 0, "YXZ");
    glass.scale.setScalar(lerp(1, s.scale, e));
    camera.updateMatrixWorld();
    scene.updateMatrixWorld();
  }

  function project(o: Object3D, x: number, y: number, z: number) {
    v.set(x, y, z);
    o.localToWorld(v);
    v.project(camera);
    return v;
  }

  function measure() {
    heroes.forEach((t, i) => {
      const p = project(t.group, 0, t.spec.h / 2, 0.03);
      ndcX[i] = p.x;
      anchors[t.spec.id!] = { x: (p.x * 0.5 + 0.5) * 100, y: (0.5 - p.y * 0.5) * 100 };
    });
    const m = project(glass, 0, layout.markY, 0);
    anchors.mark = { x: (m.x * 0.5 + 0.5) * 100, y: (0.5 - m.y * 0.5) * 100 };
    ndcLR.l = project(glass, -g.w / 2, 0, faceZ).x;
    ndcLR.r = project(glass, g.w / 2, 0, faceZ).x;
  }

  const toNdc = (local: number) => lerp(ndcLR.l, ndcLR.r, (local + g.w / 2) / g.w);

  function report() {
    let moved = false;
    for (const id of [...HERO_IDS, "mark"] as AnchorId[]) {
      const a = anchors[id];
      const p = reported[id];
      if (!p || Math.abs(p.x - a.x) > 0.05 || Math.abs(p.y - a.y) > 0.05) moved = true;
    }
    if (!moved) return;
    for (const id of [...HERO_IDS, "mark"] as AnchorId[]) reported[id] = { ...anchors[id] };
    onAnchors({ ...(reported as AnchorMap) });
  }

  function step(timeMs: number): { animating: boolean; fade: number } {
    const dt = lastT < 0 || still ? 0 : clamp((timeMs - lastT) / 1000, 0, 0.1);
    lastT = timeMs;
    if (t0 < 0) t0 = timeMs;
    const elapsed = (timeMs - t0) / 1000;
    let animating = false;

    // progress and memory ease toward the bus values
    const tProg = clamp(still ? (still.progress ?? 0) : layerBus.progress);
    const tMem = memOf(layerBus.beat);
    if (still || first) {
      prog = tProg;
      mem = tMem;
    } else {
      prog = damp(prog, tProg, 7, dt);
      mem = damp(mem, tMem, 3.2, dt);
      if (Math.abs(prog - tProg) < 4e-4) prog = tProg;
      else animating = true;
      if (Math.abs(mem - tMem) < 2e-3) mem = tMem;
      else animating = true;
    }

    const e = smooth(0, 0.15, prog);
    const d = smooth(0.15, 0.9, prog);
    // a little parallax follows the pointer, so the pane slides over the tiles behind it
    const parT = still || !layerBus.pointer ? 0 : layerBus.pointer.x * 0.3;
    if (still || first) par = parT;
    else {
      par = damp(par, parT, 5, dt);
      if (Math.abs(par - parT) < 1e-3) par = parT;
      else animating = true;
    }
    // idle motion (t3 only, never in stills or with reduced motion): the camera drifts a few centimetres and the light
    // streak breathes, so the hero is not a still image once the first scan is over. It fades out as the page scrolls,
    // so every scroll pose stays the same.
    idleOn = tier === "t3" && !still && !reduce && prog < IDLE_UNTIL;
    const idle = idleOn ? 1 - e : 0;
    // the payoff: once the scan has read every signal, the performance tile (the "next best move") rises into its own light
    const payoffK = still || reduce ? 0 : smooth(AUTO_DELAY + AUTO_SECONDS, AUTO_DELAY + AUTO_SECONDS + PAYOFF_SECONDS, elapsed) * (1 - e);
    if (!still && !reduce && elapsed < AUTO_DELAY + AUTO_SECONDS + PAYOFF_SECONDS) animating = true;
    perf.group.position.y = perf.baseY + 0.2 * payoffK;
    pose(e, d, par + idle * 0.2 * Math.sin(elapsed * 0.4));
    measure();

    // the light bar: a fixed position for stills, the pointer, or the one automatic scan
    const ptr = still ? null : layerBus.pointer;
    const edge = g.w / 2 + 0.4;
    // in the story the bar parks on the signal the current beat is about, and flares when the beat changes
    const beat = layerBus.beat;
    const focus = beat >= 0 && e > 0.6 ? focusAt[Math.min(4, beat)]! : -1;
    if (beat !== lastBeat) {
      if (focus >= 0 && lastBeat !== -9 && !still) pulse = 1;
      lastBeat = beat;
    }
    if (focus >= 0) {
      const n = heroPts[focus]!;
      const tx = clamp(n.x + n.y * 0.16, -edge, edge);
      if (still || first) {
        sweepX = tx;
        amt = 0.7;
      } else {
        sweepX = damp(sweepX, tx, 5, dt);
        pulse = damp(pulse, 0, 1.8, dt);
        const want = 0.55 + 0.45 * pulse;
        amt = damp(amt, want, 6, dt);
        if (Math.abs(sweepX - tx) > 2e-3 || Math.abs(amt - want) > 4e-3) animating = true;
      }
    } else if (still) {
      sweepX = lerp(-g.w / 2, g.w / 2, still.sweep ?? 0.5);
      amt = still.sweep === undefined ? 0 : 1;
    } else if (ptr) {
      usedPointer = true;
      const s = (ptr.x - ndcLR.l) / (ndcLR.r - ndcLR.l);
      const x = lerp(-g.w / 2, g.w / 2, s);
      sweepX = damp(sweepX, clamp(x, -edge, edge), 16, dt);
      const want = 1 - smooth(g.w / 2 + 0.3, g.w / 2 + 1.4, Math.abs(x));
      amt = damp(amt, want, 12, dt);
      if (Math.abs(amt - want) > 4e-3 || Math.abs(sweepX - clamp(x, -edge, edge)) > 2e-3) animating = true;
    } else if (!usedPointer && elapsed < AUTO_DELAY + AUTO_SECONDS) {
      const k = clamp((elapsed - AUTO_DELAY) / AUTO_SECONDS);
      sweepX = lerp(-edge, edge, easeInOut(k));
      amt = smooth(0, 0.1, k) * (1 - smooth(0.9, 1, k));
      animating = true;
    } else {
      amt = damp(amt, 0, 8, dt);
      if (amt > 4e-3) animating = true;
      else amt = 0;
    }

    // tiles light up as the bar passes; the first scan also brings the rims up
    const sweepNdc = toNdc(sweepX);
    const scatterK = lerp(1, 0.6, e);
    const heroK = lerp(1, 0.85, e);
    heroes.forEach((t, i) => {
      const dx = ndcX[i]! - sweepNdc;
      const boost = amt * Math.exp(-((dx / 0.12) ** 2));
      t.face.emissiveIntensity = t.baseFace * heroK + boost * 0.9;
      t.rim!.color.copy(limeC).multiplyScalar(0.16 * heroK + boost * 1.6);
    });
    for (const t of tiles) if (!t.spec.id) t.face.emissiveIntensity = t.baseFace * scatterK;
    if (payoffK > 0) {
      perf.face.emissiveIntensity += 0.5 * payoffK;
      perf.rim!.color.multiplyScalar(1 + 2.2 * payoffK);
    }
    if (built.payoff) built.payoff.color.copy(limeC).multiplyScalar(0.16 * payoffK);
    // story-only tiles grow out of the floor while the camera rises
    const grow = smooth(0.1, 0.6, e);
    for (const t of tiles) {
      if (!t.story) continue;
      t.group.visible = t.story.shadow.visible = grow > 0.002;
      t.group.scale.setScalar(Math.max(grow, 1e-3));
      t.story.shadow.scale.copy(t.story.shadowScale).multiplyScalar(Math.max(grow, 1e-3));
    }
    floor.material.uniforms.uQuietK!.value = 1 - e;

    const u = overlayMat.uniforms;
    u.uMem!.value = mem;
    u.uSweep!.value = sweepX;
    u.uAmt!.value = amt;
    u.uStreak!.value = -0.2 * e + idle * 0.04 * Math.sin(elapsed * 0.55);
    return { animating, fade: fadeAt(prog) };
  }

  function draw(fade: number) {
    if (fade >= 0.999) {
      renderer.setRenderTarget(null);
      renderer.setClearColor(GROUND_HEX, 1);
      renderer.clear();
      return;
    }
    floor.render(renderer, scene, camera);
    if (tier === "t3" && composer && finishPass) {
      finishPass.uniforms.uFade!.value = fade;
      composer.render();
    } else {
      quadMat.uniforms.uFade!.value = fade;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
  }

  applyTier();

  return {
    resize(w, h, ratio) {
      cssW = Math.max(1, w);
      cssH = Math.max(1, h);
      dpr = ratio;
      renderer.setPixelRatio(ratio);
      renderer.setSize(cssW, cssH, false);
      if (!still) renderer.transmissionResolutionScale = transmissionScale(cssW * cssH * ratio * ratio);
      camera.aspect = cssW / cssH;
      camera.updateProjectionMatrix();
      if (composer) {
        // a new size reallocates the targets, which is when a changed sample count takes effect
        const samples = cssW * cssH * ratio * ratio > MSAA4_MAX_PX ? 2 : 4;
        composer.renderTarget1.samples = samples;
        composer.renderTarget2.samples = samples;
        composer.setPixelRatio(ratio);
        composer.setSize(cssW, cssH);
      }
      sizeFloor();
      dirty = true;
    },
    frame(timeMs) {
      const ptr = layerBus.pointer;
      const input = { p: layerBus.progress, b: layerBus.beat, x: ptr ? ptr.x : NaN };
      const unchanged = !first && !dirty && settled && !still && input.p === lastIn.p && input.b === lastIn.b && Object.is(input.x, lastIn.x);
      // nothing moved, nothing is easing, nothing is dirty: no work at all. Only the hero's idle motion keeps drawing, at 30 fps.
      if (unchanged && !(idleOn && timeMs - lastDraw >= IDLE_FRAME_MS)) return false;
      lastIn = input;
      const { animating, fade } = step(timeMs);
      settled = !animating;
      if (!first && !dirty && !animating && !idleOn && fade === lastFade) return false;
      draw(fade);
      lastFade = fade;
      lastDraw = timeMs;
      report();
      first = false;
      dirty = false;
      return true;
    },
    settled() {
      return !first && !dirty && settled && !idleOn && lastIn.p === layerBus.progress && lastIn.b === layerBus.beat && lastFade === fadeAt(prog) && prog === clamp(layerBus.progress);
    },
    setTier(next) {
      if (next === tier) return;
      tier = next;
      applyTier();
    },
    async warm() {
      if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
      else renderer.compile(scene, camera);
    },
    dispose(opts) {
      scene.traverse((o) => {
        const m = o as Mesh;
        const mat = m.material as Material | Material[] | undefined;
        if (mat) {
          for (const x of Array.isArray(mat) ? mat : [mat]) {
            releaseSharedLut(renderer, x);
            x.dispose();
          }
        }
      });
      for (const d of disposables) d.dispose();
      disposeComposer();
      renderer.dispose();
      // the canvas belongs to the page, which may hand it to the next scene (a variant change); only a final teardown
      // gives the context back, otherwise every mount would leave one more live WebGL context behind
      if (opts?.loseContext) renderer.forceContextLoss();
    },
  };
}
