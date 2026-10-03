// Page-side tree painter: draws one conifer or broadleaf (or its trunk) into a canvas, lit from one side.
// Coordinates: scene units. A tree is built in 3D (x right, y up, z toward the viewer) around its foot, then painted back to front.
(() => {
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mixc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  const addc = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const css = (c, a = 1) => `rgba(${clamp(c[0], 0, 255) | 0},${clamp(c[1], 0, 255) | 0},${clamp(c[2], 0, 255) | 0},${a})`;
  function rngOf(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const PAL = {
    dawn: {
      shadow: [8, 20, 26], mid: [26, 50, 42], lit: [88, 124, 76], warm: [214, 200, 132], rim: [255, 226, 170],
      leafShadow: [14, 32, 32], leafMid: [48, 72, 52], leafLit: [104, 134, 86], leafWarm: [196, 192, 124],
      barkDark: [30, 24, 22], barkLit: [128, 104, 82],
      L: norm3([-0.80, 0.46, 0.38]), sky: [70, 92, 120],
    },
    night: {
      shadow: [2, 6, 11], mid: [8, 22, 32], lit: [34, 68, 92], warm: [128, 158, 208], rim: [170, 196, 240],
      leafShadow: [4, 12, 18], leafMid: [14, 34, 42], leafLit: [48, 86, 108], leafWarm: [110, 140, 190],
      barkDark: [6, 8, 12], barkLit: [52, 62, 84],
      L: norm3([0.80, 0.42, 0.42]), sky: [24, 34, 74],
    },
  };

  // ---- a tapered stroke along a polyline (2D), widths w0 -> w1
  function taper(ctx, pts, w0, w1, fill) {
    if (pts.length < 2) return;
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = mix(w0, w1, i / (pts.length - 1)) / 2;
      left.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); right.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]);
    for (const p of left) ctx.lineTo(p[0], p[1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }

  // ---------------------------------------------------------------- conifer
  function buildConifer(spec, rnd) {
    const H = spec.h, slim = spec.slim ?? 0.2, lean = spec.lean ?? 0;
    const axis = (y) => lean * y;                              // trunk centre line, x as a function of height
    const prims = [];
    const yb = 0.095 * H;
    const Rbase = slim * H * 1.04;
    const nWhorl = Math.max(11, Math.round(H / 5.4));
    let twist = rnd() * TAU;
    for (let i = 0; i < nWhorl; i++) {
      const t = i / (nWhorl - 1);                              // 0 lowest whorl, 1 the top
      const y = yb + (H * 0.99 - yb) * t + (rnd() - 0.5) * 3.4;
      const prof = Math.pow(1 - t, 0.82) * (1 + 0.1 * Math.sin(t * 17 + spec.seed));
      const Rw = Rbase * prof * (0.82 + 0.36 * rnd());
      const nb = Math.round(mix(7.4, 3.6, t));
      twist += 1.05 + rnd() * 1.3;
      for (let k = 0; k < nb; k++) {
        const phi = twist + (k / nb) * TAU + (rnd() - 0.5) * 0.8;
        if (rnd() < 0.16) continue;                                   // gaps: not every branch grew
        const L = Rw * (0.62 + 0.5 * rnd()) * (rnd() < 0.12 ? 1.35 : 1);
        if (L < 1.6) continue;
        const droop = mix(-0.62, 0.12, Math.pow(t, 0.75)) + (rnd() - 0.5) * 0.22;
        const cx = Math.cos(phi), cz = Math.sin(phi);
        const seg = 6, pts = [];
        for (let j = 0; j <= seg; j++) {
          const s = j / seg, r = L * s;
          const yy = y + r * Math.tan(droop) - 0.14 * L * (1 - t) * s * s + 0.24 * L * s * s * s;
          pts.push([axis(y) + cx * r, yy, cz * r]);
        }
        // the branch's own body, then twigs along it on both sides
        prims.push({ kind: "branch", pts, t, L, y, phi });
        const nt = Math.max(5, Math.round(L / 3.4));
        for (let j = 0; j < nt; j++) {
          const s = 0.2 + 0.78 * (j + rnd() * 0.6) / nt;
          const base = pts[Math.min(seg, Math.round(s * seg))];
          const fr = s * seg, i0 = Math.floor(fr), i1 = Math.min(seg, i0 + 1), f = fr - i0;
          const bp = [mix(pts[i0][0], pts[i1][0], f), mix(pts[i0][1], pts[i1][1], f), mix(pts[i0][2], pts[i1][2], f)];
          for (const side of [-1, 1]) {
            if (rnd() < 0.12) continue;
            const ang = phi + side * (0.85 + 0.45 * rnd());
            const lt = Math.max(1.6, L * (0.36 * Math.pow(1 - s, 0.5) + 0.07) * (0.75 + 0.5 * rnd()));
            const dx = Math.cos(ang), dz = Math.sin(ang);
            const dy = Math.tan(droop * 0.7) * 0.6 - 0.12 + 0.12 * s;
            const tp = [[bp[0], bp[1], bp[2]], [bp[0] + dx * lt * 0.55, bp[1] + dy * lt * 0.55 - 0.05 * lt, bp[2] + dz * lt * 0.55], [bp[0] + dx * lt, bp[1] + dy * lt - 0.12 * lt, bp[2] + dz * lt]];
            prims.push({ kind: "twig", pts: tp, t, L, y, phi: ang, s, Rw });
          }
        }
      }
    }
    // the leader
    prims.push({ kind: "leader", pts: [[axis(H * 0.93), H * 0.93, 0], [axis(H), H, 0]], t: 1, L: 4, y: H, phi: 0 });
    return { prims, axis, H, yb, Rbase };
  }

  function paintConifer(ctx, spec, tree, tx, ty, P, S) {
    // tx, ty: scene (x, y) of the foot -> canvas px via S; local (x, y up, z) -> screen
    const proj = (p) => [tx(p[0]), ty(p[1])];
    const L = P.L;
    const rnd = rngOf(spec.seed * 7 + 3);
    const { prims, axis, H, yb, Rbase } = tree;
    // trunk first by painting it into the depth list as a primitive at z = 0
    const list = prims.map((q) => ({ q, z: q.pts.reduce((a, p) => a + p[2], 0) / q.pts.length }));
    list.push({ q: { kind: "trunk" }, z: 0 });
    list.sort((a, b) => a.z - b.z);

    for (const { q, z } of list) {
      if (q.kind === "trunk") { paintTrunk(ctx, spec, axis, H, yb, tx, ty, P, S, rnd); continue; }
      // lighting at this piece: outward direction from the trunk, tipped up
      const m = q.pts[Math.floor(q.pts.length / 2)];
      const ox = m[0] - axis(m[1]), oz = m[2];
      const ol = Math.hypot(ox, oz) || 1;
      const rel = clamp(ol / Math.max(4, (q.Rw ?? Rbase * Math.pow(1 - q.t, 0.82)) ), 0, 1.4);   // 0 at the trunk, 1 at the branch tip
      const n = norm3([ox / ol * 0.78, q.kind === "twig" ? 0.62 : 0.5, oz / ol * 0.78]);
      let d = dot3(n, L);
      const wrap = clamp((d + 0.30) / 1.30, 0, 1);               // needles let light through
      // inner, lower and far-side parts sit in the shade of the rest of the tree
      const inner = smooth(0.0, 0.9, rel);
      const back = smooth(-1.0, 0.5, z / Math.max(8, Rbase));
      const low = 1 - 0.28 * (1 - q.t) * (1 - rel);
      const light = wrap * (0.30 + 0.70 * inner) * (0.55 + 0.45 * back) * low;
      const lit = clamp(light * 1.4, 0, 1);
      let body = mixc(mixc(P.shadow, P.mid, smooth(0.0, 0.35, lit)), P.lit, smooth(0.25, 0.95, lit));
      const sunTip = smooth(0.62, 1.0, lit) * smooth(0.5, 1.1, rel);
      body = mixc(body, P.warm, 0.38 * sunTip);

      const pts2 = q.pts.map(proj);
      if (q.kind === "branch") {
        taper(ctx, pts2, Math.max(1.0, q.L * 0.06) * S, Math.max(0.4, q.L * 0.016) * S, css(mixc(P.shadow, body, 0.45), 0.96));
      } else if (q.kind === "twig") {
        const w0 = Math.max(0.9, q.L * 0.034) * S;
        taper(ctx, pts2, w0 * 0.85, w0 * 0.3, css(mixc(P.shadow, body, 0.5), 0.95));
      } else {
        taper(ctx, pts2, 1.6 * S, 0.4 * S, css(body, 1));
        continue;
      }
      // needles: bristles fanned around the twig in 3D, lit like fine cylinders (light across the needle, not along it)
      const nn = q.kind === "branch" ? Math.max(8, Math.round(q.L * 1.4)) : Math.max(6, Math.round(q.L * 3.2));
      const q3 = q.pts;
      for (let j = 0; j < nn; j++) {
        const f = (j + rnd()) / nn;
        const fr = f * (q3.length - 1), i0 = Math.min(q3.length - 2, Math.floor(fr)), ff = fr - i0;
        const p3 = [mix(q3[i0][0], q3[i0 + 1][0], ff), mix(q3[i0][1], q3[i0 + 1][1], ff), mix(q3[i0][2], q3[i0 + 1][2], ff)];
        const ax3 = norm3([q3[i0 + 1][0] - q3[i0][0], q3[i0 + 1][1] - q3[i0][1], q3[i0 + 1][2] - q3[i0][2]]);
        const cnt = q.kind === "branch" ? 2 : 3;
        for (let c = 0; c < cnt; c++) {
          // a direction on a cone around the twig axis, swept forward
          const cone = 0.55 + 0.75 * rnd(), roll = rnd() * TAU;
          const u = norm3([ax3[1] * 0.3 + 0.7, -ax3[0] * 0.3 + 0.2, 0.5]);
          let pu = norm3([u[0] - ax3[0] * dot3(u, ax3), u[1] - ax3[1] * dot3(u, ax3), u[2] - ax3[2] * dot3(u, ax3)]);
          const pv = [ax3[1] * pu[2] - ax3[2] * pu[1], ax3[2] * pu[0] - ax3[0] * pu[2], ax3[0] * pu[1] - ax3[1] * pu[0]];
          const bd = norm3([ax3[0] * Math.cos(cone) + (pu[0] * Math.cos(roll) + pv[0] * Math.sin(roll)) * Math.sin(cone),
                            ax3[1] * Math.cos(cone) + (pu[1] * Math.cos(roll) + pv[1] * Math.sin(roll)) * Math.sin(cone),
                            ax3[2] * Math.cos(cone) + (pu[2] * Math.cos(roll) + pv[2] * Math.sin(roll)) * Math.sin(cone)]);
          const ln = (1.5 + 2.2 * rnd()) * (q.kind === "branch" ? 1.15 : 1);
          const sx = tx(p3[0]), sy = ty(p3[1]);
          const ex = tx(p3[0] + bd[0] * ln), ey = ty(p3[1] + bd[1] * ln);
          // Kajiya-Kay: a needle is brightest when the light is square on to its axis
          const kk = Math.sqrt(Math.max(0, 1 - dot3(bd, L) ** 2));
          const facing = clamp(0.5 + 0.5 * dot3(norm3([bd[0], bd[1] * 0.4 + 0.3, bd[2]]), L), 0, 1);
          const under = clamp(0.5 + 0.5 * bd[1], 0, 1);                       // needles on the underside of a branch sit in its shadow
          let bl = lit * (0.42 + 0.58 * kk) * (0.55 + 0.45 * facing) * (0.62 + 0.38 * under) + (rnd() - 0.5) * 0.2;
          bl = clamp(bl, 0, 1);
          let col = mixc(mixc(P.shadow, P.mid, smooth(0.0, 0.42, bl)), P.lit, smooth(0.3, 1, bl));
          if (rnd() < 0.2 * lit * facing) col = mixc(col, P.warm, 0.65);
          ctx.strokeStyle = css(col, 0.9);
          ctx.lineWidth = (0.5 + 0.4 * rnd()) * S * 0.55;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        }
      }
    }
  }

  function paintTrunk(ctx, spec, axis, H, yb, tx, ty, P, S, rnd) {
    const r0 = Math.max(1.3, H * 0.018), r1 = Math.max(0.5, H * 0.004);
    const steps = 18, left = [], right = [];
    const top = H * 0.93;
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * top;
      const w = mix(r0, r1, Math.pow(i / steps, 0.8)) * (1 + 0.14 * Math.sin(i * 1.7 + spec.seed));
      left.push([tx(axis(y) - w), ty(y)]); right.push([tx(axis(y) + w), ty(y)]);
    }
    ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]);
    for (const p of left) ctx.lineTo(p[0], p[1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(left[0][0], 0, right[0][0], 0);
    g.addColorStop(0, css(mixc(P.barkLit, P.barkDark, 0.35))); g.addColorStop(0.45, css(mixc(P.barkLit, P.barkDark, 0.75))); g.addColorStop(1, css(P.barkDark));
    ctx.fillStyle = g; ctx.fill();
    // inside the crown the trunk is in deep shade
    ctx.fillStyle = css(P.shadow, 0.82); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(0, ty(yb * 1.15), 99999, 99999); ctx.clip();
    ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]); for (const p of left) ctx.lineTo(p[0], p[1]); for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); ctx.restore();
    // bark: long vertical fissures
    for (let i = 0; i < Math.round(H * 0.5); i++) {
      const y0 = rnd() * top * 0.5, len = (6 + rnd() * 26);
      const side = rnd();
      const w0 = mix(r0, r1, Math.pow(y0 / top, 0.8));
      const x = axis(y0) + (side - 0.5) * 2 * w0 * 0.8;
      ctx.strokeStyle = css(P.barkDark, 0.35 + 0.3 * rnd()); ctx.lineWidth = Math.max(0.5, (0.35 + 0.4 * rnd()) * S * 0.5);
      ctx.beginPath(); ctx.moveTo(tx(x), ty(y0)); ctx.lineTo(tx(x + (rnd() - 0.5) * 0.8), ty(y0 + len)); ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- broadleaf
  function buildBroad(spec, rnd) {
    const hb = spec.h * 0.8;
    const cyy = hb * 0.62;                                           // crown centre height above the foot
    const Rc = hb * 0.30;
    const cx0 = 0, cy0 = cyy - hb * 0.02;
    // a handful of big lobes, then clusters sitting on and between them
    const clusters = [];
    const n = 38;
    for (let i = 0; i < n; i++) {
      // points in a lumpy ellipsoid, biased toward the surface
      let u, v, w, rr;
      do { u = rnd() * 2 - 1; v = rnd() * 2 - 1; w = rnd() * 2 - 1; rr = Math.hypot(u, v, w); } while (rr > 1 || rr < 0.05);
      const k = Math.pow(rr, 0.45) / rr;
      u *= k; v *= k; w *= k;
      const lump = 1 + 0.12 * Math.sin(i * 2.3 + spec.seed);
      clusters.push({ x: cx0 + u * Rc * 1.18 * lump, y: cy0 + v * Rc * 0.92 * lump, z: w * Rc * 0.9, r: Rc * (0.26 + 0.2 * rnd()) });
    }
    return { hb, cyy, Rc, cx0, cy0, clusters };
  }

  function paintBroadCrown(ctx, spec, tree, tx, ty, P, S, rnd) {
    const { hb, Rc, cx0, cy0, clusters } = tree;
    const L = P.L;
    const leaves = [];
    for (const c of clusters) {
      const nLeaf = Math.round(c.r * c.r * 2.1);
      for (let i = 0; i < nLeaf; i++) {
        let u, v, w, rr;
        do { u = rnd() * 2 - 1; v = rnd() * 2 - 1; w = rnd() * 2 - 1; rr = Math.hypot(u, v, w); } while (rr > 1 || rr < 0.02);
        const k = Math.pow(rr, 0.5) / rr;
        u *= k; v *= k; w *= k;
        const x = c.x + u * c.r, y = c.y + v * c.r, z = c.z + w * c.r;
        // normal: the little cluster's dome blended with the crown's big dome
        const n = norm3([u * 0.9 + (x - cx0) / Rc * 0.8, v * 0.9 + (y - cy0) / Rc * 0.8, w * 0.9 + z / Rc * 0.8]);
        leaves.push({ x, y, z, n, rho: rr, crown: Math.hypot((x - cx0) / (Rc * 1.18), (y - cy0) / (Rc * 0.92), z / (Rc * 0.9)) });
      }
    }
    leaves.sort((a, b) => a.z - b.z);
    const unit = hb / 164;
    for (const lf of leaves) {
      const d = clamp((dot3(lf.n, L) + 0.2) / 1.2, 0, 1);
      // leaves deep in the crown, and on the far side, sit in shade; the lit skin of each cluster glows
      const inner = smooth(0.2, 1.0, lf.crown);
      const back = smooth(-1.0, 0.6, lf.z / (Rc * 0.9));
      const lit = clamp(d * (0.30 + 0.70 * inner) * (0.45 + 0.55 * back) * (0.65 + 0.5 * lf.rho) * 1.2, 0, 1);
      let col = mixc(mixc(P.leafShadow, P.leafMid, smooth(0, 0.42, lit)), P.leafLit, smooth(0.28, 1, lit));
      col = mixc(col, P.leafWarm, 0.2 * smooth(0.5, 1, lit) * rnd());
      col = [col[0] + (rnd() - 0.5) * 12, col[1] + (rnd() - 0.5) * 16, col[2] + (rnd() - 0.5) * 10];
      const r = (0.7 + 0.95 * rnd()) * unit * S * 1.1;
      ctx.fillStyle = css(col, 0.97);
      ctx.save(); ctx.translate(tx(lf.x), ty(lf.y)); ctx.rotate(rnd() * TAU);
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * (0.5 + 0.3 * rnd()), 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  function paintBroadTrunk(ctx, spec, tree, tx, ty, P, S, rnd) {
    const { hb, cyy } = tree;
    const r0 = hb * 0.033, r1 = hb * 0.02;
    const top = cyy + hb * 0.12;
    const steps = 16, left = [], right = [];
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * top;
      const flare = 1 + 0.55 * Math.pow(1 - i / steps, 6);
      const w = mix(r0, r1, i / steps) * flare;
      const wob = Math.sin(i * 0.9 + spec.seed) * hb * 0.004;
      left.push([tx(wob - w), ty(y)]); right.push([tx(wob + w), ty(y)]);
    }
    ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]);
    for (const p of left) ctx.lineTo(p[0], p[1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(left[0][0], 0, right[0][0], 0);
    g.addColorStop(0, css(P.barkLit)); g.addColorStop(0.5, css(mixc(P.barkLit, P.barkDark, 0.55))); g.addColorStop(1, css(P.barkDark));
    ctx.fillStyle = g; ctx.fill();
    // limbs reaching into the crown
    for (let k = 0; k < 4; k++) {
      const a = (k - 1.5) * 0.5 + (rnd() - 0.5) * 0.3, y0 = cyy * (0.55 + 0.12 * k), len = hb * (0.16 + 0.07 * rnd());
      const pts = [[tx(0), ty(y0)], [tx(Math.sin(a) * len * 0.5), ty(y0 + len * 0.55)], [tx(Math.sin(a) * len), ty(y0 + len * 1.1)]];
      taper(ctx, pts, hb * 0.016 * S, hb * 0.005 * S, css(mixc(P.barkLit, P.barkDark, 0.5 + 0.3 * k / 3)));
    }
    for (let i = 0; i < Math.round(hb * 0.7); i++) {
      const y0 = rnd() * top * 0.9, len = 3 + rnd() * 14, w = mix(r0, r1, y0 / top);
      const x = (rnd() - 0.5) * 2 * w * 0.8;
      ctx.strokeStyle = css(P.barkDark, 0.3 + 0.3 * rnd()); ctx.lineWidth = Math.max(0.5, (0.3 + 0.4 * rnd()) * S * 0.5);
      ctx.beginPath(); ctx.moveTo(tx(x), ty(y0)); ctx.lineTo(tx(x + (rnd() - 0.5) * 0.6), ty(y0 + len)); ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- entry: draw one sprite, return a PNG data URL
  window.drawTree = (spec) => {
    // spec: { time, kind, part: 'tree'|'trunk'|'crown', h, slim, lean, seed, box:[x0,y0,w,h], root:[x,y], S }
    const P = PAL[spec.time];
    const S = spec.S;
    const [x0, y0, bw, bh] = spec.box;
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(bw * S); cv.height = Math.ceil(bh * S);
    const ctx = cv.getContext("2d");
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const tx = (lx) => (spec.root[0] + lx - x0) * S;
    const ty = (ly) => (spec.root[1] - ly - y0) * S;
    const rnd = rngOf(spec.seed * 131 + 17);
    if (spec.kind === "c") {
      const tree = buildConifer(spec, rnd);
      paintConifer(ctx, spec, tree, tx, ty, P, S);
    } else {
      const tree = buildBroad(spec, rnd);
      if (spec.part === "trunk") paintBroadTrunk(ctx, spec, tree, tx, ty, P, S, rngOf(spec.seed * 17 + 5));
      else paintBroadCrown(ctx, spec, tree, tx, ty, P, S, rnd);
    }
    return cv.toDataURL("image/png");
  };
})();
