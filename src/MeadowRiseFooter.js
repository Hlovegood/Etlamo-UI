// =============================================================================
// ETLAMO (اتلموا) — Meadow Rise Footer Engine
// Native ESM Canvas + Procedural Parallax Footer for the Luxury Egyptian Marketplace
// =============================================================================

import { weddoLogoSvg } from './logo.js';

// mulberry32 pseudo-random generator
function mrfRng(seed) {
  let a = (seed | 0) ^ 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mrfHex(c) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((c || '').trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mrfClamp(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function mrfSmooth(e0, e1, x) {
  const t = mrfClamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

function mrfEase(t) {
  const c = mrfClamp(t);
  return 1 - (1 - c) * (1 - c) * (1 - c) * (1 - c);
}

function mrfNoiseTable(seed) {
  const rnd = mrfRng(seed * 7919 + 17);
  const G = 32;
  const lat = new Float32Array(G * G);
  for (let i = 0; i < lat.length; i++) lat[i] = rnd();
  const out = new Float32Array(65536);
  for (let y = 0; y < 256; y++) {
    const gy = y / 8;
    const y0 = Math.floor(gy);
    const fy = gy - y0;
    const sy = fy * fy * (3 - 2 * fy);
    const r0 = (y0 % G) * G;
    const r1 = ((y0 + 1) % G) * G;
    for (let x = 0; x < 256; x++) {
      const gx = x / 8;
      const x0 = Math.floor(gx);
      const fx = gx - x0;
      const sx = fx * fx * (3 - 2 * fx);
      const c0 = x0 % G;
      const c1 = (x0 + 1) % G;
      const a = lat[r0 + c0] + (lat[r0 + c1] - lat[r0 + c0]) * sx;
      const b = lat[r1 + c0] + (lat[r1 + c1] - lat[r1 + c0]) * sx;
      out[(y << 8) | x] = a + (b - a) * sy;
    }
  }
  return out;
}

function mrfSample(t, x, y) {
  const x0 = x | 0;
  const y0 = y | 0;
  const fx = x - x0;
  const fy = y - y0;
  const xa = x0 & 255;
  const xb = (x0 + 1) & 255;
  const ya = (y0 & 255) << 8;
  const yb = ((y0 + 1) & 255) << 8;
  const a = t[ya | xa] + (t[ya | xb] - t[ya | xa]) * fx;
  const b = t[yb | xa] + (t[yb | xb] - t[yb | xa]) * fx;
  return a + (b - a) * fy;
}

function mrfLayerSpec(i, n, seed) {
  const q = n > 1 ? i / (n - 1) : 1;
  const rnd = mrfRng(seed * 977 + i * 131 + 7);
  const count = q > 0.9 ? 2 : 3 + Math.floor(rnd() * 1.6);
  const domes = [];
  const span = 2.8 / count;
  const lean = i % 2 ? 1 : -1;
  for (let k = 0; k < count; k++) {
    const c = -1.4 + (k + 0.15 + rnd() * 0.7) * span;
    domes.push({
      c,
      w: (0.3 + rnd() * 0.32) * (1 + q * 0.7),
      h: 0.42 + rnd() * 0.42 + 0.16 * Math.max(0, Math.min(1, 0.5 + c * lean * 0.6)),
    });
  }
  return {
    q,
    base: 0.68 + q * 0.29,
    amp: 0.27 - q * 0.17,
    domes,
    waves: [
      { f: 1.6 + rnd() * 1.4, p: rnd() * 6.2832, a: 0.07 },
      { f: 4.5 + rnd() * 3, p: rnd() * 6.2832, a: 0.025 },
    ],
    depth: 0.16 + q * 0.3,
    haze: 0.03 + 0.5 * Math.pow(1 - q, 1.7),
  };
}

function mrfCrestAt(spec, x, W, H) {
  const u = (x - W / 2) / 1000;
  let sum = 0;
  for (let k = 0; k < spec.domes.length; k++) {
    const d = spec.domes[k];
    const z = (u - d.c) / d.w;
    sum += Math.exp(14 * d.h * Math.exp(-z * z));
  }
  const top = Math.log(sum) / 14;
  let wave = 0;
  for (let k = 0; k < spec.waves.length; k++) {
    const o = spec.waves[k];
    wave += o.a * Math.sin(u * o.f * 6.2832 + o.p);
  }
  return H * (spec.base - spec.amp * (top + wave));
}

function mrfSeamAt(spec, x, W) {
  const u = (x - W / 2) / 1000;
  let a = 0;
  let b = 0;
  for (let k = 0; k < spec.domes.length; k++) {
    const d = spec.domes[k];
    const z = (u - d.c) / d.w;
    const v = d.h * Math.exp(-z * z);
    if (v > a) {
      b = a;
      a = v;
    } else if (v > b) b = v;
  }
  const g = (a - b) / 0.07;
  return b > 0.12 ? Math.exp(-g * g) : 0;
}

const MRF_L = (() => {
  const v = [0.42, 0.78, 0.46];
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
})();

function mrfShade(m, t) {
  const f = Math.pow(mrfClamp(t), 0.6);
  const nx = m * 2.4 * (1 - f);
  const ny = 1 - f + 0.18;
  const nz = 0.22 + f * 1.15;
  const l = Math.hypot(nx, ny, nz);
  const d = (nx * MRF_L[0] + ny * MRF_L[1] + nz * MRF_L[2]) / l;
  return mrfClamp(0.12 + 0.88 * d);
}

const MRF_STEPS = 64;

function mrfPaintLayer(px, w, h, o, c0 = 0, c1 = w) {
  const { s, mx, top, W, H, spec, lit, shadow, haze, noise } = o;
  const out = new Uint32Array(px.buffer, px.byteOffset, w * h);
  const q = spec.q;
  const depthPx = Math.max(1, spec.depth * H);
  const A1 = 0.32 + 0.2 * q;
  const A2 = 0.08 + 0.2 * q;
  const A3 = 0.05 + 0.13 * q;
  const lane = q * 97 + 4096;
  const detailRows = Math.max(0, Math.min(h, Math.ceil((o.detailTo - top) * s)));
  const dn = Math.ceil(depthPx * s) + 2;
  const hzL = new Float32Array(dn);
  const tL = new Uint8Array(dn);
  const darkL = new Float32Array(dn);
  const creaseL = new Float32Array(dn);
  for (let j = 0; j < dn; j++) {
    const d = j / s;
    const t = mrfClamp(d / depthPx);
    hzL[j] = mrfClamp(spec.haze + 0.16 * (1 - q) * Math.exp(-d / 9) + 0.2 * (1 - q) * t * t);
    tL[j] = Math.round(t * (MRF_STEPS - 1));
    darkL[j] = 1 - 0.3 * t * t;
    creaseL[j] = 0.38 * (1 - t * 0.7);
  }
  const shadeT = new Float32Array(128 * MRF_STEPS);
  for (let mi = 0; mi < 128; mi++) {
    const mm = (mi / 127) * 4 - 2;
    for (let k = 0; k < MRF_STEPS; k++) shadeT[mi * MRF_STEPS + k] = mrfShade(mm, k / (MRF_STEPS - 1));
  }
  const sR = shadow[0];
  const sG = shadow[1];
  const sB = shadow[2];
  const dR = lit[0] - sR;
  const dG = lit[1] - sG;
  const dB = lit[2] - sB;
  const hR = haze[0];
  const hG = haze[1];
  const hB = haze[2];
  for (let c = Math.max(0, c0); c < Math.min(w, c1); c++) {
    const X = (c + 0.5) / s - mx;
    const cy = mrfCrestAt(spec, X, W, H);
    const m = ((mrfCrestAt(spec, X + 1 / s, W, H) - mrfCrestAt(spec, X - 1 / s, W, H)) * s) / 2;
    const seam = mrfSeamAt(spec, X, W);
    const row = Math.round((Math.max(-2, Math.min(2, m)) + 2) * 31.75) * MRF_STEPS;
    const cyRow = (cy - top) * s;
    const start = Math.max(0, Math.floor(cyRow) - 1);
    const pX = X * 0.045 + lane;
    const cX = X * 0.3 + 4096;
    const yBase = (start + 0.5) / s + top;
    for (let r = start; r < h; r++) {
      const dd = r + 0.5 - cyRow;
      const cov = dd + 0.5;
      if (cov <= 0) continue;
      const j = dd < 0 ? 0 : dd >= dn ? dn - 1 : dd | 0;
      const sh = shadeT[row + tL[j]] * darkL[j] * (1 - seam * creaseL[j]);
      let R = sR + dR * sh;
      let G = sG + dG * sh;
      let B = sB + dB * sh;
      if (r < detailRows) {
        const d = dd / s;
        const Y = yBase + (r - start) / s;
        const patch = mrfSample(noise, pX, d * 0.09 + Y * 0.02 + lane) - 0.5;
        const clump = mrfSample(noise, cX, d * 1.25 + lane) - 0.5;
        let g = Math.imul(c + 7919, 374761393) ^ Math.imul(r + 104729, 668265263);
        g = Math.imul(g ^ (g >>> 13), 1274126177);
        const grain = ((g ^ (g >>> 16)) >>> 0) / 4294967296 - 0.5;
        const tex = 1 + patch * A1 + clump * A2 + grain * A3;
        R *= tex;
        G *= tex;
        B *= tex;
      }
      const hz = hzL[j];
      R += (hR - R) * hz;
      G += (hG - G) * hz;
      B += (hB - B) * hz;
      const A = cov >= 1 ? 255 : (cov * 255) | 0;
      out[r * w + c] =
        ((A << 24) |
          ((B > 255 ? 255 : B < 0 ? 0 : B | 0) << 16) |
          ((G > 255 ? 255 : G < 0 ? 0 : G | 0) << 8) |
          (R > 255 ? 255 : R < 0 ? 0 : R | 0)) >>>
        0;
    }
  }
}

function mrfMistBand(noise, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) / h;
    const bell = Math.exp(-Math.pow((v - 0.55) / 0.22, 2));
    for (let x = 0; x < w; x++) {
      const nx = (x * 256) / w;
      const a = noise[((((y * 96) / h) | 0) << 8) | (nx | 0)];
      const b = noise[(((((y * 40) / h) | 0) + 128) << 8) | (((nx * 2) | 0) & 255)];
      out[y * w + x] = mrfClamp((a * 0.65 + b * 0.35 - 0.36) * 2.6) * bell;
    }
  }
  return out;
}

function mrfArrival(top, height, vh) {
  const end = Math.max(0, vh - height);
  return mrfClamp((vh - top) / Math.max(1, vh - end));
}

function mrfBotany(seed, count) {
  const rnd = mrfRng(seed * 31 + 5);
  const out = [];
  const B = 420;
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  for (let k = 0; k < count; k++) {
    const x = 70 + (k + 0.2 + rnd() * 0.6) * (1060 / count);
    const hgt = 150 + rnd() * 230;
    const lean = (rnd() - 0.5) * 110;
    const ax = x;
    const ay = B;
    const bx = x + lean;
    const by = B - hgt;
    const cx = x + lean * 0.1 + (rnd() - 0.5) * 40;
    const cy = B - hgt * 0.55;
    const at = (t) => [
      (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx + t * t * bx,
      (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy + t * t * by,
    ];
    const tan = (t) => {
      const dx = 2 * (1 - t) * (cx - ax) + 2 * t * (bx - cx);
      const dy = 2 * (1 - t) * (cy - ay) + 2 * t * (by - cy);
      const l = Math.hypot(dx, dy) || 1;
      return [dx / l, dy / l];
    };
    const parts = [];
    const leaves = 2 + Math.floor(rnd() * 3);
    for (let j = 0; j < leaves; j++) {
      const t = 0.14 + j * (0.55 / leaves) + rnd() * 0.05;
      const [px, py] = at(t);
      const [tx, ty] = tan(t);
      const side = j % 2 ? 1 : -1;
      const ang = 0.75 * side;
      const dx = tx * Math.cos(ang) - ty * Math.sin(ang);
      const dy = tx * Math.sin(ang) + ty * Math.cos(ang);
      const len = 26 + rnd() * 30;
      const ex = px + dx * len;
      const ey = py + dy * len;
      const nx = -dy * len * 0.28;
      const ny = dx * len * 0.28;
      const mx = (px + ex) / 2;
      const my = (py + ey) / 2;
      parts.push(
        "M" + f1(px) + " " + f1(py) + "Q" + f1(mx + nx) + " " + f1(my + ny) + " " + f1(ex) + " " + f1(ey) +
          "Q" + f1(mx - nx) + " " + f1(my - ny) + " " + f1(px) + " " + f1(py)
      );
    }
    const r = 16 + rnd() * 9;
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * 6.2832;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      parts.push("M" + f1(bx) + " " + f1(by) + "L" + f1(bx + ux * r) + " " + f1(by + uy * r));
    }
    out.push({
      stem: "M" + f1(ax) + " " + f1(ay) + "Q" + f1(cx) + " " + f1(cy) + " " + f1(bx) + " " + f1(by),
      parts,
      x: ax,
      order: k / Math.max(1, count - 1),
    });
  }
  return out;
}

// =============================================================================
// ETLAMO LUXURY PALETTES (Golden Sandstone Dunes & Nile Midnight Oasis)
// =============================================================================
export const ETLAMO_PALETTES = {
  golden: {
    sky: ["#fcf8f2", "#f4e6d3"],
    haze: "#ecd7bf",
    glow: "#fde3b8",
    hills: [
      ["#d2ba9e", "#baa084"],
      ["#c4af78", "#9e8e58"],
      ["#b3a15a", "#86783d"],
      ["#9c904c", "#6c632d"],
      ["#7a7437", "#4d4a1f"],
      ["#504b24", "#282510"],
    ],
    ground: "#1b190d",
    ink: "#19140b",
    sub: "#483b2a",
    pill: "#fffaf2",
    pillInk: "#19140b",
    text: "#f7f0e2",
    muted: "#c2b496",
    line: "rgba(247, 240, 226, 0.18)",
    night: false,
  },
  moonlit: {
    sky: ["#070d09", "#132016"],
    haze: "#17271c",
    glow: "#ebd8a7",
    hills: [
      ["#2b3d30", "#1e2c22"],
      ["#243729", "#18261c"],
      ["#1f3024", "#142118"],
      ["#1a281e", "#0f1a13"],
      ["#142017", "#0a130e"],
      ["#0e1710", "#060b07"],
    ],
    ground: "#050906",
    ink: "#f7eee3",
    sub: "#adb9ab",
    pill: "#eed8a6",
    pillInk: "#070d09",
    text: "#f2eee7",
    muted: "#9aa598",
    line: "rgba(238, 216, 166, 0.16)",
    night: true,
  },
};

// =============================================================================
// RENDER HTML TEMPLATE
// =============================================================================
export function renderMeadowRiseFooter({ lang = 'ar' } = {}) {
  const isAr = lang === 'ar';
  const flowers = mrfBotany(7, 9);

  const headlineRaw = isAr 
    ? 'اتلموا في *أعرق القصور الملكية* بمصر'
    : 'Gather within *Egypt’s Grandest Palaces* today.';

  const subheading = isAr
    ? 'الأرشيف السيادي المعتمد لأرقى القصور التاريخية، المحميات النيلية، ومقار القمم الدبلوماسية في جمهورية مصر العربية.'
    : 'The accredited sovereign archive of Egypt’s premier royal palaces, Nile heritage waterfronts, and presidential diplomatic estates.';

  const ctaLabel = isAr ? 'طلب جولة ملكية خاصة' : 'Request Royal Protocol Access';
  const tagline = isAr 
    ? 'سجل النخبة لحجوزات القصور الملكية غير المعلنة وجولات المعاينة البروتوكولية الخاصة.'
    : 'Join the sovereign registry for confidential previews of unlisted royal palaces and diplomatic gala dates.';

  const placeholder = isAr ? 'البريد الدبلوماسي أو المؤسسي...' : 'Diplomatic or corporate email...';
  const subscribeLabel = isAr ? 'انضمام' : 'Request';

  // Words breakdown
  let wordIndex = 0;
  const lines = headlineRaw.split('\n').map((line) => {
    const words = [];
    line.split('*').forEach((seg, k) => {
      for (const w of seg.split(/\s+/)) if (w) words.push({ text: w, accent: k % 2 === 1 });
    });
    return words;
  });

  const flowersSvg = flowers.map((f, i) => `
    <g class="mrf-stem" style="transform-origin: ${f.x}px 420px; --sd: ${i * 1.7};">
      <path class="mrf-draw" d="${f.stem}" pathLength="1" style="--d: ${1400 + f.order * 900};"></path>
      ${f.parts.map((d, j) => `<path class="mrf-draw" d="${d}" pathLength="1" style="--d: ${2100 + f.order * 900 + j * 90};"></path>`).join('')}
    </g>
  `).join('');

  return `
  <footer class="mrf-root site-footer" id="site-footer" dir="${isAr ? 'rtl' : 'ltr'}" aria-label="Etlamo Sovereign Footer">
    <!-- Ambient Scene Canvas -->
    <div class="mrf-scene">
      <canvas class="mrf-canvas" aria-hidden="true"></canvas>
    </div>

    <!-- Hero Call to Action Band -->
    <div class="mrf-hero">
      <h2 class="mrf-h">
        ${lines.map((words) => `
          <span class="mrf-line">
            ${words.map((w, wi) => {
              const d = (w.accent ? 900 : 520) + wordIndex++ * 75;
              return `
                ${wi > 0 ? ' ' : ''}
                <span class="mrf-w ${w.accent ? 'mrf-acc' : ''}">
                  <span class="mrf-wi" style="--d: ${d};">${w.text}</span>
                </span>
              `;
            }).join('')}
          </span>
        `).join('')}
      </h2>

      <p class="mrf-sub mrf-r" style="--d: 1150;">
        ${subheading}
      </p>

      <div class="mrf-cta-wrap mrf-r" style="--d: 1300;">
        <a class="mrf-cta" href="#/discover" aria-label="${ctaLabel}">
          <span>${ctaLabel}</span>
          <span class="mrf-cta-arrow">
            <svg class="mrf-a1" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="${isAr ? 'M11.5 11.5l-7-7M10.5 4.5h-6v6' : 'M4.5 11.5l7-7M5.5 4.5h6v6'}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg class="mrf-a2" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="${isAr ? 'M11.5 11.5l-7-7M10.5 4.5h-6v6' : 'M4.5 11.5l7-7M5.5 4.5h6v6'}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </a>
      </div>
    </div>

    <!-- Footer Body with Swaying Botanical Flora & Editorial Columns -->
    <div class="mrf-body">
      <svg class="mrf-botany" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        ${flowersSvg}
      </svg>

      <div class="mrf-wrap">
        <!-- Top Tier: Centered Grand Monogram, Official Descriptor & Action Strip -->
        <header class="mrf-header-tier mrf-r" style="--d: 1250;">
          <a class="mrf-master-logo" href="#/discover" aria-label="Etlamo Sovereign Registry">
            ${weddoLogoSvg({ size: 'lg', lang })}
          </a>
          <p class="mrf-master-desc">
            ${isAr 
              ? 'المنظومة السيادية لقصور وسرايات مصر التاريخية • حجز وتنسيق الفعاليات الملكية، القمم الدبلوماسية والمناسبات الرفيعة' 
              : 'The Sovereign Registry for Egyptian Royal Palaces, Historic Châteaux & Diplomatic Summits'}
          </p>

          <div class="mrf-action-strip">
            <!-- Newsletter / Royal Dispatch -->
            <form class="mrf-form" id="mrf-registry-form" novalidate>
              <label class="mrf-sr" for="mrf-email-input">
                ${isAr ? 'البريد الإلكتروني الدبلوماسي' : 'Diplomatic or corporate email'}
              </label>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="mrf-form-icon">
                <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
                <path d="M4.5 7.5l7.5 5.5 7.5-5.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
              <input
                id="mrf-email-input"
                class="mrf-input"
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="${placeholder}"
                aria-describedby="mrf-email-msg"
              />
              <button class="mrf-send" type="submit" aria-label="${subscribeLabel}">
                <span class="mrf-send-text">${subscribeLabel}</span>
                <svg class="mrf-a1" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path d="${isAr ? 'M11.5 11.5l-7-7M10.5 4.5h-6v6' : 'M4.5 11.5l7-7M5.5 4.5h6v6'}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg class="mrf-a2" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path d="${isAr ? 'M11.5 11.5l-7-7M10.5 4.5h-6v6' : 'M4.5 11.5l7-7M5.5 4.5h6v6'}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg class="mrf-spin" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                  <path d="M8 2.2a5.8 5.8 0 1 1-5.6 4.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                <svg class="mrf-check" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                  <path d="M3.5 8.4l3 3 6-6.6" pathLength="1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <p id="mrf-email-msg" class="mrf-msg" data-show="false" aria-live="polite"></p>
            </form>

            <!-- VIP Concierge Hotline Badge -->
            <div class="mrf-hotline-pill">
              <span class="mrf-hotline-icon">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <span class="mrf-hotline-label">${isAr ? 'خط المراسم الملكية العاجل (24/7):' : 'Royal Protocol Hotline (24/7):'}</span>
              <a href="tel:19890" class="mrf-hotline-num" aria-label="19890">19890</a>
            </div>
          </div>
        </header>

        <!-- Divider Line -->
        <div class="mrf-mid-rule" aria-hidden="true"></div>

        <!-- 5-Column Full-Width Centered Directory Navigation -->
        <nav class="mrf-cols-wide" aria-label="${isAr ? 'دليل المنظومة السيادية' : 'Sovereign Directory Navigation'}">
          <!-- Col 1: Heritage Palaces -->
          <div class="mrf-col">
            <h3 class="mrf-r" style="--d: 1300;">
              <span class="mrf-col-badge">🏛️</span>
              ${isAr ? 'مجموعات القصور والسرايات' : 'Royal Palaces & Estates'}
            </h3>
            <ul>
              <li class="mrf-r" style="--d: 1360;"><a class="mrf-link" href="#/venues?type=palace">${isAr ? 'قصر عابدين ومجمع المتاحف الملكية' : 'Abdeen Palace & Royal Museums'}</a></li>
              <li class="mrf-r" style="--d: 1400;"><a class="mrf-link" href="#/venues?type=nile">${isAr ? 'قصر محمد علي بشبرا وسراي الفسقية' : 'Mohamed Ali Palace & Shubra Fountain'}</a></li>
              <li class="mrf-r" style="--d: 1440;"><a class="mrf-link" href="#/venues?type=nile">${isAr ? 'قصر المانسترلي ومقياس النيل الأثري' : 'Manasterly Palace & Historic Nilometer'}</a></li>
              <li class="mrf-r" style="--d: 1480;"><a class="mrf-link" href="#/venues?type=seafront">${isAr ? 'قصر المنتزه والحرملك الملكي بالإسكندرية' : 'Montaza Palace & Royal Haramlek'}</a></li>
              <li class="mrf-r" style="--d: 1520;"><a class="mrf-link" href="#/venues?type=citadel">${isAr ? 'قصر البارون إمبان بمصر الجديدة' : 'Baron Empain Palace Heliopolis'}</a></li>
              <li class="mrf-r" style="--d: 1560;"><a class="mrf-link" href="#/venues?type=nile">${isAr ? 'سراي الجزيرة وتراسات الزمالك النيلية' : 'Gezira Palace & Zamalek Terraces'}</a></li>
            </ul>
          </div>

          <!-- Col 2: Spatial Architecture & 3D Twins -->
          <div class="mrf-col">
            <h3 class="mrf-r" style="--d: 1350;">
              <span class="mrf-col-badge">📐</span>
              ${isAr ? 'العمارة المكانية والتوأم الرقمي' : 'Spatial Architecture & 3D'}
            </h3>
            <ul>
              <li class="mrf-r" style="--d: 1410;"><a class="mrf-link" href="#/venues">${isAr ? 'الجولات البانورامية التفاعلية 3D' : 'Interactive 3D Walkthroughs'}</a></li>
              <li class="mrf-r" style="--d: 1450;"><a class="mrf-link" href="#/venue-workspace">${isAr ? 'محاكي توزيع المقاعد والبروتوكول' : 'Seating & Protocol Simulator'}</a></li>
              <li class="mrf-r" style="--d: 1490;"><a class="mrf-link" href="#/venues">${isAr ? 'محاكاة الإضاءة وديناميكية الصوت' : 'Acoustics & Lighting Dynamics'}</a></li>
              <li class="mrf-r" style="--d: 1530;"><a class="mrf-link" href="#/venues">${isAr ? 'فحص الجاهزية والتوفر الدبلوماسي' : 'Diplomatic Availability Audit'}</a></li>
              <li class="mrf-r" style="--d: 1570;"><a class="mrf-link" href="#/planning">${isAr ? 'حجز المعاينة الميدانية المصحوبة' : 'Accompanied VIP Site Inspection'}</a></li>
              <li class="mrf-r" style="--d: 1610;"><a class="mrf-link" href="#/vendor">${isAr ? 'بوابة ملاك الأصول والقصور التراثية' : 'Heritage Estates Partner Portal'}</a></li>
            </ul>
          </div>

          <!-- Col 3: State Banqueting & Concierge -->
          <div class="mrf-col">
            <h3 class="mrf-r" style="--d: 1400;">
              <span class="mrf-col-badge">⚜️</span>
              ${isAr ? 'الضيافة والمراسم الملكية' : 'State Banqueting & Concierge'}
            </h3>
            <ul>
              <li class="mrf-r" style="--d: 1460;"><a class="mrf-link" href="#/plans">${isAr ? 'قوائم الولائم والمأدبات الدبلوماسية' : 'State Banquets & Culinary Curations'}</a></li>
              <li class="mrf-r" style="--d: 1500;"><a class="mrf-link" href="#/plans">${isAr ? 'تنسيق الزهور الملكية والعمارة النباتية' : 'Royal Floristry & Botanical Design'}</a></li>
              <li class="mrf-r" style="--d: 1540;"><a class="mrf-link" href="#/plans">${isAr ? 'موكب السيارات الكلاسيكية والأسطول' : 'Imperial Fleet & Classic Chauffeur'}</a></li>
              <li class="mrf-r" style="--d: 1580;"><a class="mrf-link" href="#/plans">${isAr ? 'الأوركسترا والموسيقى السيمفونية' : 'Symphony Orchestras & Ensembles'}</a></li>
              <li class="mrf-r" style="--d: 1620;"><a class="mrf-link" href="#/plans">${isAr ? 'الأرشيف والتوثيق السينمائي 4K' : 'Cinematic Archival & 4K Aerial'}</a></li>
              <li class="mrf-r" style="--d: 1660;"><a class="mrf-link" href="#/plans">${isAr ? 'الحراسة الدبلوماسية وإدارة الوفود' : 'Diplomatic Security & VIP Delegation'}</a></li>
            </ul>
          </div>

          <!-- Col 4: Regional Embassies & Direct Access -->
          <div class="mrf-col">
            <h3 class="mrf-r" style="--d: 1450;">
              <span class="mrf-col-badge">📍</span>
              ${isAr ? 'المقرات الإقليمية المعتمدة' : 'Regional Embassies & Hours'}
            </h3>
            <ul class="mrf-embassy-list">
              <li class="mrf-r" style="--d: 1510;">
                <span class="mrf-embassy-name">${isAr ? 'ديوان القاهرة — حي الزمالك الدبلوماسي' : 'Cairo: Diplomatic Zamalek Quarter'}</span>
                <a class="mrf-link mrf-sub-link" href="tel:+20227359330">+20 2 2735 9330</a>
              </li>
              <li class="mrf-r" style="--d: 1550;">
                <span class="mrf-embassy-name">${isAr ? 'ديوان الإسكندرية — ساحل المنتزه الملكي' : 'Alexandria: Royal Montaza Coast'}</span>
                <a class="mrf-link mrf-sub-link" href="tel:+2035448200">+20 3 544 8200</a>
              </li>
              <li class="mrf-r" style="--d: 1590;">
                <span class="mrf-embassy-name">${isAr ? 'ديوان الجيزة — هضبة الأهرامات الملكية' : 'Giza: Royal Pyramids Plateau'}</span>
                <a class="mrf-link mrf-sub-link" href="tel:+20233771140">+20 2 3377 1140</a>
              </li>
              <li class="mrf-r" style="--d: 1630;">
                <span class="mrf-embassy-name">${isAr ? 'ديوان الصعيد — كورنيش الأقصر وأسوان' : 'Upper Egypt: Luxor & Aswan Liaison'}</span>
                <span class="mrf-embassy-hours">${isAr ? 'السبت – الخميس: 9:00 ص – 8:00 م' : 'Sat – Thu: 9:00 AM – 8:00 PM'}</span>
              </li>
            </ul>
          </div>

          <!-- Col 5: Sovereign Accreditations & Protocol Liaison -->
          <div class="mrf-col">
            <h3 class="mrf-r" style="--d: 1500;">
              <span class="mrf-col-badge">🛡️</span>
              ${isAr ? 'الاعتمادات والتواصل الرسمي' : 'Certifications & Protocol'}
            </h3>
            <div class="mrf-cert-block mrf-r" style="--d: 1560;">
              <p class="mrf-cert-item">
                <span class="mrf-cert-dot"></span>
                ${isAr ? 'ترخيص المجلس الأعلى للآثار المصرية' : 'Licensed by Supreme Council of Antiquities'}
              </p>
              <p class="mrf-cert-item">
                <span class="mrf-cert-dot"></span>
                ${isAr ? 'معتمد من رئاسة مجلس الوزراء للسياحة' : 'Approved by Cabinet of Ministers'}
              </p>
              <p class="mrf-cert-item">
                <span class="mrf-cert-dot"></span>
                ${isAr ? 'الأمان والسرية الدبلوماسية ISO 27001' : 'Diplomatic Privacy ISO 27001'}
              </p>
              <div class="mrf-cert-code">
                <span>${isAr ? 'المعرف السيادي:' : 'Registry ID:'}</span>
                <code>ETL-EGY-ROYAL-2026</code>
              </div>
            </div>

            <div class="mrf-social-section mrf-r" style="--d: 1620;">
              <h4 class="mrf-social-title">${isAr ? 'القنوات الرسمية' : 'Official Channels'}</h4>
              <ul class="mrf-social">
                <li>
                  <a class="mrf-icon" href="#" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M5 3.6a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2ZM3.2 9.4h3.6V20.6H3.2V9.4Zm5.9 0h3.45v1.53h.05c.48-.9 1.66-1.85 3.41-1.85 3.65 0 4.32 2.4 4.32 5.52v6H16.7v-5.32c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81v5.41H9.1V9.4Z"/>
                    </svg>
                  </a>
                </li>
                <li>
                  <a class="mrf-icon" href="#" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7">
                      <rect x="3.5" y="3.5" width="17" height="17" rx="4.8"/>
                      <circle cx="12" cy="12" r="3.9"/>
                      <circle cx="17.2" cy="6.8" r="0.4" fill="currentColor"/>
                    </svg>
                  </a>
                </li>
                <li>
                  <a class="mrf-icon" href="#" aria-label="X">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M17.2 3.75h2.9l-6.34 7.25 7.46 9.25h-5.84l-4.57-5.66-5.23 5.66H2.68l6.78-7.75L2.3 3.75h5.99l4.13 5.2 4.78-5.2Zm-1.02 14.84h1.6L7.39 5.32H5.66l10.52 13.27Z"/>
                    </svg>
                  </a>
                </li>
                <li>
                  <a class="mrf-icon" href="#" aria-label="Facebook">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M13.6 21v-7.6h2.55l.4-3h-2.95V8.5c0-.86.25-1.45 1.48-1.45h1.57V4.36A21 21 0 0 0 14.36 4.2c-2.27 0-3.82 1.39-3.82 3.93v2.27H8v3h2.54V21h3.06Z"/>
                    </svg>
                  </a>
                </li>
                <li>
                  <a class="mrf-icon" href="#" aria-label="YouTube">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z"/>
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <!-- Sovereign Trust & Accreditation Badges Ribbon -->
        <section class="mrf-trust-band mrf-r" style="--d: 1650;" aria-label="${isAr ? 'اعتمادات الثقة والسيادة' : 'Trust and Accreditation Credentials'}">
          <div class="mrf-trust-item">
            <span class="mrf-trust-icon">🏛️</span>
            <div class="mrf-trust-text">
              <strong>${isAr ? 'توثيق أثري معتمد' : 'Accredited Heritage'}</strong>
              <small>${isAr ? 'مرخص رسمياً برعاية المجلس الأعلى للآثار' : 'Licensed with Supreme Council of Antiquities'}</small>
            </div>
          </div>
          <div class="mrf-trust-item">
            <span class="mrf-trust-icon">🛡️</span>
            <div class="mrf-trust-text">
              <strong>${isAr ? 'سرية وخصوصية دبلوماسية' : 'Diplomatic Privacy'}</strong>
              <small>${isAr ? 'تشفير كامل لكافة الوفود والفعاليات السيادية' : 'End-to-end encrypted VIP delegations'}</small>
            </div>
          </div>
          <div class="mrf-trust-item">
            <span class="mrf-trust-icon">📐</span>
            <div class="mrf-trust-text">
              <strong>${isAr ? 'مسح مكاني ملليمتر LiDAR' : 'Precision 3D Twins'}</strong>
              <small>${isAr ? 'نمذجة رقمية ثلاثية الأبعاد دقيقة لكافة القاعات' : 'Millimeter laser LiDAR spatial survey'}</small>
            </div>
          </div>
          <div class="mrf-trust-item">
            <span class="mrf-trust-icon">⚜️</span>
            <div class="mrf-trust-text">
              <strong>${isAr ? 'بروتوكول المراسم الملكية' : 'Royal Protocol Standards'}</strong>
              <small>${isAr ? 'تخطيط احترافي يطابق أرقى معايير الاستقبال الدولية' : 'Standardized for diplomatic state galas'}</small>
            </div>
          </div>
        </section>

        <!-- Sovereign Seal & Monogram Crest Watermark -->
        <div class="mrf-seal-block mrf-r" style="--d: 1720;">
          <span class="mrf-seal-line" aria-hidden="true"></span>
          <div class="mrf-seal-badge">
            <span class="mrf-seal-emblem">
              ${weddoLogoSvg({ size: 'sm', iconOnly: true, lang })}
            </span>
            <span class="mrf-seal-title">${isAr ? 'اتلموا • ETLAMO' : 'ETLAMO • اتلموا'}</span>
            <span class="mrf-seal-sub">${isAr ? 'المنظومة السيادية لقصور وسرايات مصر التاريخية' : 'The Sovereign Digital Heritage of Egypt'}</span>
          </div>
          <span class="mrf-seal-line" aria-hidden="true"></span>
        </div>

        <!-- Accreditations & Bottom Legal Bar -->
        <footer class="mrf-bottom">
          <span class="mrf-rule" aria-hidden="true"></span>
          <div class="mrf-bottom-content">
            <p class="mrf-copyright mrf-r" style="--d: 1760;">
              ${isAr 
                ? `© ${new Date().getFullYear()} اتلموا (Etlamo). جميع الحقوق الملكية والتراثية محفوظة لجمهورية مصر العربية.` 
                : `© ${new Date().getFullYear()} Etlamo (اتلموا). Sovereign royal registry. All rights reserved.`}
            </p>
            <ul class="mrf-legal mrf-r" style="--d: 1820;">
              <li><a class="mrf-link" href="#/privacy">${isAr ? 'السرية والخصوصية الدبلوماسية' : 'Diplomatic Privacy'}</a></li>
              <li><a class="mrf-link" href="#/terms">${isAr ? 'شروط البروتوكول الملكي' : 'Terms of Protocol'}</a></li>
              <li><a class="mrf-link" href="#/security">${isAr ? 'التوثيق التراثي والآثار' : 'Heritage Licensing'}</a></li>
              <li><a class="mrf-link" href="#/code">${isAr ? 'ميثاق الحفظ المعماري' : 'Preservation Code'}</a></li>
              <li><a class="mrf-link" href="#/accessibility">${isAr ? 'إمكانية الوصول الشاملة' : 'Accessibility WCAG'}</a></li>
              <li><a class="mrf-link" href="#/sitemap">${isAr ? 'خريطة الموقع' : 'Sitemap'}</a></li>
            </ul>
            <div class="mrf-ministry-badge mrf-r" style="--d: 1860;">
              <span>${isAr ? 'جمهورية مصر العربية • وزارة السياحة والآثار • المجلس الأعلى للآثار' : 'Arab Republic of Egypt • Ministry of Tourism & Antiquities'}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </footer>
  `;
}

// =============================================================================
// MOUNT ENGINE: PROCEDURAL HILLS CANVAS & INTERSECTION CONTROLLER
// =============================================================================
export function mountMeadowRiseFooter(rootElement) {
  if (!rootElement) return () => {};

  const hero = rootElement.querySelector('.mrf-hero');
  const scene = rootElement.querySelector('.mrf-scene');
  const canvas = rootElement.querySelector('.mrf-canvas');
  if (!hero || !scene || !canvas) return () => {};

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  // Ensure persistent background celestial canvas exists across the site
  let bgCanvas = document.getElementById('site-celestial-canvas');
  if (!bgCanvas) {
    bgCanvas = document.createElement('canvas');
    bgCanvas.id = 'site-celestial-canvas';
    bgCanvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(bgCanvas);
  }
  const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;

  let isDark = document.documentElement.classList.contains('dark') ||
    document.documentElement.getAttribute('data-theme') === 'dark';

  let colors = isDark ? ETLAMO_PALETTES.moonlit : ETLAMO_PALETTES.golden;
  let hills = colors.hills;
  const seed = 3;
  const mist = 0.55;
  const drift = 1;

  const applyCustomProperties = () => {
    rootElement.style.setProperty('--mrf-ground', colors.ground);
    document.documentElement.style.setProperty('--mrf-ground', colors.ground);
    rootElement.style.setProperty('--mrf-ink', colors.ink);
    rootElement.style.setProperty('--mrf-sub', colors.sub);
    rootElement.style.setProperty('--mrf-pill', colors.pill);
    rootElement.style.setProperty('--mrf-pill-ink', colors.pillInk);
    rootElement.style.setProperty('--mrf-text', colors.text);
    rootElement.style.setProperty('--mrf-muted', colors.muted);
    rootElement.style.setProperty('--mrf-line', colors.line);
    rootElement.style.setProperty('--mrf-hero', 'clamp(270px, 38vh, 390px)');
    rootElement.style.setProperty('--mrf-max', '1240px');
  };
  applyCustomProperties();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rgb = (c, fb) => mrfHex(c) || fb;
  let sky0 = rgb(colors.sky[0], [252, 248, 242]);
  let sky1 = rgb(colors.sky[1], [244, 230, 211]);
  let hazeC = rgb(colors.haze, sky1);
  let glowC = rgb(colors.glow, [253, 227, 184]);
  let groundC = rgb(colors.ground, [27, 25, 13]);
  let inkC = rgb(colors.ink, [25, 20, 11]);
  const css = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  let hillC = hills.map((h) => [rgb(h[0], [180, 160, 120]), rgb(h[1], [130, 110, 80])]);
  let night = !!colors.night;
  const n = hillC.length;
  const noise = mrfNoiseTable(seed);
  let specs = hillC.map((_, i) => mrfLayerSpec(i, n, seed));
  const MX = 40;

  let W = 1;
  let H = 1;
  let SH = 1;
  let bgW = window.innerWidth || 1200;
  let bgH = window.innerHeight || 800;
  let overlap = 1;
  let cs = 1;
  let layers = specs.map(() => null);
  let building = n;
  let builtFor = '';
  let mistC = null;
  let stars = new Float32Array(0);
  let bgStars = new Float32Array(0);
  let rebuildTimer = 0;

  let tx = 0;
  let ty = 0;
  let px = 0;
  let py = 0;
  let kT = 1;
  let k = 1;
  let kSet = -1;
  let visible = true;
  let seenAt = null;
  let revealAt = null;
  let animCompleted = false;
  let raf = 0;
  let last = 0;

  const updateWebsiteBackground = () => {
    const r = rootElement.getBoundingClientRect();
    const reachedBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 50);
    const inFooter = r.top <= 120 || reachedBottom;
    const shouldMatch = inFooter && animCompleted;

    if (shouldMatch) {
      if (!document.body.classList.contains('footer-ground-active')) {
        document.body.classList.add('footer-ground-active');
        document.documentElement.classList.add('footer-ground-active');
        const meta = document.getElementById('theme-color-meta');
        if (meta) meta.setAttribute('content', colors.ground);
      }
    } else {
      if (document.body.classList.contains('footer-ground-active')) {
        document.body.classList.remove('footer-ground-active');
        document.documentElement.classList.remove('footer-ground-active');
        const isDarkNow = document.documentElement.classList.contains('dark') ||
          document.documentElement.getAttribute('data-theme') === 'dark';
        const meta = document.getElementById('theme-color-meta');
        if (meta) meta.setAttribute('content', isDarkNow ? '#070d09' : '#fcf8f2');
      }
    }
  };

  const measure = () => {
    W = Math.max(1, scene.clientWidth, rootElement.clientWidth);
    H = Math.max(1, hero.offsetHeight);
    SH = Math.max(1, rootElement.clientHeight, rootElement.offsetHeight, window.innerHeight);
    bgW = Math.max(1, window.innerWidth);
    bgH = Math.max(1, window.innerHeight);
    scene.style.height = SH + 'px';
    overlap = Math.round(Math.max(160, (SH - H) * 0.5));
    cs = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(W * cs);
    const ch = Math.round(SH * cs);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    if (bgCanvas) {
      const cwBg = Math.round(bgW * cs);
      const chBg = Math.round(bgH * cs);
      if (bgCanvas.width !== cwBg || bgCanvas.height !== chBg) {
        bgCanvas.width = cwBg;
        bgCanvas.height = chBg;
      }
    }
    const sig = W + 'x' + H + 'x' + SH + 'x' + bgW + 'x' + bgH;
    if (sig !== builtFor) {
      window.clearTimeout(rebuildTimer);
      const first = builtFor === '';
      builtFor = sig;
      const go = () => {
        building = 0;
        job = null;
        makeMist();
        makeStars();
        wake();
      };
      if (first) go();
      else rebuildTimer = window.setTimeout(go, 140);
    }
  };

  let job = null;
  const startJob = (i) => {
    const spec = specs[i];
    let minC = Infinity;
    for (let x = -MX; x <= W + MX; x += 3) minC = Math.min(minC, mrfCrestAt(spec, x, W, H));
    const top = Math.floor(minC - 4);
    const s = Math.min(window.devicePixelRatio || 1, spec.q > 0.5 ? 1.25 : 1);
    const w = Math.ceil((W + MX * 2) * s);
    const h = Math.ceil((SH - top) * s);
    const c = document.createElement('canvas');
    const g = h > 0 ? c.getContext('2d') : null;
    if (!g) {
      layers[i] = null;
      return null;
    }
    c.width = w;
    c.height = h;
    let detailTo = H + overlap * 0.8;
    if (i + 1 < n) {
      let maxC = -Infinity;
      for (let x = -MX; x <= W + MX; x += 3) maxC = Math.max(maxC, mrfCrestAt(specs[i + 1], x, W, H));
      detailTo = Math.min(detailTo, maxC + 70);
    }
    const o = { s, mx: MX, top, W, H, spec, lit: hillC[i][0], shadow: hillC[i][1], haze: hazeC, noise, detailTo };
    return { i, c, g, img: g.createImageData(w, h), o, w, h, col: 0 };
  };

  const work = (budget) => {
    const t0 = performance.now();
    while (building < n && performance.now() - t0 < budget) {
      if (!job) job = startJob(building);
      if (!job) {
        building++;
        continue;
      }
      const next = Math.min(job.w, job.col + 40);
      mrfPaintLayer(job.img.data, job.w, job.h, job.o, job.col, next);
      job.col = next;
      if (job.col >= job.w) {
        job.g.putImageData(job.img, 0, 0);
        layers[job.i] = { c: job.c, top: job.o.top, w: job.w / job.o.s, h: job.h / job.o.s };
        job = null;
        building++;
      }
    }
  };

  const progress = () => (building >= n ? 1 : (building + (job ? job.col / job.w : 0)) / n);

  const makeMist = () => {
    const w = 320;
    const h = 64;
    const a = mrfMistBand(noise, w, h);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    if (!g) return;
    const img = g.createImageData(w, h);
    for (let i = 0; i < a.length; i++) {
      img.data[i * 4] = hazeC[0];
      img.data[i * 4 + 1] = hazeC[1];
      img.data[i * 4 + 2] = hazeC[2];
      img.data[i * 4 + 3] = a[i] * 255;
    }
    g.putImageData(img, 0, 0);
    mistC = c;
  };

  const makeStars = () => {
    const rnd = mrfRng(seed + 404);
    // 1. Stars for footer canvas (both dark and light modes)
    const count = Math.round((W * H) / 4800);
    stars = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      stars[i * 4] = rnd() * W;
      stars[i * 4 + 1] = Math.pow(rnd(), 1.35) * H * 0.65;
      stars[i * 4 + 2] = 0.5 + rnd() * rnd() * 1.35;
      stars[i * 4 + 3] = rnd() * 6.28;
    }

    // 2. Stars for website background canvas (both dark and light modes across full screen)
    const bgRnd = mrfRng(seed + 909);
    const bgCount = Math.round((bgW * bgH) / 4000);
    bgStars = new Float32Array(bgCount * 5);
    for (let i = 0; i < bgCount; i++) {
      bgStars[i * 5] = bgRnd() * bgW;
      bgStars[i * 5 + 1] = bgRnd() * bgH;
      bgStars[i * 5 + 2] = 0.5 + bgRnd() * bgRnd() * 1.4;
      bgStars[i * 5 + 3] = bgRnd() * 6.28;
      bgStars[i * 5 + 4] = 0.35 + bgRnd() * 0.65;
    }
  };

  const draw = (now) => {
    const dt = revealAt === null ? -1 : now - revealAt;
    const dawn = dt < 0 ? 0 : mrfSmooth(0, 1600, dt);

    // =========================================================================
    // 1. Render Website Background Celestial Atmosphere & Enlarged Hover Glow
    // =========================================================================
    if (bgCanvas && bgCtx) {
      bgCtx.setTransform(cs, 0, 0, cs, 0, 0);
      bgCtx.clearRect(0, 0, bgW, bgH);

      // Base Celestial Sky Gradient
      const bgSky = bgCtx.createLinearGradient(0, 0, 0, bgH);
      if (night) {
        bgSky.addColorStop(0, 'rgba(7, 13, 9, 0.96)');
        bgSky.addColorStop(0.65, 'rgba(19, 32, 22, 0.94)');
        bgSky.addColorStop(1, 'rgba(5, 9, 6, 0.98)');
      } else {
        bgSky.addColorStop(0, 'rgba(252, 248, 242, 0.96)');
        bgSky.addColorStop(0.65, 'rgba(244, 230, 211, 0.93)');
        bgSky.addColorStop(1, 'rgba(27, 25, 13, 0.96)');
      }
      bgCtx.fillStyle = bgSky;
      bgCtx.fillRect(0, 0, bgW, bgH);

      // Stars in the website background (Dark mode: silver/moonlit; Light mode: royal golden stars)
      const bgStarCol = night ? [236, 240, 255] : [212, 175, 115];
      const bgHaloCol = night ? [235, 216, 167] : [253, 227, 184];
      const starSpeed = night ? 0.0013 : 0.0011;

      for (let i = 0; i < bgStars.length; i += 5) {
        const tw = reduced ? 0.75 : 0.5 + 0.5 * Math.sin(now * starSpeed + bgStars[i + 3]);
        const starAlpha = Math.min(1, (night ? 0.82 : 0.72) * tw * bgStars[i + 4] * Math.max(0.65, dawn));
        bgCtx.fillStyle = css(bgStarCol, starAlpha);
        const r = bgStars[i + 2];
        const sx = bgStars[i] - r / 2 + px * 8;
        const sy = bgStars[i + 1] - r / 2 + py * 4;
        bgCtx.fillRect(sx, sy, r, r);

        if (r > 1.25) {
          bgCtx.fillStyle = css(bgHaloCol, starAlpha * (night ? 0.28 : 0.42));
          bgCtx.fillRect(sx - 1, sy - 1, r + 2, r + 2);
        }
      }

      // Enlarged On-Hover Radial Glow Pool extending across the website background
      const footerRect = rootElement.getBoundingClientRect();
      const screenOx = bgW * ((night ? 0.84 : 0.7) + px * 0.35);
      const screenOy = Math.max(bgH * 0.1, Math.min(bgH * 0.9, footerRect.top + H * (night ? 0.1 : 0.14) + py * H * 0.08));

      const bgR = Math.max(bgW, bgH) * 1.35;
      const bgGlow = bgCtx.createRadialGradient(screenOx, screenOy, 0, screenOx, screenOy, bgR);
      bgGlow.addColorStop(0, css(glowC, (night ? 0.38 : 0.58) * Math.max(0.6, dawn)));
      bgGlow.addColorStop(0.28, css(glowC, (night ? 0.16 : 0.28) * Math.max(0.6, dawn)));
      bgGlow.addColorStop(0.62, css(glowC, (night ? 0.05 : 0.10) * Math.max(0.6, dawn)));
      bgGlow.addColorStop(1, css(glowC, 0));
      bgCtx.fillStyle = bgGlow;
      bgCtx.fillRect(0, 0, bgW, bgH);

      // Soft-light composite pool
      bgCtx.globalCompositeOperation = 'soft-light';
      const bgPool = bgCtx.createRadialGradient(screenOx, bgH * 0.65, 0, screenOx, bgH * 0.65, bgW * 0.85);
      bgPool.addColorStop(0, css(glowC, (night ? 0.30 : 0.45) * Math.max(0.6, dawn)));
      bgPool.addColorStop(1, css(glowC, 0));
      bgCtx.fillStyle = bgPool;
      bgCtx.fillRect(0, 0, bgW, bgH);
      bgCtx.globalCompositeOperation = 'source-over';
    }

    // =========================================================================
    // 2. Render Footer Procedural Scene (Sky, Stars, Radial Glow, Hills)
    // =========================================================================
    ctx.setTransform(cs, 0, 0, cs, 0, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.8);
    sky.addColorStop(0, css(sky0, 1));
    sky.addColorStop(1, css(sky1, 1));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, SH);

    const ox = W * ((night ? 0.84 : 0.7) + px * 0.3);
    const oy = H * (night ? 0.1 : 0.14) + py * H * 0.08;

    // Stars in footer canvas for BOTH dark and light modes
    const starCol = night ? [236, 240, 255] : [212, 175, 115];
    const starHalo = night ? [235, 216, 167] : [253, 227, 184];
    for (let i = 0; i < stars.length; i += 4) {
      const tw = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(now * (night ? 0.0013 : 0.0011) + stars[i + 3]);
      ctx.fillStyle = css(starCol, (night ? 0.75 : 0.7) * tw * dawn);
      const r = stars[i + 2];
      ctx.fillRect(stars[i] - r / 2 + px * 6, stars[i + 1] - r / 2, r, r);
      if (r > 1.25) {
        ctx.fillStyle = css(starHalo, (night ? 0.25 : 0.38) * tw * dawn);
        ctx.fillRect(stars[i] - r / 2 - 1 + px * 6, stars[i + 1] - r / 2 - 1, r + 2, r + 2);
      }
    }

    const R = Math.max(W, H) * 0.85;
    const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, R);
    glow.addColorStop(0, css(glowC, (night ? 0.28 : 0.75) * dawn));
    glow.addColorStop(0.35, css(glowC, (night ? 0.10 : 0.30) * dawn));
    glow.addColorStop(0.7, css(glowC, (night ? 0.03 : 0.10) * dawn));
    glow.addColorStop(1, css(glowC, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, SH);

    if (night) {
      ctx.fillStyle = css([244, 246, 255], 0.92 * dawn);
      ctx.beginPath();
      ctx.arc(ox, oy, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    const par = !reduced ? 1 - k : 0;
    const mistOn = mist > 0;

    for (let i = 0; i < (dt < 0 ? 0 : n); i++) {
      const L = layers[i];
      if (!L) continue;
      const e = dt < 0 ? 0 : mrfEase((dt - 150 - i * 120) / 1700);
      const rise = (1 - e) * H * (0.2 + 0.07 * i);
      const sy = par * (10 + i * 22);
      const lx = -px * (2 + i * 5);
      const ly = -py * (1 + i * 2);
      ctx.drawImage(L.c, -MX + lx, L.top + rise + sy + ly, L.w, L.h);

      if (mistOn && mistC && (i === 1 || i === 3) && i + 1 < n) {
        const bw = W * 1.7;
        const bh = H * (i === 1 ? 0.26 : 0.2);
        const speed = (i === 1 ? 7 : 11) * drift;
        const off = reduced ? 0 : ((now * speed) / 1000) % bw;
        const y = H * specs[i + 1].base - bh * 0.62 + rise * 0.6 + sy;
        ctx.globalAlpha = mist * (i === 1 ? 0.9 : 0.65) * (dt < 0 ? 0 : mrfSmooth(900, 2600, dt));
        ctx.drawImage(mistC, -off + lx * 1.4, y, bw, bh);
        ctx.drawImage(mistC, bw - off + lx * 1.4, y, bw, bh);
        ctx.globalAlpha = 1;
      }
    }

    ctx.globalCompositeOperation = 'soft-light';
    const pool = ctx.createRadialGradient(ox, H * 0.7, 0, ox, H * 0.7, W * 0.5);
    pool.addColorStop(0, css(glowC, (night ? 0.3 : 0.45) * dawn));
    pool.addColorStop(1, css(glowC, 0));
    ctx.fillStyle = pool;
    ctx.fillRect(0, 0, W, SH);
    ctx.globalCompositeOperation = 'source-over';

    const fog = dt < 0 ? 1 : 1 - mrfSmooth(100, 2100, dt);
    if (fog > 0) {
      const f = ctx.createLinearGradient(0, 0, 0, SH);
      f.addColorStop(0, css(sky0, fog));
      f.addColorStop(1, css(sky1, fog));
      ctx.fillStyle = f;
      ctx.fillRect(0, 0, W, SH);
    }

    const g = ctx.createLinearGradient(0, H - overlap * 0.05, 0, Math.min(SH, H + overlap * 1.5));
    g.addColorStop(0, css(groundC, 0));
    g.addColorStop(0.35, css(groundC, 0.72));
    g.addColorStop(0.7, css(groundC, 1));
    g.addColorStop(1, css(groundC, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, H - overlap * 0.05, W, SH - H + overlap * 0.05 + 1);
  };

  const tick = (now) => {
    raf = 0;
    const busy = building < n;
    if (busy) work(revealAt === null ? 14 : visible ? 8 : 6);
    if (revealAt === null && seenAt !== null && building >= n && (reduced || now - seenAt > 650)) {
      revealAt = reduced ? -1e9 : now;
      rootElement.classList.add('mrf-in');
    }
    if (revealAt !== null && !animCompleted && (reduced || now - revealAt >= 3000)) {
      animCompleted = true;
      rootElement.classList.add('mrf-anim-done');
      updateWebsiteBackground();
    }
    if (!visible) {
      if (busy) raf = requestAnimationFrame(tick);
      return;
    }
    const r = rootElement.getBoundingClientRect();
    if (!reduced) {
      kT = mrfArrival(r.top, r.height, window.innerHeight);
    } else kT = 1;

    const reachedBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 50);
    const inFooter = r.top <= 120 || reachedBottom;
    if (inFooter && !document.body.classList.contains('footer-focused')) {
      document.body.classList.add('footer-focused');
      if (typeof window !== 'undefined' && window.__closeStaggeredMenu) {
        window.__closeStaggeredMenu();
      }
    } else if (!inFooter && document.body.classList.contains('footer-focused')) {
      document.body.classList.remove('footer-focused');
    }
    updateWebsiteBackground();

    const live = !reduced;
    px += ((live ? tx : 0) - px) * 0.06;
    py += ((live ? ty : 0) - py) * 0.06;
    k += (kT - k) * 0.1;
    if (Math.abs(k - kSet) > 0.0008) {
      kSet = k;
      rootElement.style.setProperty('--mrf-k', k.toFixed(4));
    }
    const easing = Math.abs((live ? tx : 0) - px) > 0.001 || Math.abs((live ? ty : 0) - py) > 0.001 || Math.abs(kT - k) > 0.001;
    const intro = (revealAt === null && seenAt !== null) || (revealAt !== null && now - revealAt < 3000);
    const ambient = !reduced;

    if (busy || intro || easing || now - last > 33) {
      draw(now);
      last = now;
    }
    if (busy || intro || easing || ambient) raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (!raf && (visible || building < n)) raf = requestAnimationFrame(tick);
  };

  const onMove = (e) => {
    const r = scene.getBoundingClientRect();
    tx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / Math.max(1, r.width) - 0.5));
    ty = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / Math.max(1, r.height) - 0.5));
    wake();
  };

  const onWindowMove = (e) => {
    const r = scene.getBoundingClientRect();
    tx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / Math.max(1, r.width) - 0.5));
    ty = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / Math.max(1, r.height) - 0.5));
    wake();
  };

  const onLeave = () => {
    tx = 0;
    ty = 0;
    wake();
  };

  const onScroll = () => {
    const r = rootElement.getBoundingClientRect();
    const reachedBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 50);
    const inFooter = r.top <= 120 || reachedBottom;
    if (inFooter && seenAt === null) {
      seenAt = performance.now();
    }
    if (inFooter && !document.body.classList.contains('footer-focused')) {
      document.body.classList.add('footer-focused');
      if (typeof window !== 'undefined' && window.__closeStaggeredMenu) {
        window.__closeStaggeredMenu();
      }
    } else if (!inFooter && document.body.classList.contains('footer-focused')) {
      document.body.classList.remove('footer-focused');
    }
    updateWebsiteBackground();
    wake();
  };

  // Magnetic CTA pull
  const ctaBtn = rootElement.querySelector('.mrf-cta');
  const onCtaMove = (e) => {
    const r = ctaBtn.getBoundingClientRect();
    const fx = e.clientX - r.left;
    const fy = e.clientY - r.top;
    ctaBtn.style.setProperty('--fx', fx + 'px');
    ctaBtn.style.setProperty('--fy', fy + 'px');
    if (reduced) return;
    ctaBtn.style.setProperty('--mx', ((fx / r.width - 0.5) * 10).toFixed(2) + 'px');
    ctaBtn.style.setProperty('--my', ((fy / r.height - 0.5) * 8).toFixed(2) + 'px');
  };
  const onCtaLeave = () => {
    ctaBtn.style.setProperty('--mx', '0px');
    ctaBtn.style.setProperty('--my', '0px');
  };

  if (ctaBtn) {
    ctaBtn.addEventListener('pointermove', onCtaMove);
    ctaBtn.addEventListener('pointerleave', onCtaLeave);
  }

  // Registry form submission handling
  const form = rootElement.querySelector('#mrf-registry-form');
  const emailInput = rootElement.querySelector('#mrf-email-input');
  const emailMsg = rootElement.querySelector('#mrf-email-msg');
  if (form && emailInput) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (emailInput.value || '').trim();
      if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(val)) {
        form.setAttribute('data-state', 'error');
        if (emailMsg) {
          emailMsg.textContent = val ? 'العنوان غير مكتمل / Invalid address.' : 'يرجى إدخال البريد الإلكتروني / Enter email.';
          emailMsg.setAttribute('data-show', 'true');
        }
        return;
      }
      form.setAttribute('data-state', 'sending');
      setTimeout(() => {
        form.setAttribute('data-state', 'done');
        if (emailMsg) {
          emailMsg.textContent = 'تم تسجيل طلب الانضمام للسجل الملكي بنجاح.';
          emailMsg.setAttribute('data-show', 'true');
        }
      }, 800);
    });
  }

  // MutationObserver for live theme toggling
  const updateTheme = () => {
    const darkNow = document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark';
    if (darkNow === isDark) return;
    isDark = darkNow;
    colors = isDark ? ETLAMO_PALETTES.moonlit : ETLAMO_PALETTES.golden;
    hills = colors.hills;
    night = !!colors.night;
    sky0 = rgb(colors.sky[0], [252, 248, 242]);
    sky1 = rgb(colors.sky[1], [244, 230, 211]);
    hazeC = rgb(colors.haze, sky1);
    glowC = rgb(colors.glow, [253, 227, 184]);
    groundC = rgb(colors.ground, [27, 25, 13]);
    inkC = rgb(colors.ink, [25, 20, 11]);
    hillC = hills.map((h) => [rgb(h[0], [180, 160, 120]), rgb(h[1], [130, 110, 80])]);
    specs = hillC.map((_, i) => mrfLayerSpec(i, n, seed));
    layers = specs.map(() => null);
    building = 0;
    job = null;
    applyCustomProperties();
    makeMist();
    makeStars();
    draw(performance.now());
    wake();
  };
  const themeMo = new MutationObserver(updateTheme);
  themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

  measure();
  draw(performance.now());

  rootElement.addEventListener('pointermove', onMove);
  rootElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('pointermove', onWindowMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  const ro = new ResizeObserver(() => {
    measure();
    draw(performance.now());
    wake();
  });
  ro.observe(rootElement);
  ro.observe(hero);

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e) return;
      visible = e.isIntersecting;
      if (e.isIntersecting && e.intersectionRatio >= 0.12 && seenAt === null) seenAt = performance.now();
      if (visible) wake();
    },
    { threshold: [0, 0.12, 0.3] }
  );
  io.observe(rootElement);
  wake();

  return () => {
    document.body.classList.remove('footer-focused', 'footer-ground-active');
    document.documentElement.classList.remove('footer-ground-active');
    const isDarkNow = document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark';
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', isDarkNow ? '#070d09' : '#fcf8f2');
    cancelAnimationFrame(raf);
    window.clearTimeout(rebuildTimer);
    themeMo.disconnect();
    ro.disconnect();
    io.disconnect();
    rootElement.removeEventListener('pointermove', onMove);
    rootElement.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('pointermove', onWindowMove);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (ctaBtn) {
      ctaBtn.removeEventListener('pointermove', onCtaMove);
      ctaBtn.removeEventListener('pointerleave', onCtaLeave);
    }
  };
}
