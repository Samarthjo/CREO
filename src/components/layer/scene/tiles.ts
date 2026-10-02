import {
  AdditiveBlending,
  Color,
  CustomBlending,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  ZeroFactor,
} from "three";
import type { BufferGeometry, Texture } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { MIRROR_LAYER } from "./floor";
import type { Layout, TileSpec } from "./layout";
import { audienceTexture, dealTexture, LIME, reelTexture, softBlob, statTexture, trendTexture } from "./paint";
import { heightToAlpha } from "./shaders";
import type { SceneSample } from "./types";

export interface Tile {
  spec: TileSpec;
  group: Group;
  face: MeshStandardMaterial;
  rim: MeshBasicMaterial | null;
  /** Emissive brightness of the face at rest. */
  baseFace: number;
}

const DEPTH = 0.06;

/** Builds every tile with its contact shadow (and, for the five signals, a lime light spill on the floor). */
export function buildTiles(layout: Layout, sample: SceneSample, anisotropy: number, env: Texture) {
  const root = new Group();
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(o: T): T => (owned.push(o), o);

  const textures = new Map<string, Texture>();
  const tex = (key: string, make: () => Texture) => {
    let t = textures.get(key);
    if (!t) {
      t = own(make());
      t.anisotropy = anisotropy;
      textures.set(key, t);
    }
    return t;
  };
  const textureFor = (s: TileSpec) => {
    switch (s.kind) {
      case "reel":
        return tex(`reel${s.seed}${s.id ? "h" : ""}`, () => reelTexture(s.seed ?? 0, sample, !!s.id));
      case "audience":
        return tex("aud", () => audienceTexture(sample));
      case "trend":
        return tex("trend", () => trendTexture(sample));
      case "deal":
        return tex("deal", () => dealTexture(sample));
      case "perf":
        return tex("perf", () => statTexture(sample.proofLift, `Proof-first hooks · ${sample.proofBasis}`, true));
      case "length":
        return tex("len", () => statTexture(sample.durationSec, "Typical length", false));
      case "followers":
        return tex("fol", () => statTexture(sample.followers, "Followers", false));
      case "quote":
        return tex("quote", () => statTexture(sample.quoteShort, `Walk away below ${sample.walkAway}`, false));
      case "walk":
        return tex("walk", () => statTexture(sample.walkAway, "Walk away below", false));
    }
  };

  const geos = new Map<string, BufferGeometry>();
  const geo = (key: string, make: () => BufferGeometry) => {
    let g = geos.get(key);
    if (!g) geos.set(key, (g = own(make())));
    return g;
  };

  const body = own(new MeshPhysicalMaterial({ color: 0x07080c, metalness: 0.3, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, envMap: env, envMapIntensity: 0.35 }));
  body.onBeforeCompile = heightToAlpha;
  const shadowTex = own(softBlob());
  const shadowMat = own(
    new MeshBasicMaterial({
      map: shadowTex,
      color: 0x000000,
      blending: CustomBlending,
      blendSrc: ZeroFactor,
      blendDst: OneMinusSrcAlphaFactor,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  const spillMat = own(
    new MeshBasicMaterial({
      map: shadowTex,
      color: new Color(LIME).multiplyScalar(0.06),
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }),
  );
  const flat = own(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2));

  const tiles: Tile[] = [];
  for (const spec of layout.tiles) {
    const hero = !!spec.id;
    const map = textureFor(spec);
    const face = own(
      new MeshStandardMaterial({ color: 0x050607, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.5, roughness: 0.28, metalness: 0, envMap: env, envMapIntensity: 0.12 }),
    );
    face.onBeforeCompile = heightToAlpha;
    const g = new Group();
    g.rotation.order = "YXZ";
    g.rotation.set(spec.rx, spec.ry, 0);
    g.position.set(spec.x, (spec.h / 2) * Math.cos(spec.rx) + (DEPTH / 2) * Math.abs(Math.sin(spec.rx)) + (spec.lift ?? 0), spec.z);

    const slab = new Mesh(geo(`s${spec.w}x${spec.h}`, () => new RoundedBoxGeometry(spec.w, spec.h, DEPTH, 4, 0.04)), body);
    const faceMesh = new Mesh(geo(`f${spec.w}x${spec.h}`, () => new PlaneGeometry(spec.w - 0.06, spec.h - 0.06)), face);
    faceMesh.position.z = DEPTH / 2 + 0.001;
    g.add(slab, faceMesh);
    let rim: MeshBasicMaterial | null = null;
    if (hero) {
      rim = own(new MeshBasicMaterial({ color: new Color(LIME).multiplyScalar(0.14) }));
      rim.onBeforeCompile = heightToAlpha;
      const r = new Mesh(geo(`r${spec.w}x${spec.h}`, () => new RoundedBoxGeometry(spec.w + 0.035, spec.h + 0.035, 0.03, 3, 0.05)), rim);
      r.position.z = -0.012;
      g.add(r);
    }
    g.traverse((o) => o.layers.enable(MIRROR_LAYER));
    root.add(g);

    // footprint: the bottom edge's centre on the floor, in the tile's own yaw
    const fx = spec.x + Math.sin(spec.ry) * -(spec.h / 2) * Math.sin(spec.rx);
    const fz = spec.z + Math.cos(spec.ry) * -(spec.h / 2) * Math.sin(spec.rx);
    const shadow = new Mesh(flat, shadowMat);
    shadow.scale.set(spec.w * 1.5, 1, spec.h * 0.42 + 0.35);
    shadow.position.set(fx, 0.004, fz - 0.05);
    shadow.rotation.y = spec.ry;
    shadow.renderOrder = 1;
    root.add(shadow);
    if (hero) {
      const spill = new Mesh(flat, spillMat);
      spill.scale.set(spec.w * 2.6, 1, 1.8);
      spill.position.set(fx, 0.006, fz + 0.45);
      spill.rotation.y = spec.ry * 0.5;
      spill.renderOrder = 1;
      root.add(spill);
    }
    tiles.push({ spec, group: g, face, rim, baseFace: hero ? 0.8 : 0.3 });
  }
  return {
    root,
    tiles,
    dispose: () => {
      for (const o of owned) o.dispose();
    },
  };
}
