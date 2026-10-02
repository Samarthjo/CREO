/** Ground colour #07080B in sRGB. The page behind the canvas is this colour, so the frame fades to it. */
export const GROUND_HEX = 0x07080b;

/** Shared with every material that appears in the floor reflection: 1 while the mirrored view is rendered. */
export const mirrorUniform = { value: 0 };

interface PatchableShader {
  uniforms: Record<string, { value: unknown }>;
  vertexShader: string;
  fragmentShader: string;
}

/**
 * In the mirrored pass each surface dims with its height above the floor, and the alpha channel carries that height, so
 * the floor can blur the reflection more the higher it is (sharp at the contact line, soft and dim higher up) without
 * extra geometry.
 */
export function heightToAlpha(shader: PatchableShader) {
  shader.uniforms.uMirror = mirrorUniform;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying float vHeight;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHeight = (modelMatrix * vec4(transformed, 1.0)).y;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vHeight;\nuniform float uMirror;")
    .replace(
      "#include <opaque_fragment>",
      "#include <opaque_fragment>\ngl_FragColor.rgb *= mix(1.0, pow(clamp(1.0 - vHeight / 1.15, 0.0, 1.0), 1.5), uMirror);\ngl_FragColor.a = mix(1.0, 0.002 + max(vHeight, 0.0) * 0.25, uMirror);",
    );
}

/** A soft cool glow behind the scene, in screen space. The backdrop and the floor's far fade both use it, so the horizon never shows a seam. */
const glowFn = /* glsl */ `
uniform vec3 uGlowCol;
uniform vec4 uGlowAt;
vec3 glowAt(vec2 uv) {
  vec2 d = (uv - uGlowAt.xy) / uGlowAt.zw;
  return uGlowCol * exp(-dot(d, d));
}`;

export const backdropVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }`;

export const backdropFragment = /* glsl */ `
uniform vec3 uGroundLinear;
varying vec2 vUv;
${glowFn}
void main() {
  gl_FragColor = vec4(uGroundLinear + glowAt(vUv), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const floorVertex = /* glsl */ `
uniform mat4 uTexMat;
varying vec4 vRefl;
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vRefl = uTexMat * wp;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

/**
 * Obsidian floor. The reflection is Fresnel weighted (weak underfoot, strong at a grazing angle), contact hardening
 * (blur grows with the height of what is reflected, read from the mirror target's alpha), anisotropic (stretched
 * vertically like a polished but not perfect surface) and fades into the ground colour with distance.
 */
export const floorFragment = /* glsl */ `
uniform sampler2D tRefl;
uniform vec3 uCam;
uniform vec3 uGround;
uniform float uTaps;
uniform vec4 uQuiet;
uniform vec2 uRes;
uniform vec2 uTexel;
uniform float uGlassX;
uniform float uDither;
varying vec4 vRefl;
varying vec3 vWorld;
${glowFn}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  vec3 V = normalize(uCam - vWorld);
  float c = clamp(V.y, 0.0, 1.0);
  float F = 0.05 + 0.95 * pow(1.0 - c, 5.0);
  vec2 uv = vRefl.xy / vRefl.w;
  vec4 c0 = textureLod(tRefl, uv, 1.5);
  float h0 = max((c0.a - 0.002) * 4.0, 0.0);
  // contact hardening: sharp where the tile meets the floor, soft higher up
  float lod = mix(0.0, 4.6, smoothstep(0.0, 0.8, h0)) * (0.75 + 0.5 * (1.0 - c));
  float stepUv = exp2(lod) * uTexel.y * 0.9;
  vec3 acc = vec3(0.0);
  float n = 0.0;
  for (int i = -3; i <= 3; i++) {
    if (abs(float(i)) > uTaps) continue;
    vec4 s = textureLod(tRefl, uv + vec2(0.0, float(i) * stepUv), lod);
    float w = exp(-0.3 * float(i * i));
    acc += s.rgb * w;
    n += w;
  }
  vec3 refl = acc / n;

  vec2 sc = gl_FragCoord.xy / uRes;
  float quiet = 1.0 - 0.96 * smoothstep(0.0, 0.05, sc.x - uQuiet.x) * smoothstep(0.0, 0.08, uQuiet.z - sc.x) * smoothstep(0.0, 0.08, (1.0 - sc.y) - uQuiet.y) * smoothstep(0.0, 0.08, uQuiet.w - (1.0 - sc.y));

  float dist = length(vWorld.xz - uCam.xz);
  float fog = 1.0 - smoothstep(14.0, 40.0, dist);
  // a faint pool of cool light under the scene and a lime spill under the pane
  vec2 q = (vWorld.xz - vec2(0.3, -1.0)) / vec2(6.0, 4.0);
  float pool = exp(-dot(q, q));
  vec2 g = (vWorld.xz - vec2(uGlassX, 2.6)) / vec2(2.8, 1.0);
  float spill = exp(-dot(g, g));
  vec3 base = uGround * 0.55 + vec3(0.010, 0.014, 0.022) * pool + vec3(0.020, 0.030, 0.004) * spill;
  // polish: faint streaks along the surface so the reflection is not a perfect digital mirror
  float polish = 0.86 + 0.28 * vnoise(vec2(vWorld.x * 0.5, vWorld.z * 7.0)) * vnoise(vec2(vWorld.x * 2.0 + 9.0, vWorld.z * 0.9));
  vec3 col = base + refl * F * quiet * vec3(0.9, 1.0, 0.95) * polish;
  col = mix(uGround + glowAt(sc), col, fog);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb += uDither * (hash(gl_FragCoord.xy) + hash(gl_FragCoord.yx + 17.0) - 1.0) / 255.0;
}`;

export const overlayVertex = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/**
 * Everything etched or lit on the glass face, drawn additively: the edge light, the specular streak, the Creator DNA
 * network, the CREO mark and the scanning bar. The plane is the face plus its bevel; the etch map covers the face only.
 * The bar lights the lines it crosses.
 */
export const overlayFragment = /* glsl */ `
uniform sampler2D tEtch;
uniform vec2 uSize;
uniform float uBevel;
uniform float uR;
uniform float uMem;
uniform float uSweep;
uniform float uAmt;
uniform float uEdge;
uniform float uStreak;
uniform vec3 uLime;
varying vec2 vP;

float sdRR(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = vP;
  float dOut = sdRR(p, uSize * 0.5 + uBevel, uR + uBevel);
  if (dOut > 0.0) discard;
  float dCap = sdRR(p, uSize * 0.5, uR);
  vec3 e = texture2D(tEtch, clamp(p / uSize + 0.5, 0.0, 1.0)).rgb;

  // edge light: the polished edge glows and the light fades inward; a hairline marks where the bevel begins. The
  // light enters at the top-left and bottom-right corners, so it is not a uniform neon tube.
  float diag = dot(normalize(p + 1e-4), normalize(vec2(-1.0, 0.45)));
  float side = 0.3 + 0.7 * pow(abs(diag), 1.6);
  float hair = exp(-pow((dCap + 0.004) / 0.005, 2.0)) * 0.3 * (0.5 + 0.5 * side);
  float rimLine = exp(-pow((dOut + 0.012) / 0.012, 2.0));
  float glow = exp(dOut / 0.1) * 0.05 + exp(dOut / 0.5) * 0.006;
  vec3 col = mix(uLime, vec3(1.0), 0.4) * (hair + (rimLine * 0.5 + glow) * side) * uEdge;

  // network and mark. The network brightens as the story builds memory.
  float mem = 0.55 + 0.45 * uMem;
  col += uLime * e.r * 0.95 * mem;
  col += mix(uLime, vec3(1.0), 0.45) * e.g * 1.3 * mem;
  float edgeM = smoothstep(0.42, 0.9, e.b);
  col += mix(uLime, vec3(1.0, 1.0, 0.9), 0.55) * edgeM * 0.95;
  col += vec3(0.82, 0.92, 0.7) * smoothstep(0.0, 0.42, e.b) * 0.05;

  // the specular streak of a tall strip light, a soft band with two crisp edges, fading toward the bottom
  float xs = p.x / uSize.x + p.y / uSize.x * 0.45 - uStreak;
  float lowFade = 0.4 + 0.6 * smoothstep(-0.5, 0.3, p.y / uSize.y);
  vec3 streak = vec3(0.0);
  for (int c = 0; c < 3; c++) {
    // a hair of dispersion: each colour channel sees the crisp lines at a slightly different place
    float xc = xs + (float(c) - 1.0) * 0.0016;
    float s = exp(-pow((xc - 0.2) / 0.05, 2.0)) * 0.12 + exp(-pow((xc - 0.285) / 0.011, 2.0)) * 0.5 + exp(-pow((xc - 0.31) / 0.0035, 2.0)) * 0.4;
    streak[c] = s;
  }
  col += vec3(0.84, 0.93, 1.0) * streak * lowFade * uEdge;
  col += vec3(0.7, 0.8, 0.9) * 0.03 * smoothstep(0.1, 0.5, p.y / uSize.y) * uEdge;

  // the scanning bar: a slanted hairline with a soft halo; lines and nodes flare where it crosses
  float sx = p.x + p.y * 0.16;
  float sd = abs(sx - uSweep);
  float core = exp(-pow(sd / 0.007, 2.0));
  float halo = exp(-pow(sd / 0.28, 2.0));
  float blade = exp(-pow(sd / 0.05, 2.0));
  float near = exp(-pow(sd / 0.09, 2.0));
  col += vec3(0.95, 1.0, 0.78) * core * 1.6 * uAmt;
  col += uLime * (halo * 0.16 + blade * 0.22) * uAmt;
  col += uLime * (e.r * 2.2 + e.g * 2.6) * near * uAmt;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Edge fade shared by the post pass and the direct-render quad: 1 inside, 0 at the frame's edge. */
const edgeMask = /* glsl */ `
float edgeMask(vec2 uv) {
  float x = smoothstep(0.0, 0.05, uv.x) * smoothstep(0.0, 0.05, 1.0 - uv.x);
  float y = smoothstep(0.0, 0.07, uv.y) * smoothstep(0.0, 0.14, 1.0 - uv.y);
  return x * y;
}`;

export const finishShader = {
  name: "LayerFinish",
  uniforms: {
    tDiffuse: { value: null as unknown },
    uFade: { value: 0 },
    uGround: { value: null as unknown },
  },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uFade;
uniform vec3 uGround;
varying vec2 vUv;
${edgeMask}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  vec3 col = mix(uGround, c, edgeMask(vUv) * (1.0 - uFade));
  col += (hash(gl_FragCoord.xy) + hash(gl_FragCoord.yx + 17.0) - 1.0) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`,
};

/** Tier 2 draws straight to the canvas, so the same fade is a full-screen triangle blended over the finished frame. */
export const quadVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export const quadFragment = /* glsl */ `
uniform float uFade;
uniform vec3 uGroundLinear;
varying vec2 vUv;
${edgeMask}
void main() {
  gl_FragColor = vec4(uGroundLinear, 1.0 - edgeMask(vUv) * (1.0 - uFade));
  #include <colorspace_fragment>
}`;
