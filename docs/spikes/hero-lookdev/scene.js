import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* CREO look-dev: "The Layer". The creator's signals (reels, DMs, numbers) lie scattered on an obsidian floor.
   A clear glass layer hangs over them and reads them. Throwaway spike, not product code. */

const params = new URLSearchParams(location.search);
await Promise.all(['500 20px IS', '600 17px IS', '16px IS', '600 15px GM', '13px GM'].map((f) => document.fonts.load(f)));
const W = innerWidth, H = innerHeight;
const ACC = 0xc6ff3d;
const rnd = (() => { let a = 7; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.FogExp2(0x05060a, 0.045);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.08;

const camera = new THREE.PerspectiveCamera(29, W / H, 0.1, 90);
camera.position.set(0.3, 1.45, 11.8);
camera.lookAt(0.3, 0.12, 0);

/* ---------- canvas textures: the creator's signals (honest sample content) ---------- */
function tex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  return t;
}
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const blob = (g, x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(0, 0, g.canvas.width, g.canvas.height); };

function reel(seed) {
  return tex(576, 1024, (g, w, h) => { g.scale(2, 2); w /= 2; h /= 2;
    const hues = [[24, 40, 36], [18, 30, 52], [40, 22, 34], [20, 44, 58]][seed % 4];
    g.fillStyle = `rgb(${hues[0]},${hues[1]},${hues[2]})`; g.fillRect(0, 0, w, h);
    blob(g, w * (0.25 + 0.5 * ((seed * 37) % 10) / 10), h * 0.32, w * 0.8, 'rgba(198,255,61,A)', 0.28);
    blob(g, w * 0.7, h * 0.62, w * 0.9, 'rgba(80,120,255,A)', 0.2);
    blob(g, w * 0.3, h * 0.78, w * 0.7, 'rgba(255,150,80,A)', 0.18);
    g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.arc(w * 0.5, h * 0.38, 15, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.moveTo(w * 0.5 - 4, h * 0.38 - 7); g.lineTo(w * 0.5 + 8, h * 0.38); g.lineTo(w * 0.5 - 4, h * 0.38 + 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.86)';
    for (let i = 0; i < 3; i++) { rr(g, 16, h - 70 + i * 16, [150, 190, 110][i], 7, 3.5); g.fill(); }
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w - 26, h - 150 + i * 46, 11, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '600 15px GM, monospace'; g.fillText('0:' + (18 + (seed % 14)), 16, 30);
  });
}
function dm() {
  return tex(960, 576, (g, w, h) => { g.scale(2, 2); w /= 2; h /= 2;
    g.fillStyle = '#10131a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c6ff3d'; g.beginPath(); g.arc(34, 34, 14, 0, 7); g.fill();
    g.fillStyle = '#e9e7df'; g.font = '600 17px IS, sans-serif'; g.fillText('Tessera', 58, 31);
    g.fillStyle = '#7b7f88'; g.font = '13px GM, monospace'; g.fillText('brand message · sample', 58, 50);
    g.fillStyle = '#1b2029'; rr(g, 24, 74, w - 70, 118, 16); g.fill();
    g.fillStyle = '#d7d6cf'; g.font = '16px IS, sans-serif';
    ['Hey Arjun! We would love to work', 'with you on a launch campaign.', '1 Reel + 2 Stories · paid usage 30 days'].forEach((t, i) => g.fillText(t, 42, 108 + i * 28));
    g.fillStyle = '#c6ff3d'; g.font = '600 15px GM, monospace'; g.fillText('OFFER  ₹12,000', 26, 236);
  });
}
function stat(big, small, acc) {
  return tex(960, 576, (g, w, h) => { g.scale(2, 2); w /= 2; h /= 2;
    g.fillStyle = '#0e1117'; g.fillRect(0, 0, w, h);
    g.fillStyle = acc ? '#c6ff3d' : '#f3f0e8'; g.font = (big.length > 6 ? '500 84px' : '500 108px') + ' IS, sans-serif'; g.fillText(big, 28, 160);
    g.fillStyle = '#8c909a'; g.font = '15px GM, monospace'; g.fillText(small, 30, 214);
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; g.beginPath(); g.moveTo(28, 242); g.lineTo(w - 28, 242); g.stroke();
  });
}
function spark() {
  return tex(960, 576, (g, w, h) => { g.scale(2, 2); w /= 2; h /= 2;
    g.fillStyle = '#0e1117'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8c909a'; g.font = '15px GM, monospace'; g.fillText('PATTERN · EMERGING', 28, 40);
    g.strokeStyle = '#c6ff3d'; g.lineWidth = 4; g.beginPath();
    const pts = [200, 190, 196, 170, 176, 150, 128, 138, 96, 88, 56];
    pts.forEach((y, i) => { const x = 28 + (i * (w - 56)) / (pts.length - 1); i ? g.lineTo(x, y + 40) : g.moveTo(x, y + 40); }); g.stroke();
    g.fillStyle = '#f3f0e8'; g.font = '500 24px IS, sans-serif'; g.fillText('I replaced X with AI for 7 days', 28, 262);
  });
}
function audience() {
  return tex(960, 576, (g, w, h) => { g.scale(2, 2); w /= 2; h /= 2;
    g.fillStyle = '#0e1117'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 15; x++) { const hot = Math.hypot(x - 6, y - 3) < 3.2; g.fillStyle = hot ? '#c6ff3d' : '#2a2f3a'; g.beginPath(); g.arc(40 + x * 28, 50 + y * 25, hot ? 5 : 3.6, 0, 7); g.fill(); }
    g.fillStyle = '#f3f0e8'; g.font = '500 26px IS, sans-serif'; g.fillText('27.4K · 22 to 34 · Pune', 28, 268);
  });
}

/* ---------- floor (reflective, roughened by a dark veil) ---------- */
const mirror = new Reflector(new THREE.PlaneGeometry(80, 80), { color: 0x14161b, textureWidth: W / 2, textureHeight: H / 2, clipBias: 0.003 });
mirror.rotation.x = -Math.PI / 2;
scene.add(mirror);


/* ---------- signal tiles ---------- */
const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x07080c, metalness: 0.3, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.18 });
const world = new THREE.Group();
world.position.set(0.3, 0, 0);
world.scale.setScalar(1.0);
scene.add(world);
const tiles = [];
const KEY = { content: null, audience: null, trends: null, deals: null, perf: null };
function addTile({ w, h, map, x, y, z, ry = 0, rx = 0, rim = false, key }) {
  const g = new THREE.Group();
  if (rim) { const r = new THREE.Mesh(new RoundedBoxGeometry(w + 0.04, h + 0.04, 0.03, 3, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(ACC).multiplyScalar(0.78) })); r.position.z = -0.018; g.add(r); }
  const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.035, 4, 0.04), bodyMat); b.castShadow = true; b.receiveShadow = true; g.add(b);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.05, h - 0.05), new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: rim ? 0.85 : 0.5, roughness: 0.5, metalness: 0 }));
  f.position.z = 0.019; g.add(f);
  g.position.set(x, y, z); g.rotation.set(rx, ry, 0);
  world.add(g); tiles.push(g);
  if (key) KEY[key] = g;
  return g;
}
const reelTex = [0, 1, 2, 3, 4, 5, 6, 7].map(reel);
const dmTex = dm(), trendTex = spark(), audTex = audience();
const perfTex = stat('1.8x', 'PROOF-FIRST HOOKS · 2 POSTS', true);
const priceTex = stat('₹17.5K–24K', 'COUNTER · WALK AWAY BELOW ₹15,500', false);
const lenTex = stat('21s', 'YOUR BEST POSTS RUN ABOUT 21 SEC', false);

// the five hero signals (each gets an accent rim and a chip)
addTile({ w: 0.95, h: 1.7, map: reelTex[0], x: -3.1, y: 0.85, z: 0.5, ry: 0.3, rx: -0.1, rim: true, key: 'content' });
addTile({ w: 1.7, h: 1.02, map: audTex, x: -1.0, y: 0.6, z: -0.8, ry: 0.12, rx: -0.2, rim: true, key: 'audience' });
addTile({ w: 1.7, h: 1.02, map: trendTex, x: 1.5, y: 0.95, z: -1.3, ry: -0.16, rx: -0.14, rim: true, key: 'trends' });
addTile({ w: 1.7, h: 1.02, map: dmTex, x: 3.5, y: 0.55, z: 0.35, ry: -0.3, rx: -0.2, rim: true, key: 'deals' });
addTile({ w: 1.7, h: 1.02, map: perfTex, x: 0.9, y: 0.32, z: 0.75, ry: -0.06, rx: -0.3, rim: true, key: 'perf' });

// the scatter
const scatter = [
  [0.82, 1.46, reelTex[1], -4.6, 0.7, -1.4, 0.45], [0.82, 1.46, reelTex[2], -2.2, 0.8, -2.9, 0.2], [0.82, 1.46, reelTex[3], 4.9, 0.9, -1.5, -0.4],
  [0.82, 1.46, reelTex[4], 6.0, 0.55, 0.0, -0.6], [0.82, 1.46, reelTex[5], 0.0, 0.95, -3.5, 0.05], [0.82, 1.46, reelTex[6], 3.0, 1.05, -3.1, -0.15],
  [0.82, 1.46, reelTex[7], -5.9, 0.5, 0.3, 0.55], [1.4, 0.84, priceTex, -2.9, 0.16, 1.7, 0.3], [1.4, 0.84, lenTex, 5.0, 0.14, 1.4, -0.3],
  [0.7, 1.24, reelTex[2], -0.8, 0.1, 2.2, 0.2], [0.7, 1.24, reelTex[6], 2.0, 0.1, 2.1, -0.25], [0.7, 1.24, reelTex[3], 7.2, 0.8, -2.3, -0.5],
  [0.82, 1.46, reelTex[0], -3.8, 0.6, -4.5, 0.25], [0.82, 1.46, reelTex[5], 1.4, 0.7, -4.9, -0.1],
];
scatter.forEach(([w, h, map, x, y, z, ry]) => addTile({ w, h, map, x, y, z, ry, rx: -0.1 - rnd() * 0.15 }));

/* ---------- the glass layer ---------- */
const glass = new THREE.Mesh(
  new RoundedBoxGeometry(8.2, 3.0, 0.06, 6, 0.12),
  new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.12, transmission: 1, thickness: 0.55, ior: 1.46, clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 0.5, attenuationColor: new THREE.Color(0xe6ffb8), attenuationDistance: 5, envMapIntensity: 0.1 }),
);
glass.position.set(0.2, 1.4, 1.9);
glass.rotation.x = -0.1;
world.add(glass);
// lime edge light running along the glass rim
const edge = new THREE.Mesh(new RoundedBoxGeometry(8.26, 3.06, 0.012, 3, 0.13), new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0.0 }));
edge.position.copy(glass.position); edge.rotation.copy(glass.rotation); world.add(edge);
const frameLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-4.12, -1.52], [4.12, -1.52], [4.12, 1.52], [-4.12, 1.52]].map(([x, y]) => new THREE.Vector3(x, y, 0.038))), new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: 0.9 }));
frameLine.position.copy(glass.position); frameLine.rotation.copy(glass.rotation); world.add(frameLine);

// the etched Creator DNA network on the glass: nodes + links, brighter near the five signals
const toGlass = (m) => { const p = m.position.clone().sub(glass.position); p.applyEuler(new THREE.Euler(0.12, 0, 0)); return new THREE.Vector3(THREE.MathUtils.clamp(p.x * 0.98, -3.8, 3.8), THREE.MathUtils.clamp(p.y * 0.8 + 0.1, -1.25, 1.25), 0.04); };
const nodes = [];
Object.values(KEY).forEach((m) => nodes.push(toGlass(m)));
for (let i = 0; i < 26; i++) nodes.push(new THREE.Vector3((rnd() - 0.5) * 7.4, (rnd() - 0.5) * 2.4, 0.04));
const linkPts = [];
nodes.forEach((a, i) => { const near = nodes.map((b, j) => ({ j, d: a.distanceTo(b) })).filter((o) => o.j !== i).sort((p, q) => p.d - q.d).slice(0, i < 5 ? 3 : 2); near.forEach((o) => { if (o.j > i || i < 5) linkPts.push(a, nodes[o.j]); }); });
const links = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(linkPts), new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: 0.32 }));
links.position.copy(glass.position); links.rotation.copy(glass.rotation); world.add(links);
const dots = new THREE.Points(new THREE.BufferGeometry().setFromPoints(nodes), new THREE.PointsMaterial({ color: ACC, size: 0.075, sizeAttenuation: true }));
dots.position.copy(glass.position); dots.rotation.copy(glass.rotation); world.add(dots);

// the scan: a thin bright bar of light crossing the glass (position set by ?s=0..1)
const s = parseFloat(params.get('s') ?? '0.58');
const sweep = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 2.95), new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }));
sweep.position.set(-3.9 + s * 7.8, 0, 0.045); glass.add(sweep);
const core = new THREE.Mesh(new THREE.PlaneGeometry(0.014, 2.95), new THREE.MeshBasicMaterial({ color: 0xf0ffc0, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
core.position.set(-3.9 + s * 7.8, 0, 0.046); glass.add(core);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0x1a2233, 0x040508, 0.35));
const keyL = new THREE.SpotLight(0xdfe8ff, 150, 40, 0.5, 0.95, 1.3);
keyL.position.set(-5, 9, 5); keyL.target.position.set(0, 0, -0.5); keyL.castShadow = false; keyL.shadow.mapSize.set(2048, 2048); keyL.shadow.bias = -0.0004; keyL.shadow.radius = 5;
scene.add(keyL, keyL.target);
const acc1 = new THREE.PointLight(ACC, 16, 12, 1.8); acc1.position.set(5.6, 0.7, -2.6); scene.add(acc1);
const acc2 = new THREE.PointLight(ACC, 12, 10, 1.9); acc2.position.set(-5.2, 0.6, -2.4); scene.add(acc2);
const back = new THREE.DirectionalLight(0xbfc8e0, 0.55); back.position.set(2, 5, -7); scene.add(back);

/* ---------- post ---------- */
const composer = new EffectComposer(renderer);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.34, 0.45, 0.9));
composer.addPass(new OutputPass());

/* ---------- DOM chips pinned to the five signals ---------- */
const CHIPS = [['content', 'CONTENT'], ['audience', 'AUDIENCE'], ['trends', 'TRENDS'], ['deals', 'DEALS'], ['perf', 'PERFORMANCE']];
const chipsEl = document.getElementById('chips'), lead = document.getElementById('leaders');
function place() {
  camera.updateMatrixWorld();
  { const gp = new THREE.Vector3(); glass.getWorldPosition(gp); gp.y += 0.1; gp.project(camera); const m = document.getElementById('mark'); m.style.left = ((gp.x * 0.5 + 0.5) * W) + 'px'; m.style.top = ((-gp.y * 0.5 + 0.5) * H) + 'px'; }
  lead.innerHTML = ''; chipsEl.innerHTML = '';
  CHIPS.forEach(([k, name], i) => {
    const m = KEY[k]; const wp = new THREE.Vector3(); m.getWorldPosition(wp); const p = wp.clone().add(new THREE.Vector3(0, k === 'content' ? 1.15 : 0.78, 0.1)).project(camera);
    const x = (p.x * 0.5 + 0.5) * W, y = (-p.y * 0.5 + 0.5) * H;
    const base = wp.clone().project(camera); const bx = (base.x * 0.5 + 0.5) * W, by = (-base.y * 0.5 + 0.5) * H;
    const d = document.createElement('div'); d.className = 'chip'; d.style.left = x + 'px'; d.style.top = y + 'px'; d.innerHTML = `<span>${name}</span>`; chipsEl.appendChild(d);
    lead.insertAdjacentHTML('beforeend', `<line x1="${x}" y1="${y + 26}" x2="${bx}" y2="${by - 10}" stroke="rgba(198,255,61,.55)" stroke-width="1"/><circle cx="${bx}" cy="${by - 10}" r="2.6" fill="#c6ff3d"/>`);
  });
}

async function go() {
  composer.render();
  place();
  window.__done = true;
}
go();
window.__render = () => { composer.render(); };
