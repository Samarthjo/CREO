#version 300 es
precision highp float;
precision highp sampler2D;
out vec4 fragColor;
uniform vec2 uRes;      // size of this render target
uniform vec2 uFull;     // size of the whole picture
uniform vec2 uOrigin;   // where this render sits inside the whole picture
uniform float uNight;   // 0 dawn, 1 night
uniform float uSS;      // samples per axis (anti-aliasing)
uniform float uDebug;
uniform sampler2D uDem; // elevation, metres
uniform vec2 uDemSize;  // texels
uniform vec2 uCamPix;   // camera position in the elevation grid (texels, x east, y south)
uniform float uMpp;     // metres per texel
uniform float uAz;      // view direction, radians clockwise from north
uniform float uLake;    // lake surface, metres
uniform float uTan;     // tan of half the horizontal field of view
uniform float uHor;     // where the lake meets the sky, as a fraction of the picture height from the bottom
uniform float uSnow;    // snow line, metres above the lake
uniform float uTree;    // tree line, metres above the lake

#define PI 3.14159265359
float TANH() { return uTan > 0. ? uTan : .4663; }
float HORIZON() { return uHor > 0. ? uHor : .309; }
const float CAMY = 0.012;      // camera height above the lake, km

// ---------------------------------------------------------------- noise
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float hash13(vec3 p3) { p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 x) {
  vec2 i = floor(x), f = fract(x);
  vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);
  float a = hash12(i), b = hash12(i + vec2(1, 0)), c = hash12(i + vec2(0, 1)), d = hash12(i + vec2(1, 1));
  return a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y;
}
float vnoise3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  vec3 u = f * f * (3. - 2. * f);
  float n000 = hash13(i), n100 = hash13(i + vec3(1, 0, 0)), n010 = hash13(i + vec3(0, 1, 0)), n110 = hash13(i + vec3(1, 1, 0));
  float n001 = hash13(i + vec3(0, 0, 1)), n101 = hash13(i + vec3(1, 0, 1)), n011 = hash13(i + vec3(0, 1, 1)), n111 = hash13(i + vec3(1, 1, 1));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}
const mat2 M2 = mat2(.8, -.6, .6, .8);
float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = M2 * p * 2.02; a *= .5; } return s; }
float fbm3(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = M2 * p * 2.02; a *= .5; } return s / .875; }

// ---------------------------------------------------------------- the elevation grid
ivec2 clampT(ivec2 i) { return clamp(i, ivec2(0), ivec2(uDemSize) - 1); }
float texel(ivec2 i) { return texelFetch(uDem, clampT(i), 0).r; }
vec2 demPix(vec2 p) {                       // p: x to the right, z ahead, in km from the camera
  float c = cos(uAz), s = sin(uAz);
  vec2 en = vec2(p.x * c + p.y * s, -p.x * s + p.y * c);   // east, north
  return uCamPix + vec2(en.x, -en.y) * (1000. / uMpp);
}
float demLin(vec2 pix) {
  vec2 g = pix - .5; vec2 f = fract(g); ivec2 i = ivec2(floor(g));
  return mix(mix(texel(i), texel(i + ivec2(1, 0)), f.x), mix(texel(i + ivec2(0, 1)), texel(i + ivec2(1, 1)), f.x), f.y);
}
vec4 cubicW(float t) {
  float t2 = t * t, t3 = t2 * t;
  return vec4(-.5 * t3 + t2 - .5 * t, 1.5 * t3 - 2.5 * t2 + 1., -1.5 * t3 + 2. * t2 + .5 * t, .5 * t3 - .5 * t2);
}
float demCub(vec2 pix) {
  vec2 g = pix - .5; vec2 f = fract(g); ivec2 i = ivec2(floor(g)) - 1;
  vec4 wx = cubicW(f.x), wy = cubicW(f.y);
  float s = 0.;
  for (int j = 0; j < 4; j++) {
    float r = texel(i + ivec2(0, j)) * wx.x + texel(i + ivec2(1, j)) * wx.y + texel(i + ivec2(2, j)) * wx.z + texel(i + ivec2(3, j)) * wx.w;
    s += r * wy[j];
  }
  return s;
}
float edgeFade(vec2 pix) {                  // lowers the ground at the edge of the data so no wall shows
  vec2 d = min(pix, uDemSize - pix);
  return smoothstep(0., 60., min(d.x, d.y));
}

// ---------------------------------------------------------------- fine detail: rock, trees
float detailM(vec2 pm, float fwm) {         // metres; fades out as it gets finer than a pixel
  float s = 0., a = 2.4, f = 1. / 42.;
  for (int i = 0; i < 5; i++) {
    float fade = clamp(1.5 - f * fwm * 2.2, 0., 1.);
    float n = vnoise(pm * f);
    float r = 1. - abs(2. * n - 1.);
    s += a * fade * (r * r - .33);
    a *= .5; f *= 2.1; pm = M2 * pm + vec2(17.3, 5.1);
  }
  return s;
}
float canopyM(vec2 pm, out float shade) {   // little conifers on two jittered grids; metres above ground
  float best = 0.; shade = .5;
  for (int L = 0; L < 2; L++) {
    float S = L == 0 ? 7.4 : 4.6;
    float Hs = L == 0 ? 1. : .55;
    float o = float(L) * 31.;
    vec2 q = pm / S + vec2(float(L) * 3.7, float(L) * 8.1);
    vec2 i = floor(q), f = fract(q);
    for (int j = -1; j <= 1; j++) for (int k = -1; k <= 1; k++) {
      vec2 g = i + vec2(k, j);
      vec3 hh = vec3(hash12(g + o), hash12(g + 11.7 + o), hash12(g + 23.1 + o));
      if (hh.z < .12) continue;
      vec2 c = vec2(k, j) + .1 + .8 * hh.xy - f;
      float H = (9. + 16. * hh.x * hh.y + 4. * hh.z) * Hs;
      float R = .21 * H / S;
      float d = length(c) / R;
      float cone = H * (1. - d) * (1. - .1 * d);
      if (cone > best) { best = cone; shade = hh.y; }
    }
  }
  return max(best, 0.);
}
float forestAmount(float hm, float slope, float nz) {
  float line = uTree * (.80 + .35 * nz);
  return smoothstep(line, line - 140., hm) * smoothstep(.62, .32, slope) * smoothstep(1.5, 9., hm);
}

// Streaky noise along direction d (a unit vector): blends the two nearest of eight fixed orientations, so it never swirls.
float anisoNoise(vec2 pm, vec2 d, float lam, float stretch, float seed) {
  float t = atan(d.y, d.x) / (PI / 8.);
  t = mod(t, 8.);
  float i0 = floor(t), f = fract(t);
  float a0 = i0 * PI / 8., a1 = (i0 + 1.) * PI / 8.;
  vec2 d0 = vec2(cos(a0), sin(a0)), d1 = vec2(cos(a1), sin(a1));
  float n0 = vnoise(vec2(dot(pm, vec2(-d0.y, d0.x)) / lam, dot(pm, d0) / (lam * stretch)) + i0 * 5.7 + seed);
  float n1 = vnoise(vec2(dot(pm, vec2(-d1.y, d1.x)) / lam, dot(pm, d1) / (lam * stretch)) + (i0 + 1.) * 5.7 + seed);
  return mix(n0, n1, f * f * (3. - 2. * f));
}

vec2 slopeGrad(vec2 p) {                    // camera-space gradient of the ground, metres per metre (smoothed over ~60 m)
  vec2 pix = demPix(p);
  float ge = (demLin(pix + vec2(2., 0.)) - demLin(pix - vec2(2., 0.))) / (4. * uMpp);
  float gn = -(demLin(pix + vec2(0., 2.)) - demLin(pix - vec2(0., 2.))) / (4. * uMpp);
  float c = cos(uAz), s = sin(uAz);
  return vec2(ge * c - gn * s, ge * s + gn * c);
}
// Gullies that run down the fall line, like the water-cut grooves of a real rock face.
float gullyM(vec2 pm, vec2 gc, float fwm) {
  float sl = length(gc);
  if (sl < .3) return 0.;
  vec2 d = -gc / sl;
  float s = 0., amp = 7., lam = 110.;
  for (int i = 0; i < 3; i++) {
    float fade = clamp(lam / (fwm * 4.) - .3, 0., 1.);
    float n = anisoNoise(pm, d, lam, 4.5, float(i) * 3.1);
    float r = 1. - abs(2. * n - 1.);
    s += amp * fade * (r * r - .3);
    amp *= .5; lam *= .48;
  }
  return s * smoothstep(.35, .95, sl);
}

// ---------------------------------------------------------------- terrain (units: km above the lake)
float terrainCoarse(vec2 p) {
  vec2 pix = demPix(p);
  float hm = demLin(pix) - uLake;
  float water = smoothstep(.15, 2.2, hm);
  return mix(-.02, hm * .001, water) * edgeFade(pix) - (1. - edgeFade(pix)) * .4;
}
float terrainFine(vec2 p, float fwm, bool withCanopy) {
  vec2 pix = demPix(p);
  float hm = demCub(pix) - uLake;
  float water = smoothstep(.15, 2.2, hm);
  vec2 g = vec2(demLin(pix + vec2(1., 0.)) - demLin(pix - vec2(1., 0.)), demLin(pix + vec2(0., 1.)) - demLin(pix - vec2(0., 1.))) / (2. * uMpp);
  float slope = length(g);
  vec2 pm = p * 1000.;
  float rough = smoothstep(.22, .85, slope) * smoothstep(8., 80., hm);
  float h = hm + detailM(pm, fwm) * rough;
  if (slope > .3 && hm > 40.) h += gullyM(pm, slopeGrad(p), fwm);
  // wind-packed snow and open ground: shallow ripples that only show in raking light
  float soft = (1. - smoothstep(.15, .5, slope)) * smoothstep(60., 400., hm);
  h += soft * (.45 * (vnoise(pm / 6.5) - .5) + .22 * (vnoise(pm / 2.7 + 9.) - .5) * (1. - smoothstep(1.5, 4., fwm)));
  if (withCanopy && fwm < 6.) {
    float nz = fbm3(pm * .0011);
    float fa = forestAmount(hm, slope, nz);
    if (fa > .01) {
      float sh;
      float c = canopyM(pm, sh);
      h += c * smoothstep(.0, .55, fa) * (1. - smoothstep(3.5, 6., fwm));
    }
  }
  float e = edgeFade(pix);
  return (mix(-20., h, water) * .001) * e - (1. - e) * .4;
}

// ---------------------------------------------------------------- lighting set-up per time of day
vec3 sunDir() { return uNight > .5 ? normalize(vec3(.90, .36, -.10)) : normalize(vec3(-.95, .22, -.12)); }
vec3 moonDirVisible() { return normalize(vec3(.1975, .2839, 1.)); }
vec3 sunSkyDir() { return normalize(vec3(-.55, .10, .83)); }

vec3 skyColor(vec3 rd) {
  float y = clamp(rd.y, 0., 1.);
  if (uNight > .5) {
    vec3 top = vec3(.0022, .0040, .024), hor = vec3(.016, .030, .105);
    vec3 c = mix(hor, top, pow(smoothstep(0., .62, y), .62));
    vec3 m = moonDirVisible();
    float mu = max(dot(rd, m), 0.);
    c += vec3(.55, .62, .95) * (.30 * pow(mu, 260.) + .05 * pow(mu, 34.) + .010 * pow(mu, 5.));
    return c;
  }
  vec3 top = vec3(.20, .31, .48), mid = vec3(.50, .61, .72), hor = vec3(.83, .78, .70);
  vec3 c = mix(hor, mid, smoothstep(0., .16, y));
  c = mix(c, top, smoothstep(.12, .75, y));
  vec3 s = sunSkyDir();
  float mu = max(dot(rd, s), 0.);
  c += vec3(1., .66, .40) * (.34 * pow(mu, 3.) + .40 * pow(mu, 14.) + .5 * pow(mu, 90.)) * (1. - .55 * smoothstep(0., .6, y));
  c += vec3(.90, .55, .33) * .15 * smoothstep(.25, -.45, rd.x) * exp(-y * 6.);
  return c;
}

vec3 starField(vec2 frag, vec3 rd) {
  if (uNight < .5) return vec3(0.);
  float sc = uFull.x / 1600.;
  vec2 q = frag / (9. * sc);
  vec2 id = floor(q), f = fract(q);
  vec3 col = vec3(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = id + vec2(i, j);
    float r = hash12(g + 17.);
    if (r > .135) continue;
    vec2 pos = vec2(i, j) + hash22(g + 3.) - f;
    float mag = pow(hash12(g + 41.), 3.2);
    float rad = (.040 + .095 * mag) * 9. * sc;
    float d = length(pos) * 9. * sc;
    float core = exp(-d * d / (rad * rad));
    float halo = mag > .62 ? .22 * exp(-d / (rad * 2.4)) * mag : 0.;
    float b = (.25 + 1.6 * mag) * (core + halo);
    float temp = hash12(g + 77.);
    vec3 tint = mix(vec3(.72, .82, 1.), vec3(1., .88, .70), smoothstep(.55, 1., temp));
    col += tint * b;
  }
  vec2 uv = frag / uFull;
  float along = (uv.x - .5) * .9 + (uv.y - .5) * .62;
  float band = exp(-along * along / (2. * .075 * .075));
  float dust = fbm(frag / (sc * 38.) + 3.7);
  float grain = pow(hash12(floor(frag / (.9 * sc)) + 5.3), 9.);
  col += vec3(.62, .72, 1.) * band * (grain * .9 + .06 * dust * dust) * (.35 + .65 * dust);
  float horizonFade = smoothstep(.015, .16, rd.y);
  vec3 m = moonDirVisible();
  float moonWash = 1. - .9 * smoothstep(0., .5, pow(max(dot(rd, m), 0.), 5.) * 4.);
  return col * horizonFade * moonWash;
}

vec3 moonDisc(vec2 frag) {
  if (uNight < .5) return vec3(0.);
  float sc = uFull.x / 1600.;
  vec2 c = vec2(1140., 900. - 135.) * sc;
  vec2 d = (frag - c) / (sc * 30.);
  float r = length(d);
  float edge = smoothstep(1.02, .985, r);
  vec2 q = d;
  float mare = smoothstep(.44, .62, fbm(q * 1.7 + 3.1) * .7 + fbm(q * 3.4) * .3);
  vec2 cq = q * 9.; vec2 ci = floor(cq), cf = fract(cq);
  float md = 9.; for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = ci + vec2(i, j); vec2 o = hash22(g); float dd = length(vec2(i, j) + o - cf); md = min(md, dd); }
  float crater = smoothstep(.26, .12, md) * .10 - smoothstep(.34, .26, md) * .04;
  float albedo = mix(.90, .50, mare) + crater + (fbm(q * 14.) - .5) * .12;
  float limb = 1. - .22 * pow(clamp(r, 0., 1.), 3.);
  return vec3(.96, .95, 1.0) * albedo * limb * 1.9 * edge;
}

// ---------------------------------------------------------------- marching
float rayTerrain(vec3 ro, vec3 rd, float tMax, float fwk, out float tw) {
  tw = rd.y < -1e-5 ? -ro.y / rd.y : 1e9;
  float t = .02;
  for (int i = 0; i < 560; i++) {
    if (t >= tw) return -2.;
    vec3 p = ro + rd * t;
    float dy = p.y - terrainCoarse(p.xz);
    if (dy < .08 && !(uDebug > 1.5 && uDebug < 2.5)) dy = p.y - terrainFine(p.xz, t * fwk * 1000., true);
    if (dy < .00010 * t + .00015) return t;
    if (p.y > 6. && rd.y > 0.) return -1.;
    t += clamp(.42 * dy, .00022 * t, 1.0);
    t = min(t, tw + 1e-5);
    if (t > tMax) return -1.;
  }
  return -1.;
}
float softShadow(vec3 p, vec3 l, float t0) {
  float res = 1., t = .012 + .0004 * t0;
  for (int i = 0; i < 44; i++) {
    vec3 q = p + l * t;
    float h = q.y - terrainCoarse(q.xz);
    res = min(res, 10. * h / t);
    t += clamp(h * .5, .02, .6);
    if (res < .02 || q.y > 6.) break;
  }
  return clamp(res, 0., 1.);
}
vec3 terrainNormal(vec3 p, float fw, bool canopy) {
  float e = max(.6 * fw, .0005);
  float fwm = fw * 1000.;
  vec2 q = p.xz;
  float hx = terrainFine(q + vec2(e, 0.), fwm, canopy) - terrainFine(q - vec2(e, 0.), fwm, canopy);
  float hz = terrainFine(q + vec2(0., e), fwm, canopy) - terrainFine(q - vec2(0., e), fwm, canopy);
  return normalize(vec3(-hx, 2. * e, -hz));
}
float cavity(vec3 p, float h0, float fw) {
  float r = max(.03, 6. * fw);
  float s = 0.;
  s += terrainCoarse(p.xz + vec2(r, 0.)); s += terrainCoarse(p.xz - vec2(r, 0.));
  s += terrainCoarse(p.xz + vec2(0., r)); s += terrainCoarse(p.xz - vec2(0., r));
  float d = (s * .25 - h0) / r;
  return clamp(1. - 1.1 * d, .3, 1.15);
}

float detail3(vec3 p, float fw) {
  float a = .5, s = 0., f = 40.;
  for (int i = 0; i < 5; i++) {
    float fade = clamp(1.2 - f * fw * 1.6, 0., 1.);
    s += a * (vnoise3(p * f) - .5) * fade;
    a *= .55; f *= 2.1;
  }
  return s;
}

vec3 shadeTerrain(vec3 p, vec3 n, vec3 nb, vec3 rd, float t, float fw) {
  bool night = uNight > .5;
  vec3 L = sunDir();
  float hm = p.y * 1000.;                         // metres above the lake
  float slope = 1. - nb.y;
  float nz = fbm3(p.xz * 6.);
  float d3 = detail3(vec3(p.x, p.y * 1.3, p.z), fw);
  // rock in layers: two greys and a warm band
  vec3 rockA = night ? vec3(.17, .19, .27) : vec3(.30, .28, .26);
  vec3 rockB = night ? vec3(.075, .088, .15) : vec3(.13, .125, .125);
  vec3 rockC = night ? vec3(.12, .12, .2) : vec3(.36, .29, .22);
  float mixRock = clamp(nz * .5 + d3 * .6 + .1, 0., 1.);
  vec2 gcs = slopeGrad(p.xz);
  vec2 dd = length(gcs) > .05 ? -normalize(gcs) : vec2(0., -1.), qq = vec2(-dd.y, dd.x);
  vec2 pmm = p.xz * 1000.;
  float streak = anisoNoise(pmm, dd, 11., 6., 1.) * .6 + anisoNoise(pmm, dd, 4., 6., 2.) * .4;
  mixRock = clamp(mixRock + (streak - .5) * .8, 0., 1.);
  vec3 alb = mix(rockA, rockB, mixRock);
  alb = mix(alb, rockC, smoothstep(.55, .85, fbm3(vec2(hm * .006, p.x * .8 + 3.))) * .5);
  // trees
  float fa = forestAmount(hm, slope * 1.35, nz);
  vec3 forest = night ? vec3(.014, .030, .042) : vec3(.020, .042, .034);
  float treeShade = .5;
  if (fa > .05 && fw * 1000. < 7.) canopyM(p.xz * 1000., treeShade);
  vec3 fcol = forest * (.55 + .8 * d3 + .6 * nz) * mix(.6, 1.5, treeShade);
  fcol *= mix(vec3(1.), vec3(1.5, 1.25, .55), smoothstep(.2, .8, nz) * .3 + smoothstep(.88, 1., treeShade) * .5);   // larches and aspen
  fcol = mix(vec3(dot(fcol, vec3(.33))), fcol, .8);
  alb = mix(alb, fcol, smoothstep(.1, .7, fa));
  // snow gathers on gentle ground above the snow line, and on ledges below it
  float sl = uSnow * (.85 + .3 * nz);
  float alt = smoothstep(sl - 120., sl + 280., hm);
  float stick = smoothstep(.56, .80, nb.y + .10 * d3 + .16 * (streak - .5));
  float snowAmt = max(alt * stick, alt * smoothstep(.40, .58, nb.y + .2 * d3) * .5);
  snowAmt *= 1. - .85 * smoothstep(.55, .9, fa);
  vec3 snowCol = night ? vec3(.60, .66, .86) : vec3(.92, .92, .92);
  alb = mix(alb, snowCol * (.95 + .10 * d3), clamp(snowAmt, 0., 1.));
  // low open ground: sedge and wet meadow, darker at the water
  float meadowAmt = (1. - smoothstep(25., 70., hm)) * smoothstep(.40, .20, slope) * (1. - fa);
  vec3 meadow = (night ? vec3(.030, .042, .040) : vec3(.075, .090, .050)) * (.6 + .9 * nz + .5 * d3);
  meadow *= mix(.22, 1., smoothstep(0., 16., hm));
  float wetShore = 1. - smoothstep(0., 7., hm);
  alb *= 1. - .55 * wetShore * (1. - meadowAmt);
  meadow = mix(vec3(dot(meadow, vec3(.33))), meadow, .8);
  alb = mix(alb, meadow, meadowAmt);
  // light
  float sh = softShadow(p + n * .003, L, t);
  float ao = cavity(p, p.y, fw);
  float dif = max(dot(n, L), 0.) * sh;
  vec3 sunCol = night ? vec3(.34, .42, .72) * 1.7 : vec3(1., .74, .54) * 3.8;
  vec3 amb = night ? vec3(.040, .058, .140) : vec3(.105, .15, .24);
  float skyOcc = (.45 + .55 * n.y) * ao;
  vec3 col = alb * (sunCol * dif * (.5 + .5 * ao) + amb * skyOcc * 1.5);
  col += alb * amb * smoothstep(.3, -.8, n.y) * .5;
  col += alb * sunCol * .08 * pow(1. - max(dot(n, -rd), 0.), 3.) * sh;
  return col;
}

vec3 fogColor(vec3 rd) {
  return skyColor(normalize(vec3(rd.x, max(rd.y, .02) * .15, rd.z)));
}
vec3 applyFog(vec3 col, vec3 ro, vec3 rd, float t, vec3 p) {
  bool night = uNight > .5;
  float k = night ? .026 : .013;
  float dist = 1. - exp(-t * k);
  float lowMist = exp(-max(p.y, 0.) * 5.5) * smoothstep(1.5, 14., t) * (night ? .34 : .46);
  float a = clamp(dist * .92 + lowMist, 0., 1.);
  vec3 fc = fogColor(rd);
  if (night) fc *= .9;
  return mix(col, fc, a);
}

// ---------------------------------------------------------------- water
float fwKm() { return 2. * TANH() / uFull.x * 1.4; }   // km per pixel, per km of distance
vec3 environment(vec3 ro, vec3 rd, vec2 frag, bool allowDisc) {
  float tw;
  float t = rayTerrain(ro, rd, 60., fwKm(), tw);
  if (t < -1.5) return vec3(-1.);
  if (t < 0.) {
    vec3 c = skyColor(rd);
    if (allowDisc) { c += starField(frag, rd); c += moonDisc(frag); }
    return c;
  }
  vec3 p = ro + rd * t;
  float fw = t * fwKm();
  vec3 n = terrainNormal(p, fw, true), nb = terrainNormal(p, fw, false);
  vec3 col = shadeTerrain(p, n, nb, rd, t, fw);
  return applyFog(col, ro, rd, t, p);
}
vec3 waterShade(vec3 ro, vec3 rd, float tw, vec2 frag) {
  bool night = uNight > .5;
  vec3 p = ro + rd * tw;
  float fwp = tw * 2. * TANH() / uFull.x;
  vec2 w = p.xz;
  float patch_ = smoothstep(.35, .75, fbm3(w * vec2(.9, 1.4) + 2.3));
  float near = 1. - smoothstep(.04, 1.6, tw);
  float s1 = (fbm3(vec2(w.x * 9., w.y * 38.)) - .5);
  float s2 = (fbm3(vec2(w.x * 46., w.y * 210.) + 7.) - .5);
  float s3 = (fbm3(vec2(w.x * 190., w.y * 900.) + 3.) - .5) * (1. - smoothstep(.0006, .0045, fwp * 190.)) * 2.4;
  float amp = (.0007 + .0016 * patch_) * (.55 + .9 * near);
  vec2 sl = vec2(s2 * 1.2 + s1 * .5, s1 * 1.6 + s2 * .6 + s3 * .8) * amp * 2.;
  vec3 n = normalize(vec3(sl.x, 1., sl.y));
  vec3 rf = reflect(rd, n);
  rf.y = abs(rf.y) + .0003;
  vec3 rcol = environment(p + vec3(0., .0003, 0.), normalize(rf), frag, false);
  if (rcol.x < 0.) rcol = skyColor(rf);
  if (night) rcol += starField(frag * vec2(1., -1.) + vec2(0., uFull.y), normalize(rf)) * .55;
  float cosT = max(-rd.y, 0.);
  float F = .02 + .98 * pow(1. - cosT, 5.);
  vec3 deep = night ? vec3(.010, .026, .068) : vec3(.075, .14, .15);
  vec3 col = mix(deep, rcol, clamp(F, 0., 1.));
  vec3 mv = night ? moonDirVisible() : sunDir();
  float g = pow(max(dot(rf, mv), 0.), night ? 1400. : 500.);
  float g2 = pow(max(dot(rf, mv), 0.), night ? 150. : 70.);
  col += (night ? vec3(.9, .95, 1.) : vec3(1., .85, .6)) * (g * (night ? 5. : 2.2) + g2 * (night ? .40 : .22));
  return col;
}

vec3 tonemap(vec3 c) {
  c = max(c, 0.);
  vec3 x = c * (uNight > .5 ? 1.05 : 1.0);
  x = (x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14);
  return pow(clamp(x, 0., 1.), vec3(1. / 2.2));
}

vec3 shadePixel(vec2 frag) {
  vec2 uv = frag / uFull;
  float aspect = uFull.x / uFull.y;
  float th = TANH();
  vec2 q = (uv - vec2(.5, HORIZON())) * vec2(2. * th, 2. * th / aspect);
  vec3 rd = normalize(vec3(q, 1.));
  vec3 ro = vec3(0., CAMY, 0.);
  float tw;
  float t = rayTerrain(ro, rd, 60., fwKm(), tw);
  vec3 col;
  if (uDebug > 3.5 && uDebug < 4.5) {
    float dd = 0.; float tt = .02; float last = 0.;
    for (int i = 0; i < 560; i++) { vec3 p = ro + rd * tt; dd = p.y - terrainCoarse(p.xz); last = terrainCoarse(p.xz); if (dd < .0001 * tt + .00015) return vec3(float(i) / 560., tt / 60., 1.); tt += clamp(.42 * dd, .00022 * tt, 1.0); if (tt > 60.) break; }
    return vec3(0., last * 10. + .5, 0.);
  }
  if (uDebug > 2.5 && uDebug < 3.5) return t > 0. ? vec3(fract(t * .5), fract(t * .05), 0.) : (t < -1.5 ? vec3(0., 0., .6) : vec3(.5, .7, 1.));
  if (t > 0.) {
    vec3 p = ro + rd * t;
    float fw = t * fwKm();
    vec3 n = terrainNormal(p, fw, true), nb = terrainNormal(p, fw, false);
    col = applyFog(shadeTerrain(p, n, nb, rd, t, fw), ro, rd, t, p);
  } else if (t < -1.5) {
    col = waterShade(ro, rd, tw, frag);
    col = applyFog(col, ro, rd, tw, ro + rd * tw);
  } else {
    col = skyColor(rd);
    col += starField(frag, rd);
    col += moonDisc(frag);
  }
  if (uNight > .5) {
    vec2 mc = vec2(1140., 765.) * (uFull.x / 1600.);
    float d = length(frag - mc) / (uFull.x / 1600.);
    col += vec3(.45, .55, .95) * (.15 * exp(-d * d / (2. * 34. * 34.)) + .035 * exp(-d / 110.));
  }
  return tonemap(col);
}

void main() {
  vec2 base = gl_FragCoord.xy + uOrigin;
  if (uDebug > 4.5 && uDebug < 5.5) {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 ro = vec3(0., CAMY, 0.);
    float x = uv.x * 8.;  // 0..8 km along z
    float h = terrainCoarse(vec2(0., x));
    float hf = terrainFine(vec2(0., x), 5., true);
    fragColor = vec4(uv.y > .5 ? vec3(.5 + h * 20.) : vec3(.5 + hf * 20.), 1.);
    return;
  }
  if ((uDebug > .5 && uDebug < 1.5) || uDebug > 9.5) {   // plan view: x to the right, z ahead, 40 km across
    vec2 uv = gl_FragCoord.xy / uRes;
    float span = uDebug > 9.5 ? uDebug - 10. : 40.; vec2 p = vec2((uv.x - .5) * span, uv.y * span);
    float h = terrainCoarse(p);
    fragColor = vec4(h < 0. ? vec3(.1, .25, .6) : vec3(.15 + h * .35), 1.);
    return;
  }
  int n = int(max(uSS, 1.));
  vec3 acc = vec3(0.);
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
    if (i >= n || j >= n) continue;
    vec2 off = (vec2(float(i), float(j)) + .5) / float(n) - .5;
    acc += shadePixel(base + off);
  }
  vec3 col = acc / float(n * n);
  col += (hash12(base) - .5) / 255.;
  fragColor = vec4(col, 1.);
}
