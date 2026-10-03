#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;      // sprite size in pixels
uniform vec2 uFull;
uniform vec2 uOrigin;
uniform float uNight;   // 0 dawn, 1 night
uniform float uSeed;
uniform float uWisp;    // 0..1, how long and thin the tails are

// A cumulus drawn as a 3D density field and lit by one light: puffs along a flat base, a tail of thin cloud, lumpy edges.
// The picture is 520 x 220 cloud units wide; +x is right, +v is down (as in the old SVG), z points at the viewer.

float hash11(float n) { return fract(sin(n * 127.1 + uSeed * 31.7) * 43758.5453); }
float hash13(vec3 p3) { p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vnoise3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  vec3 u = f * f * (3. - 2. * f);
  float n000 = hash13(i + uSeed), n100 = hash13(i + vec3(1, 0, 0) + uSeed), n010 = hash13(i + vec3(0, 1, 0) + uSeed), n110 = hash13(i + vec3(1, 1, 0) + uSeed);
  float n001 = hash13(i + vec3(0, 0, 1) + uSeed), n101 = hash13(i + vec3(1, 0, 1) + uSeed), n011 = hash13(i + vec3(0, 1, 1) + uSeed), n111 = hash13(i + vec3(1, 1, 1) + uSeed);
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}
float fbm3(vec3 p, int oct) {
  float a = .5, s = 0., n = 0.;
  for (int i = 0; i < 5; i++) { if (i >= oct) break; s += a * vnoise3(p); n += a; p = p * 2.03 + vec3(7.1, 3.3, 1.9); a *= .5; }
  return s / n;
}
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }

const int NP = 13;
float shape(vec3 p) {
  float d = 1e3;
  for (int i = 0; i < NP; i++) {
    float t = float(i) / float(NP - 1);
    float hump = sin(3.14159 * (.08 + .84 * t));
    float rad = 26. + 74. * hump * (.75 + .35 * hash11(float(i) * 3.7 + 1.));
    float cx = 70. + t * 380. + (hash11(float(i) * 7.3 + 2.) - .5) * 18.;
    float cy = 170. - rad * .62;
    float cz = (hash11(float(i) * 5.1 + 3.) - .5) * 70.;
    d = smin(d, length(p - vec3(cx, cy, cz)) - rad * .86, 22.);
  }
  // flat base
  d = max(d, p.y - 172.);
  return d;
}
float density(vec3 p) {
  float d = shape(p);
  // cauliflower: big lumps and a finer boil on top of them
  d += (fbm3(p * .028, 3) - .5) * 46. + (fbm3(p * .085 + 4.1, 3) - .5) * 15. + (fbm3(p * .22 + 1.7, 2) - .5) * 5.;
  float core = smoothstep(3., -16., d);
  // a long thin tail near the base, torn into pieces
  vec3 q = (p - vec3(250., 176., 0.)) / vec3(255., 9. + 6. * uWisp, 60.);
  float wd = length(q) - 1.;
  float tail = smoothstep(.25, -.7, wd + (fbm3(p * vec3(.02, .09, .02) + 9., 3) - .5) * .9) * (.28 + .3 * uWisp);
  vec3 q2 = (p - vec3(110., 181., 0.)) / vec3(130., 5., 40.);
  float tail2 = smoothstep(.2, -.6, length(q2) - 1. + (fbm3(p * vec3(.03, .12, .03) + 3., 2) - .5) * .8) * .22;
  float edge = smoothstep(0., 60., p.x) * smoothstep(520., 460., p.x);
  return max(core, max(tail, tail2)) * mix(1., edge, step(.001, 1. - core));
}

vec3 lightDir() { return uNight > .5 ? normalize(vec3(.62, -.55, .55)) : normalize(vec3(-.74, -.5, .45)); }

void main() {
  vec2 frag = gl_FragCoord.xy + uOrigin;
  vec2 uv = vec2(frag.x / uFull.x * 520., (uFull.y - frag.y) / uFull.y * 220.);
  vec3 L = lightDir();
  bool night = uNight > .5;
  vec3 sunCol = night ? vec3(.40, .50, .86) * .5 : vec3(1.0, .88, .70) * 1.55;
  vec3 skyTop = night ? vec3(.035, .05, .15) : vec3(.62, .70, .86);
  vec3 skyLow = night ? vec3(.02, .03, .09) : vec3(.86, .74, .76);
  float T = 1.;
  vec3 acc = vec3(0.);
  const int NS = 44;
  float z0 = 120., dz = 240. / float(NS);
  for (int i = 0; i < NS; i++) {
    float z = z0 - (float(i) + .5) * dz + (hash13(vec3(frag, float(i))) - .5) * dz * .6;
    vec3 p = vec3(uv, z);
    float rho = density(p);
    if (rho < .003) continue;
    float sigma = rho * .052;
    // how much light reaches this point from the sun
    float tl = 0.;
    for (int k = 1; k <= 5; k++) tl += density(p + L * float(k) * 15.) * 15.;
    float tr = exp(-tl * .052);
    float powder = 1. - exp(-sigma * dz * 6.);
    // forward-ish scattering: brighter looking toward the light
    float cosv = L.z;
    float phase = .55 + .45 * pow(max(cosv, 0.), 2.);
    float h = clamp((uv.y - 20.) / 160., 0., 1.);                 // 0 at the top of the cloud, 1 at its base
    vec3 amb = mix(skyTop, skyLow, h) * (night ? 1.0 : .62);
    vec3 col = sunCol * tr * phase * (.6 + .55 * powder) + amb * (.38 + .4 * (1. - h) * (1. - tr));
    // the flat underside is the darkest part
    col *= mix(1., .62, smoothstep(.55, 1., h));
    float a = 1. - exp(-sigma * dz);
    acc += T * a * col;
    T *= 1. - a;
    if (T < .01) break;
  }
  float alpha = 1. - T;
  vec3 c = alpha > .001 ? acc / alpha : vec3(0.);
  c = pow(clamp(c, 0., 1.), vec3(1. / 2.2));
  fragColor = vec4(c * alpha, alpha);
}
