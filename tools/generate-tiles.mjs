// Generates the three labyrinth tile images (straight, curve, t-cross) as SVG.
// Usage: node tools/generate-tiles.mjs <outDir>
// Base orientations (must match tile.component.ts):
//   straight = N+S, curve = S+E, t-cross = N+S+E
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const S = 240;          // tile size
const A = 76, B = 164;  // corridor runs from A to B
const K = 11;           // kerb width
const SH = 16;          // width of the wall shadow on the floor

const WALL = ['#7d8a98', '#8894a2', '#74818f', '#919dab', '#808d9b', '#6f7c8a'];
const KERB = ['#c3c0b6', '#b7b4aa', '#cdcabf', '#bdb9ae'];
const FLOOR = ['#f0dfb4', '#ecd8a8', '#f3e3bc', '#e8d3a0', '#eedcae'];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Split a rectangle into irregular stones (looks right in every rotation).
function subdivide(r, [x, y, w, h], min, max, out = []) {
  const splitW = w > max || (w > min * 2 && r() < 0.35);
  const splitH = h > max || (h > min * 2 && r() < 0.35);
  if (!splitW && !splitH) { out.push([x, y, w, h]); return out; }
  const vertical = splitW && splitH ? w / h > 0.8 + r() * 0.4 : splitW;
  if (vertical) {
    const c = Math.round(w * (0.38 + r() * 0.24));
    subdivide(r, [x, y, c, h], min, max, out);
    subdivide(r, [x + c, y, w - c, h], min, max, out);
  } else {
    const c = Math.round(h * (0.38 + r() * 0.24));
    subdivide(r, [x, y, w, c], min, max, out);
    subdivide(r, [x, y + c, w, h - c], min, max, out);
  }
  return out;
}

// Split a kerb strip into a row of stones along its long side.
function strip(r, [x, y, w, h]) {
  const out = [];
  const horizontal = w >= h;
  const len = horizontal ? w : h;
  let p = 0;
  while (p < len) {
    let l = 17 + Math.round(r() * 11);
    if (len - p - l < 12) l = len - p;
    out.push(horizontal ? [x + p, y, l, h] : [x, y + p, w, l]);
    p += l;
  }
  return out;
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

function stone(r, [x, y, w, h], palette, gap, rx) {
  const g = gap / 2;
  const fill = pick(r, palette);
  const X = x + g, Y = y + g, W = w - gap, H = h - gap;
  let s = `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${rx}" fill="${fill}"/>`;
  // soft raised centre: reads as a cut stone, independent of light direction
  if (W > 7 && H > 7) {
    const o = (0.07 + r() * 0.09).toFixed(2);
    s += `<rect x="${X + 1.6}" y="${Y + 1.6}" width="${W - 3.2}" height="${H - 3.2}" rx="${Math.max(rx - 1, 0.5)}" fill="#fff" opacity="${o}"/>`;
  }
  return s;
}

const TILES = {
  straight: {
    seed: 11,
    floor: [[A, 0, B - A, S]],
    walls: [[0, 0, A - K, S], [B + K, 0, S - B - K, S]],
    kerbs: [[A - K, 0, K, S], [B, 0, K, S]],
    corners: [],
    shadows: [['v', A, 0, S, 1], ['v', B, 0, S, -1]],
  },
  curve: {
    seed: 23,
    floor: [[A, A, B - A, S - A], [B, A, S - B, B - A]],
    walls: [[0, 0, A - K, S], [A - K, 0, S - A + K, A - K], [B + K, B + K, S - B - K, S - B - K]],
    kerbs: [[A - K, A, K, S - A], [A, A - K, S - A, K], [B, B + K, K, S - B - K], [B + K, B, S - B - K, K]],
    corners: [[A - K, A - K, K, K], [B, B, K, K]],
    shadows: [['v', A, A, S - A, 1], ['h', A, A, S - A, 1], ['v', B, B, S - B, -1], ['h', B, B, S - B, -1]],
  },
  't-cross': {
    seed: 37,
    floor: [[A, 0, B - A, S], [B, A, S - B, B - A]],
    walls: [[0, 0, A - K, S], [B + K, 0, S - B - K, A - K], [B + K, B + K, S - B - K, S - B - K]],
    kerbs: [[A - K, 0, K, S], [B, 0, K, A - K], [B + K, A - K, S - B - K, K], [B, B + K, K, S - B - K], [B + K, B, S - B - K, K]],
    corners: [[B, A - K, K, K], [B, B, K, K]],
    shadows: [['v', A, 0, S, 1], ['v', B, 0, A, -1], ['h', B, A, S - B, 1], ['v', B, B, S - B, -1], ['h', B, B, S - B, -1]],
  },
};

function gradient(id, x1, x2, y1, y2) {
  return `<linearGradient id="${id}" x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}">` +
    `<stop offset="0" stop-color="#5a4320" stop-opacity=".42"/>` +
    `<stop offset="1" stop-color="#5a4320" stop-opacity="0"/></linearGradient>`;
}

function build(name) {
  const t = TILES[name];
  const r = rng(t.seed);
  let floor = '', walls = '', kerbs = '', shadows = '';

  for (const f of t.floor) {
    floor += `<rect x="${f[0]}" y="${f[1]}" width="${f[2]}" height="${f[3]}" fill="#d9c592"/>`;
    for (const s of subdivide(r, f, 22, 46)) floor += stone(r, s, FLOOR, 1.6, 2.5);
  }
  for (const w of t.walls) for (const s of subdivide(r, w, 17, 38)) walls += stone(r, s, WALL, 2.4, 2.2);
  for (const k of t.kerbs) for (const s of strip(r, k)) kerbs += stone(r, s, KERB, 1.8, 2.4);
  for (const c of t.corners) kerbs += stone(r, c, KERB, 1.8, 2.4);

  // shadow the walls cast onto the floor (symmetric, so rotation never looks wrong)
  for (const [dir, x, y, len, sign] of t.shadows) {
    if (dir === 'v') {
      shadows += `<rect x="${sign > 0 ? x : x - SH}" y="${y}" width="${SH}" height="${len}" fill="url(#sh-${sign > 0 ? 'r' : 'l'})"/>`;
    } else {
      shadows += `<rect x="${x}" y="${sign > 0 ? y : y - SH}" width="${len}" height="${SH}" fill="url(#sh-${sign > 0 ? 'd' : 'u'})"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
<defs>
  ${gradient('sh-r', 0, 1, 0, 0)}
  ${gradient('sh-l', 1, 0, 0, 0)}
  ${gradient('sh-d', 0, 0, 0, 1)}
  ${gradient('sh-u', 0, 0, 1, 0)}
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="${t.seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .5 .5 .5 0 -.55"/>
  </filter>
  <clipPath id="tile"><rect width="${S}" height="${S}" rx="7"/></clipPath>
</defs>
<g clip-path="url(#tile)">
  <rect width="${S}" height="${S}" fill="#465261"/>
  ${walls}
  ${floor}
  <circle cx="${S / 2}" cy="${S / 2}" r="62" fill="url(#glow)"/>
  ${shadows}
  ${kerbs}
  <rect width="${S}" height="${S}" filter="url(#grain)" opacity=".4"/>
</g>
<rect x="1" y="1" width="${S - 2}" height="${S - 2}" rx="6" fill="none" stroke="#2c333d" stroke-width="2"/>
<rect x="2.6" y="2.6" width="${S - 5.2}" height="${S - 5.2}" rx="4.6" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.2"/>
</svg>
`;
}

const out = process.argv[2] ?? 'tools/out';
mkdirSync(out, { recursive: true });
for (const name of Object.keys(TILES)) writeFileSync(join(out, `${name}.svg`), build(name));
console.log('wrote', Object.keys(TILES).join(', '), 'to', out);
