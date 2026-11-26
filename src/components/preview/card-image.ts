// The share card, drawn in the browser on a canvas (1080 by 1350, the portrait size social feeds like).
// A canvas rather than Next's ImageResponse: that needs a ttf or woff font (the site's variable font is woff2) and cannot take
// the answers from the page URL. The handle is only ever drawn here, on the visitor's own device.
import { FORMATS, GOALS, NICHES } from "@/lib/engine/types";
import { wrapText, type Answers, type Idea } from "@/lib/preview";

export const CARD_W = 1080;
export const CARD_H = 1350;

const C = { bg: "#fbfbf7", ink: "#11140c", muted: "#5a5f4c", line: "#dcdfd0", accent: "#4b6a0e", mark: "#b5cf4f", onMark: "#11140c" };
const PAD = 72;
const FONT = '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

type Word = { text: string; slot: boolean };

/** Splits a line with [bracketed slots] into words, remembering which ones sit inside a slot. */
function words(line: string): Word[] {
  const out: Word[] = [];
  let slot = false;
  for (const raw of line.split(/\s+/).filter(Boolean)) {
    const opens = raw.startsWith("[");
    if (opens) slot = true;
    out.push({ text: raw.replace(/[[\]]/g, ""), slot });
    if (raw.includes("]")) slot = false;
  }
  return out;
}

/** Lays a line out in rows that fit `max`, as lists of words. */
function rows(ctx: CanvasRenderingContext2D, line: string, max: number): Word[][] {
  const ws = words(line);
  const flat = wrapText(ws.map((w) => w.text).join(" "), (s) => ctx.measureText(s).width, max);
  const out: Word[][] = [];
  let i = 0;
  for (const text of flat) {
    const n = text.split(" ").length;
    out.push(ws.slice(i, i + n));
    i += n;
  }
  return out;
}

/** Draws one row of words, with the lime marker behind the slots. Returns nothing; the caller tracks y. */
function drawRow(ctx: CanvasRenderingContext2D, row: Word[], x: number, baseline: number, size: number) {
  const space = ctx.measureText(" ").width;
  let cx = x;
  row.forEach((w, i) => {
    const width = ctx.measureText(w.text).width;
    if (w.slot) {
      const next = row[i + 1]?.slot;
      ctx.fillStyle = C.mark;
      ctx.fillRect(cx - 6, baseline - size * 0.9, width + 12 + (next ? space : 0), size * 1.15);
    }
    ctx.fillStyle = w.slot ? C.onMark : C.ink;
    ctx.fillText(w.text, cx, baseline);
    cx += width + space;
  });
}

export async function renderCard(a: Answers, ideas: Idea[]): Promise<HTMLCanvasElement> {
  try { await document.fonts.load(`600 48px ${FONT}`); await document.fonts.load(`400 28px ${FONT}`); } catch { /* the fallback font is fine */ }
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = C.mark;
  ctx.fillRect(0, 0, CARD_W, 14);

  // header: mark, wordmark, label
  const logo = await loadImage("/brand/creo-mark.webp");
  if (logo) ctx.drawImage(logo, PAD, 64, 64, 64);
  ctx.fillStyle = C.ink;
  ctx.font = `600 40px ${FONT}`;
  ctx.fillText("CREO", PAD + (logo ? 84 : 0), 110);
  ctx.textAlign = "right";
  ctx.fillStyle = C.muted;
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText("Free post ideas", CARD_W - PAD, 108);
  ctx.textAlign = "left";

  // title
  ctx.fillStyle = C.ink;
  ctx.font = `600 68px ${FONT}`;
  const title = wrapText(`3 post ideas for ${NICHES[a.niche].label} creators`, (s) => ctx.measureText(s).width, CARD_W - PAD * 2);
  let y = 235;
  for (const t of title) { ctx.fillText(t, PAD, y); y += 78; }
  ctx.font = `500 30px ${FONT}`;
  ctx.fillStyle = C.accent;
  const sub = a.handle ? `@${a.handle}  ·  ${GOALS[a.goal]}, ${FORMATS[a.format].toLowerCase()}` : `${GOALS[a.goal]}, ${FORMATS[a.format].toLowerCase()}`;
  ctx.fillText(sub, PAD, y - 22);

  // the three ideas, as large as they fit; spare room goes between them
  const top = y + 40;
  const bottom = CARD_H - 160;
  const maxW = CARD_W - PAD * 2 - 96;
  let size = 54;
  let layout: Word[][][] = [];
  for (; size >= 32; size -= 2) {
    ctx.font = `600 ${size}px ${FONT}`;
    layout = ideas.map((i) => rows(ctx, i.line, maxW));
    const used = layout.reduce((n, r) => n + 44 + r.length * size * 1.2, 0);
    if (used + 2 * 36 <= bottom - top) break;
  }
  const used = layout.reduce((n, r) => n + 44 + r.length * size * 1.2, 0);
  const gap = Math.min(90, Math.max(36, (bottom - top - used) / 2));
  let cy = top;
  layout.forEach((r, idx) => {
    ctx.fillStyle = C.accent;
    ctx.font = `600 28px ${FONT}`;
    ctx.fillText(String(idx + 1).padStart(2, "0"), PAD, cy + 30);
    ctx.fillStyle = C.muted;
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText(ideas[idx].hookLabel.toUpperCase(), PAD + 96, cy + 28);
    ctx.font = `600 ${size}px ${FONT}`;
    let by = cy + 44 + size;
    for (const row of r) { drawRow(ctx, row, PAD + 96, by, size); by += size * 1.2; }
    cy = by - size * 1.2 + size * 0.35 + gap;
    if (idx < layout.length - 1) {
      ctx.fillStyle = C.line;
      ctx.fillRect(PAD, cy - gap / 2, CARD_W - PAD * 2, 2);
    }
  });

  // footer
  ctx.fillStyle = C.line;
  ctx.fillRect(PAD, CARD_H - 128, CARD_W - PAD * 2, 2);
  ctx.fillStyle = C.ink;
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText("CREO  ·  trycreosi.com/preview", PAD, CARD_H - 82);
  ctx.fillStyle = C.muted;
  ctx.font = `400 24px ${FONT}`;
  ctx.fillText("From CREO's pattern library. No promise of results.", PAD, CARD_H - 42);
  return canvas;
}

export const cardBlob = (c: HTMLCanvasElement): Promise<Blob | null> => new Promise((resolve) => c.toBlob(resolve, "image/png"));
