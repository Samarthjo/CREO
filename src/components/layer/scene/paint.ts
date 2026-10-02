import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three";
import type { SceneSample } from "./types";
import { rng } from "./util";

export const SANS = '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif';
export const MONO = '"Geist Mono Variable", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
export const LIME = "#c6ff3d";

type Ctx = CanvasRenderingContext2D;

/** Wait for the web fonts so the first canvas paint never uses a fallback face. Gives up after 2.5 s. */
export async function loadFonts(s: SceneSample) {
  const text = `${s.offer}${s.quoteShort}${s.walkAway}${s.audienceLine}${s.patternTitle}CREO0123456789.xK·–`;
  const faces = [`500 40px ${SANS}`, `600 24px ${SANS}`, `400 18px ${SANS}`, `500 15px ${MONO}`, `600 13px ${MONO}`];
  try {
    await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f, text))), new Promise((r) => setTimeout(r, 2500))]);
  } catch {
    // fall back to the system faces
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
}

/** Paint at a logical width (default: half the pixel width, so 2x density). */
function tex(w: number, h: number, draw: (g: Ctx, w: number, h: number) => void, logicalW = w / 2) {
  const { c, g } = canvas(w, h);
  const k = w / logicalW;
  g.scale(k, k);
  draw(g, logicalW, h / k);
  return finish(c);
}

function finish(c: HTMLCanvasElement, srgb = true) {
  const t = new CanvasTexture(c);
  if (srgb) t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  return t;
}

const rr = (g: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
};

function blob(g: Ctx, x: number, y: number, r: number, rgb: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Draw text with manual tracking so the result does not depend on canvas letterSpacing support. */
function track(g: Ctx, text: string, x: number, y: number, tracking: number, align: "left" | "center" = "left") {
  const widths = [...text].map((ch) => g.measureText(ch).width + tracking);
  const total = widths.reduce((a, b) => a + b, 0) - tracking;
  let cx = align === "center" ? x - total / 2 : x;
  [...text].forEach((ch, i) => {
    g.fillText(ch, cx, y);
    cx += widths[i]!;
  });
  return total;
}

const PALETTES = [
  { top: "#16282a", bot: "#070d10", a: "198,255,61", b: "70,160,200", c: "255,170,90" },
  { top: "#241c33", bot: "#0a0910", a: "255,140,70", b: "120,90,255", c: "198,255,61" },
  { top: "#2d1d1f", bot: "#0c0809", a: "255,90,120", b: "255,190,80", c: "90,140,255" },
  { top: "#14281c", bot: "#060d09", a: "100,255,170", b: "198,255,61", c: "60,120,200" },
];

/** A face to camera: a dark studio, a lit head and shoulders, a rim light. Abstract on purpose. */
function facecam(g: Ctx, w: number, h: number, rgb: string, rnd: () => number) {
  const cx = w * (0.46 + rnd() * 0.1);
  const sh = g.createLinearGradient(cx - w * 0.5, 0, cx + w * 0.5, 0);
  sh.addColorStop(0, "#2a2428");
  sh.addColorStop(0.5, "#14121a");
  sh.addColorStop(1, "#08080b");
  g.fillStyle = sh;
  g.beginPath();
  g.ellipse(cx, h * 0.9, w * 0.52, h * 0.19, 0, 0, 7);
  g.fill();
  g.fillStyle = "#3a2c28";
  g.fillRect(cx - w * 0.06, h * 0.55, w * 0.12, h * 0.1);
  const hd = g.createLinearGradient(cx - w * 0.14, 0, cx + w * 0.14, 0);
  hd.addColorStop(0, "#8a6556");
  hd.addColorStop(0.55, "#3b2a26");
  hd.addColorStop(1, "#150f10");
  g.fillStyle = hd;
  g.beginPath();
  g.ellipse(cx, h * 0.44, w * 0.125, w * 0.165, 0, 0, 7);
  g.fill();
  g.fillStyle = "#0d0b0e";
  g.beginPath();
  g.ellipse(cx, h * 0.44 - w * 0.085, w * 0.135, w * 0.105, 0, 0, 7);
  g.fill();
  g.strokeStyle = `rgba(${rgb},.5)`;
  g.lineWidth = 2.2;
  g.beginPath();
  g.ellipse(cx, h * 0.44, w * 0.125, w * 0.165, 0, Math.PI * 0.55, Math.PI * 1.05);
  g.stroke();
}

/** A screen recording: a dark window with lines of text, one highlighted block and a small chart. */
function screenRec(g: Ctx, w: number, h: number, rgb: string, rnd: () => number) {
  g.fillStyle = "#10151d";
  rr(g, 12, 56, w - 24, h * 0.56, 10);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,.08)";
  g.lineWidth = 1;
  g.stroke();
  [0, 1, 2].forEach((i) => {
    g.fillStyle = ["#ff6a5a", "#ffc24a", "#5ad07a"][i]!;
    g.beginPath();
    g.arc(26 + i * 12, 70, 3.2, 0, 7);
    g.fill();
  });
  for (let i = 0; i < 7; i++) {
    g.fillStyle = i === 3 ? `rgba(${rgb},.9)` : "#334055";
    rr(g, 24 + (i % 3 === 1 ? 14 : 0), 92 + i * 17, 40 + rnd() * (w - 100), 6, 3);
    g.fill();
  }
  g.fillStyle = `rgba(${rgb},.1)`;
  rr(g, 20, 176, w - 40, 38, 6);
  g.fill();
  g.strokeStyle = `rgba(${rgb},.7)`;
  g.lineWidth = 1.2;
  g.stroke();
  const base = h * 0.56 + 56 - 14;
  for (let i = 0; i < 7; i++) {
    const bh = 14 + rnd() * 44;
    g.fillStyle = i === 5 ? `rgb(${rgb})` : "#2a3342";
    g.fillRect(24 + i * ((w - 48) / 7), base - bh, (w - 48) / 7 - 5, bh);
  }
}

/** A vertical video frame: a face to camera or a screen recording, with a reel's interface on top. */
export function reelTexture(seed: number, s: SceneSample, hero: boolean) {
  const p = PALETTES[seed % PALETTES.length]!;
  const rnd = rng(900 + seed * 31);
  return tex(432, 768, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, p.top);
    bg.addColorStop(1, p.bot);
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    blob(g, w * (0.2 + rnd() * 0.3), h * 0.22, w * 0.95, p.a, 0.42);
    blob(g, w * 0.85, h * 0.5, w * 0.8, p.b, 0.34);
    blob(g, w * 0.2, h * 0.8, w * 0.7, p.c, 0.22);
    if (seed % 2 === 1) screenRec(g, w, h, p.a, rnd);
    else {
      for (let i = 0; i < 9; i++) blob(g, rnd() * w, h * (0.1 + rnd() * 0.6), 6 + rnd() * 16, p.a, 0.2 + rnd() * 0.25);
      facecam(g, w, h, p.a, rnd);
    }
    // vignette
    const vg = g.createRadialGradient(w / 2, h * 0.45, w * 0.3, w / 2, h * 0.5, h * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,.6)");
    g.fillStyle = vg;
    g.fillRect(0, 0, w, h);
    // reel interface
    g.fillStyle = "rgba(255,255,255,.9)";
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(w - 26, h - 190 + i * 44, 10, 0, 7);
      g.fill();
    }
    g.fillStyle = "rgba(255,255,255,.86)";
    rr(g, 18, h - 70, 150, 8, 4);
    g.fill();
    rr(g, 18, h - 52, 108, 8, 4);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.28)";
    rr(g, 18, h - 22, w - 36, 3, 1.5);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.9)";
    rr(g, 18, h - 22, (w - 36) * 0.42, 3, 1.5);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.95)";
    g.beginPath();
    g.arc(w / 2, h * 0.62, 20, 0, 7);
    g.fill();
    g.fillStyle = "rgba(0,0,0,.5)";
    g.beginPath();
    g.moveTo(w / 2 - 5, h * 0.62 - 9);
    g.lineTo(w / 2 + 10, h * 0.62);
    g.lineTo(w / 2 - 5, h * 0.62 + 9);
    g.fill();
    if (hero) {
      g.fillStyle = "rgba(255,255,255,.9)";
      g.font = `600 15px ${SANS}`;
      g.fillText(s.creator, 18, h - 86);
      g.fillStyle = "rgba(255,255,255,.7)";
      g.font = `500 14px ${MONO}`;
      g.fillText(`0:${s.durationSec.replace(/\D/g, "").padStart(2, "0")}`, 18, 30);
    }
    glassSheen(g, w, h);
  });
}

/** The glass cover's light: a bright hairline along the top edge and a soft diagonal sheen. Painted last. */
function glassSheen(g: Ctx, w: number, h: number) {
  const sh = g.createLinearGradient(0, 0, w * 0.7, h * 0.9);
  sh.addColorStop(0, "rgba(255,255,255,.07)");
  sh.addColorStop(0.5, "rgba(255,255,255,.015)");
  sh.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sh;
  g.fillRect(0, 0, w, h);
  const top = g.createLinearGradient(0, 0, w, 0);
  top.addColorStop(0, "rgba(255,255,255,.5)");
  top.addColorStop(0.6, "rgba(255,255,255,.18)");
  top.addColorStop(1, "rgba(255,255,255,.05)");
  g.fillStyle = top;
  g.fillRect(0, 0, w, 1.6);
}

function cardBase(g: Ctx, w: number, h: number) {
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#131720");
  bg.addColorStop(1, "#0a0c11");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  blob(g, w * 0.9, h * 0.1, w * 0.6, "198,255,61", 0.06);
}

function label(g: Ctx, text: string, x: number, y: number, color = "#8c909a", size = 12) {
  g.fillStyle = color;
  g.font = `500 ${size}px ${MONO}`;
  track(g, text.toUpperCase(), x, y, size * 0.1);
}

export function audienceTexture(s: SceneSample) {
  return tex(720, 432, (g, w, h) => {
    cardBase(g, w, h);
    label(g, "Audience", 22, 32);
    const hot = (x: number, y: number) => Math.hypot(x - 6.4, y - 3.1);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 14; x++) {
        const d = hot(x, y);
        const on = d < 3.4;
        g.fillStyle = on ? `rgba(198,255,61,${0.45 + 0.55 * (1 - d / 3.4)})` : "#262b36";
        g.beginPath();
        g.arc(34 + x * 22.4, 58 + y * 20.5, on ? 4.6 : 3.2, 0, 7);
        g.fill();
      }
    }
    g.fillStyle = "#f3f0e8";
    g.font = `500 40px ${SANS}`;
    g.fillText(s.followers, 22, 238);
    g.fillStyle = "#b4b6ae";
    g.font = `400 18px ${SANS}`;
    g.fillText(s.audienceLine, 22, 264);
    glassSheen(g, w, h);
  }, 480);
}

export function trendTexture(s: SceneSample) {
  return tex(720, 432, (g, w, h) => {
    cardBase(g, w, h);
    label(g, "Pattern", 22, 32);
    const pts = [168, 162, 166, 150, 154, 132, 112, 120, 84, 74, 48];
    const X = (i: number) => 24 + (i * (w - 48)) / (pts.length - 1);
    const area = g.createLinearGradient(0, 40, 0, 190);
    area.addColorStop(0, "rgba(198,255,61,.28)");
    area.addColorStop(1, "rgba(198,255,61,0)");
    g.beginPath();
    pts.forEach((y, i) => (i ? g.lineTo(X(i), y + 18) : g.moveTo(X(i), y + 18)));
    g.lineTo(X(pts.length - 1), 200);
    g.lineTo(X(0), 200);
    g.closePath();
    g.fillStyle = area;
    g.fill();
    g.strokeStyle = LIME;
    g.lineWidth = 3.2;
    g.lineJoin = "round";
    g.beginPath();
    pts.forEach((y, i) => (i ? g.lineTo(X(i), y + 18) : g.moveTo(X(i), y + 18)));
    g.stroke();
    g.fillStyle = "#f3f0e8";
    g.beginPath();
    g.arc(X(pts.length - 1), pts[pts.length - 1]! + 18, 5, 0, 7);
    g.fill();
    g.fillStyle = "#f3f0e8";
    g.font = `500 21px ${SANS}`;
    g.fillText(s.patternTitle, 22, 240);
    glassSheen(g, w, h);
  }, 480);
}

export function dealTexture(s: SceneSample) {
  const first = s.creator.split(" ")[0] ?? s.creator;
  return tex(720, 432, (g, w, h) => {
    cardBase(g, w, h);
    g.fillStyle = LIME;
    g.beginPath();
    g.arc(36, 36, 15, 0, 7);
    g.fill();
    g.fillStyle = "#0b0d08";
    g.font = `600 17px ${SANS}`;
    g.textAlign = "center";
    g.fillText(s.brand.slice(0, 1), 36, 42);
    g.textAlign = "left";
    g.fillStyle = "#f3f0e8";
    g.font = `600 17px ${SANS}`;
    g.fillText(s.brand, 62, 33);
    label(g, "Brand message", 62, 51);
    g.fillStyle = "#1b212b";
    rr(g, 22, 70, w - 44, 112, 14);
    g.fill();
    g.fillStyle = "#d7d6cf";
    g.font = `400 15px ${SANS}`;
    g.fillText(`Hi ${first},`, 38, 98);
    g.fillStyle = "#3b4350";
    rr(g, 38, 112, w - 100, 8, 4);
    g.fill();
    rr(g, 38, 130, w - 150, 8, 4);
    g.fill();
    rr(g, 38, 148, w - 200, 8, 4);
    g.fill();
    g.fillStyle = LIME;
    g.font = `600 21px ${MONO}`;
    track(g, `OFFER  ${s.offer}`, 22, 226, 0.6);
    glassSheen(g, w, h);
  }, 480);
}

export function statTexture(big: string, caption: string, accent: boolean) {
  return tex(720, 432, (g, w, h) => {
    cardBase(g, w, h);
    g.fillStyle = accent ? LIME : "#f3f0e8";
    g.font = `500 ${big.length > 6 ? 70 : 104}px ${SANS}`;
    g.fillText(big, 20, 140);
    label(g, caption, 22, 196, accent ? "#d3e6a0" : "#b4b6ae", 17);
    g.strokeStyle = "rgba(255,255,255,.1)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(22, 220);
    g.lineTo(w - 22, 220);
    g.stroke();
    glassSheen(g, w, h);
  }, 480);
}

/** A soft round gradient for contact shadows and light spill. White with alpha. */
export function softBlob() {
  const { c, g } = canvas(128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,.55)");
  gr.addColorStop(0.7, "rgba(255,255,255,.12)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return finish(c, false);
}

export interface EtchNode {
  x: number;
  y: number;
  hero: boolean;
}

export interface EtchSpec {
  /** Glass face size in world units, and the texture resolution per unit. */
  w: number;
  h: number;
  ppu: number;
  nodes: EtchNode[];
  /** Index pairs into nodes, with a 0..1 weight (brightness). */
  links: [number, number, number][];
  /** The mark's size, and its centre (units from the glass centre, y up). */
  markScale: number;
  markY: number;
}

/**
 * The glass's etching, as two maps. `overlay` is data for the lit pass (R: network lines, G: nodes, B: mark fill and
 * edge) and `rough` is a roughness multiplier (white = frosted) so the etched mark and network scatter the light that
 * passes through the pane.
 */
export function etchMaps(spec: EtchSpec) {
  const W = Math.round(spec.w * spec.ppu);
  const H = Math.round(spec.h * spec.ppu);
  const ov = canvas(W, H);
  const rg = canvas(Math.round(W / 2), Math.round(H / 2));
  const P = (x: number, y: number): [number, number] => [(x / spec.w + 0.5) * W, (0.5 - y / spec.h) * H];
  const g = ov.g;
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "lighter";
  g.lineCap = "round";
  const px = spec.ppu / 200;

  // links: gradient between the two end weights
  for (const [a, b, wt] of spec.links) {
    const [x0, y0] = P(spec.nodes[a]!.x, spec.nodes[a]!.y);
    const [x1, y1] = P(spec.nodes[b]!.x, spec.nodes[b]!.y);
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    const ha = spec.nodes[a]!.hero;
    const hb = spec.nodes[b]!.hero;
    gr.addColorStop(0, `rgba(255,0,0,${(ha ? 1 : 0.7) * wt})`);
    gr.addColorStop(1, `rgba(255,0,0,${(hb ? 1 : 0.7) * wt})`);
    g.strokeStyle = gr;
    g.lineWidth = (1.5 + wt * 1.4) * px;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  }
  // nodes
  for (const n of spec.nodes) {
    const [x, y] = P(n.x, n.y);
    const r = (n.hero ? 5.4 : 3) * px;
    blob(g, x, y, r * 4, "0,255,0", n.hero ? 0.35 : 0.16);
    g.fillStyle = "rgba(0,255,0,1)";
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
    if (n.hero) {
      g.strokeStyle = "rgba(0,255,0,.9)";
      g.lineWidth = 1.6 * px;
      g.beginPath();
      g.arc(x, y, r * 2.6, 0, 7);
      g.stroke();
    }
  }

  // the mark: the logo (rounded square with the C) and the word, centred on the glass
  const sq = spec.markScale * spec.ppu * 0.9;
  const gap = sq * 0.36;
  const fs = sq * 0.58;
  const tr = fs * 0.24;
  const word = "CREO";
  const [mx, my] = P(0, spec.markY);
  g.font = `600 ${fs}px ${SANS}`;
  const ww = [...word].reduce((a, ch) => a + g.measureText(ch).width + tr, -tr);
  const ox = mx - (sq + gap + ww) / 2;
  const oy = my - sq / 2;
  const baseY = my + fs * 0.35;

  const logo = (t: Ctx, k: number, square: string, edge: string, groove: string, inner: string) => {
    t.save();
    t.translate(ox * k, oy * k);
    t.scale((sq * k) / 64, (sq * k) / 64);
    t.fillStyle = square;
    rr(t, 0, 0, 64, 64, 16);
    t.fill();
    t.strokeStyle = edge;
    t.lineWidth = 1.3;
    rr(t, 0.65, 0.65, 62.7, 62.7, 15.4);
    t.stroke();
    t.lineCap = "round";
    t.strokeStyle = groove;
    t.lineWidth = 8.6;
    t.beginPath();
    t.arc(32, 32, 15, -0.714, 0.714, true);
    t.stroke();
    t.strokeStyle = inner;
    t.lineWidth = 6.2;
    t.stroke();
    t.restore();
  };
  const letters = (t: Ctx, k: number, fill: string, edge: string | null) => {
    t.font = `600 ${fs * k}px ${SANS}`;
    t.fillStyle = fill;
    if (edge) {
      t.strokeStyle = edge;
      t.lineWidth = Math.max(1.1, fs * 0.014) * k;
    }
    let cx = (ox + sq + gap) * k;
    for (const ch of word) {
      t.fillText(ch, cx, baseY * k);
      if (edge) t.strokeText(ch, cx, baseY * k);
      cx += t.measureText(ch).width + tr * k;
    }
  };

  g.globalCompositeOperation = "source-over";
  logo(g, 1, "rgba(0,0,255,.2)", "rgba(0,0,255,.9)", "rgba(0,0,255,.9)", "rgba(0,0,40,1)");
  letters(g, 1, "rgba(0,0,255,.5)", "rgba(0,0,255,1)");

  // roughness: a clear pane (dark), with the network, the square and the letters frosted (light) and the C left polished
  const r = rg.g;
  const k2 = 0.5;
  r.fillStyle = "rgb(12,12,12)";
  r.fillRect(0, 0, rg.c.width, rg.c.height);
  r.globalCompositeOperation = "lighter";
  r.lineCap = "round";
  for (const [a, b, wt] of spec.links) {
    const [x0, y0] = P(spec.nodes[a]!.x, spec.nodes[a]!.y);
    const [x1, y1] = P(spec.nodes[b]!.x, spec.nodes[b]!.y);
    r.strokeStyle = `rgba(120,120,120,${0.2 + wt * 0.5})`;
    r.lineWidth = 3 * px * k2;
    r.beginPath();
    r.moveTo(x0 * k2, y0 * k2);
    r.lineTo(x1 * k2, y1 * k2);
    r.stroke();
  }
  r.globalCompositeOperation = "source-over";
  logo(r, k2, "rgb(200,200,200)", "rgb(200,200,200)", "rgb(12,12,12)", "rgb(12,12,12)");
  letters(r, k2, "rgb(200,200,200)", null);

  return { overlay: finish(ov.c, false), rough: finish(rg.c, false) };
}
