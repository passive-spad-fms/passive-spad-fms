/* Passive SPAD Foundation Models — site interactions & photon simulations.
   Everything here is a lightweight, illustrative simulation of Bernoulli photon
   detection; no external dependencies. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = Math.random;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  // ---------- sampling helpers ----------
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function poisson(lambda) {
    if (lambda > 30) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * gauss()));
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  }
  function binomial(n, p) {
    if (p <= 0) return 0;
    if (p >= 1) return n;
    if (n <= 24) { let c = 0; for (let i = 0; i < n; i++) if (rand() < p) c++; return c; }
    const mean = n * p;
    if (mean < 8) return Math.min(n, poisson(mean));
    if (n - mean < 8) return n - Math.min(n, poisson(n - mean));
    return clamp(Math.round(mean + Math.sqrt(mean * (1 - p)) * gauss()), 0, n);
  }

  // ---------- run animations only while visible ----------
  function animateWhileVisible(el, step, fps = 60) {
    let visible = false, raf = 0, last = 0;
    const interval = 1000 / fps;
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      if (ts - last < interval - 1) return;
      last = ts;
      step(ts);
    };
    step(0);
    if (reduceMotion) return;
    new IntersectionObserver((entries) => {
      const v = entries[0].isIntersecting;
      if (v && !visible) raf = requestAnimationFrame(loop);
      if (!v && visible) cancelAnimationFrame(raf);
      visible = v;
    }, { threshold: 0.05 }).observe(el);
  }

  // =====================================================================
  //  Synthetic night street scene: static background + moving sprites
  // =====================================================================
  function readLum(canvas) {
    const { width: w, height: h } = canvas;
    const d = canvas.getContext("2d").getImageData(0, 0, w, h).data;
    const lum = new Float32Array(w * h), alpha = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { lum[i] = d[i * 4] / 255; alpha[i] = d[i * 4 + 3] / 255; }
    return { w, h, lum, alpha };
  }

  function makeStreetScene(W, H) {
    const s = W / 200; // design units are for a 200 x 125 grid
    const bg = document.createElement("canvas");
    bg.width = W; bg.height = H;
    const g = bg.getContext("2d");
    const grey = (v) => { const c = Math.round(clamp(v, 0, 1) * 255); return `rgb(${c},${c},${c})`; };

    // sky
    const sky = g.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, grey(0.04)); sky.addColorStop(1, grey(0.12));
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // moon
    g.fillStyle = grey(0.9); g.beginPath(); g.arc(168 * s, 16 * s, 5 * s, 0, 7); g.fill();
    // buildings
    const blds = [[0, 34, 26], [24, 48, 18], [44, 26, 30], [76, 40, 22], [100, 30, 16], [118, 52, 24], [144, 38, 20], [166, 44, 34]];
    for (const [x, top, w] of blds) {
      g.fillStyle = grey(0.06 + ((x * 7) % 5) * 0.012);
      g.fillRect(x * s, top * s, w * s, (90 - top) * s);
      for (let wy = top + 5; wy < 82; wy += 7) {
        for (let wx = x + 3; wx < x + w - 4; wx += 6) {
          if (((wx * 13 + wy * 7) % 11) < 3) { g.fillStyle = grey(0.55 + ((wx + wy) % 4) * 0.1); g.fillRect(wx * s, wy * s, 3 * s, 3 * s); }
        }
      }
    }
    // ground, road, lane markings
    g.fillStyle = grey(0.1); g.fillRect(0, 88 * s, W, H);
    g.fillStyle = grey(0.07); g.fillRect(0, 98 * s, W, 20 * s);
    g.fillStyle = grey(0.3);
    for (let x = 4; x < 200; x += 18) g.fillRect(x * s, 107.5 * s, 8 * s, 1.2 * s);
    // street lamp with a pool of light
    g.fillStyle = grey(0.2); g.fillRect(58 * s, 50 * s, 1.6 * s, 40 * s);
    const glow = g.createRadialGradient(60 * s, 50 * s, 0, 60 * s, 50 * s, 30 * s);
    glow.addColorStop(0, "rgba(255,255,255,0.55)"); glow.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = glow; g.fillRect(30 * s, 20 * s, 60 * s, 60 * s);
    const pool = g.createRadialGradient(60 * s, 94 * s, 0, 60 * s, 94 * s, 26 * s);
    pool.addColorStop(0, "rgba(255,255,255,0.22)"); pool.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = pool; g.fillRect(30 * s, 80 * s, 60 * s, 30 * s);
    g.fillStyle = grey(1); g.beginPath(); g.arc(60 * s, 50 * s, 2.2 * s, 0, 7); g.fill();

    // pedestrian sprite
    const ped = document.createElement("canvas");
    ped.width = Math.ceil(9 * s); ped.height = Math.ceil(24 * s);
    const p = ped.getContext("2d");
    p.fillStyle = grey(0.5);
    p.beginPath(); p.arc(4.5 * s, 3 * s, 2.6 * s, 0, 7); p.fill();
    p.fillRect(2 * s, 6 * s, 5 * s, 9 * s);
    p.fillStyle = grey(0.4);
    p.fillRect(2.2 * s, 15 * s, 1.8 * s, 9 * s); p.fillRect(5 * s, 15 * s, 1.8 * s, 9 * s);

    // car sprite (headlights at the front/left, tail light at the back)
    const car = document.createElement("canvas");
    car.width = Math.ceil(46 * s); car.height = Math.ceil(16 * s);
    const c = car.getContext("2d");
    c.fillStyle = grey(0.32);
    c.beginPath(); c.moveTo(4 * s, 8 * s); c.lineTo(12 * s, 1 * s); c.lineTo(32 * s, 1 * s); c.lineTo(40 * s, 7 * s);
    c.lineTo(45 * s, 8 * s); c.lineTo(45 * s, 13 * s); c.lineTo(1 * s, 13 * s); c.lineTo(1 * s, 9 * s); c.closePath(); c.fill();
    c.fillStyle = grey(0.18); c.fillRect(14 * s, 2.5 * s, 8 * s, 4.5 * s); c.fillRect(24 * s, 2.5 * s, 8 * s, 4.5 * s);
    c.fillStyle = grey(0.08);
    c.beginPath(); c.arc(10 * s, 13 * s, 3 * s, 0, 7); c.arc(36 * s, 13 * s, 3 * s, 0, 7); c.fill();
    c.fillStyle = grey(1); c.fillRect(0, 8.5 * s, 3 * s, 2.5 * s);
    c.fillStyle = grey(0.7); c.fillRect(43.5 * s, 8.5 * s, 1.5 * s, 2 * s);

    return {
      W, H, s,
      bg: readLum(bg).lum,
      sprites: [
        { label: "person", img: readLum(ped), y: 74 * s, x0: 20 * s, speed: 0.006 * s, span: 170 * s },
        { label: "car", img: readLum(car), y: 92 * s, x0: 210 * s, speed: -0.035 * s, span: 270 * s },
      ],
    };
  }

  // x position of a sprite at simulation time t (in binary frames)
  function spriteX(sp, t) {
    const travel = (sp.speed * t) % sp.span;
    let x = sp.x0 + travel;
    if (sp.speed < 0 && x < -sp.img.w) x += sp.span;
    if (sp.speed > 0 && x > sp.x0 + sp.span - 1) x -= sp.span;
    return x;
  }

  // Luminance averaged over [t0, t1] (motion blur when the window is long).
  function sceneLum(scene, out, t0, t1, samples) {
    out.set(scene.bg);
    const K = Math.max(1, samples);
    for (const sp of scene.sprites) {
      const { w, h, lum, alpha } = sp.img;
      for (let k = 0; k < K; k++) {
        const t = K === 1 ? t1 : t0 + ((t1 - t0) * (k + 0.5)) / K;
        const ox = Math.round(spriteX(sp, t)), oy = Math.round(sp.y);
        const wt = 1 / K;
        for (let y = 0; y < h; y++) {
          const yy = oy + y;
          if (yy < 0 || yy >= scene.H) continue;
          for (let x = 0; x < w; x++) {
            const xx = ox + x;
            if (xx < 0 || xx >= scene.W) continue;
            const a = alpha[y * w + x];
            if (a === 0) continue;
            const j = yy * scene.W + xx;
            out[j] += wt * a * (lum[y * w + x] - scene.bg[j]);
          }
        }
      }
    }
    return out;
  }

  function spriteBoxes(scene, t) {
    return scene.sprites.map((sp) => ({ label: sp.label, x: spriteX(sp, t), y: sp.y, w: sp.img.w, h: sp.img.h }))
      .filter((b) => b.x + b.w > 2 && b.x < scene.W - 2);
  }

  // Photon budget inside a box: sum of mean rates (for "evidence" / confidence)
  function boxRate(lum, W, b, flux) {
    let sum = 0;
    const x0 = Math.max(0, Math.floor(b.x)), x1 = Math.min(W, Math.ceil(b.x + b.w));
    const H = lum.length / W;
    const y0 = Math.max(0, Math.floor(b.y)), y1 = Math.min(H, Math.ceil(b.y + b.h));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) sum += lum[y * W + x] * flux;
    return sum;
  }

  // Tone colours
  const PHOTON = [255, 244, 214];
  const AMBER = [255, 194, 75];
  const COOL = "#5cc8ff";

  function drawBoxes(ctx, boxes, scale, opts = {}) {
    ctx.save();
    ctx.lineWidth = Math.max(1.5, scale * 0.6);
    ctx.font = `500 ${Math.max(9, Math.round(scale * 3.4))}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textBaseline = "bottom";
    for (const b of boxes) {
      const conf = b.conf ?? 1;
      if (conf < (opts.minConf ?? 0)) continue;
      const x = b.x * scale, y = b.y * scale, w = b.w * scale, h = b.h * scale;
      ctx.globalAlpha = clamp(0.35 + conf, 0, 1);
      ctx.strokeStyle = COOL;
      ctx.setLineDash(conf < 0.5 ? [4, 3] : []);
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      ctx.setLineDash([]);
      const text = `${b.label} ${conf.toFixed(2)}`;
      const tw = ctx.measureText(text).width + 8;
      const th = Math.max(12, scale * 4.6);
      const ty = y - 2 > th ? y - 2 : y + h + 2 + th;
      ctx.fillStyle = COOL;
      ctx.fillRect(x - 2, ty - th, tw, th);
      ctx.fillStyle = "#04121c";
      ctx.fillText(text, x + 2, ty - 2);
    }
    ctx.restore();
  }

  // =====================================================================
  //  HERO: binary frames flickering, evidence accumulating, detections firing
  // =====================================================================
  (function hero() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 160, H = 100, SCALE = canvas.width / W;
    const scene = makeStreetScene(W, H);
    const lum = new Float32Array(W * H);
    const ema = new Float32Array(W * H);
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const octx = off.getContext("2d");
    const img = octx.createImageData(W, H);
    const chip = document.getElementById("hero-fps");
    const flux = 0.12, DARK = 0.0008, FRAMES_PER_TICK = 30;
    const evidence = new Map();
    let t = 0, cycleStart = 0;

    animateWhileVisible(canvas, () => {
      t += FRAMES_PER_TICK;
      if (t - cycleStart > FRAMES_PER_TICK * 260) { cycleStart = t; ema.fill(0); evidence.clear(); }
      const age = (t - cycleStart) / FRAMES_PER_TICK;
      sceneLum(scene, lum, t, t, 1);
      const a = Math.max(0.03, 1 / (age + 1));
      const d = img.data;
      for (let i = 0; i < W * H; i++) {
        const p = 1 - Math.exp(-(flux * lum[i] + DARK));
        const hit = rand() < p ? 1 : 0;
        ema[i] += a * (hit - ema[i]);
        const est = Math.min(1, -Math.log(1 - Math.min(ema[i], 0.999)) / flux);
        const v = Math.pow(est, 0.55) * 0.75;
        let r = v * AMBER[0] * 0.8, g = v * AMBER[1] * 0.8, b = v * AMBER[2] * 0.6;
        if (hit) { r = PHOTON[0]; g = PHOTON[1]; b = PHOTON[2]; }
        d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);

      // Evidence accrues with photons on the object; detection fires early,
      // long before the accumulated image looks clean.
      const boxes = spriteBoxes(scene, t);
      for (const b of boxes) {
        const e = (evidence.get(b.label) || 0) + boxRate(lum, W, b, flux) * FRAMES_PER_TICK;
        evidence.set(b.label, e);
        b.conf = 1 - Math.exp(-e / (b.label === "car" ? 900 : 260));
      }
      drawBoxes(ctx, boxes, SCALE, { minConf: 0.15 });
      if (chip) chip.textContent = `t = ${(((t - cycleStart) * 10) / 1000).toFixed(2)} ms`;
    }, 30);
  })();

  // =====================================================================
  //  DEMO: binary frame vs reconstruction vs photon-native perception
  // =====================================================================
  (function demo() {
    const cB = document.getElementById("demo-binary");
    if (!cB) return;
    const cR = document.getElementById("demo-recon");
    const cF = document.getElementById("demo-fm");
    const fluxIn = document.getElementById("flux");
    const framesIn = document.getElementById("frames");
    const fluxOut = document.getElementById("flux-out");
    const framesOut = document.getElementById("frames-out");
    const pauseBtn = document.getElementById("demo-pause");
    const roPhotons = document.getElementById("ro-photons");
    const roSnr = document.getElementById("ro-snr");
    const roLat = document.getElementById("ro-lat");
    const reconLat = document.getElementById("recon-lat");

    const W = 200, H = 125;
    const scene = makeStreetScene(W, H);
    const lumNow = new Float32Array(W * H);
    const lumWin = new Float32Array(W * H);
    const lumShort = new Float32Array(W * H);
    const mk = (c) => { const ctx = c.getContext("2d"); return { ctx, img: ctx.createImageData(W, H) }; };
    const B = mk(cB), R = mk(cR), F = mk(cF);
    const DARK = 0.0005, FM_WINDOW = 16;
    let meanLum = 0;
    for (let i = 0; i < W * H; i++) meanLum += scene.bg[i];
    meanLum /= W * H;

    let t = 0, paused = false;
    const fmtTime = (frames) => { const us = frames * 10; return us >= 1000 ? `${(us / 1000).toFixed(us >= 10000 ? 1 : 2)} ms` : `${us} µs`; };
    const params = () => ({ flux: Math.pow(10, +fluxIn.value), N: Math.pow(2, +framesIn.value) });

    function labels() {
      const { flux, N } = params();
      fluxOut.textContent = `${flux < 0.01 ? flux.toFixed(3) : flux.toFixed(2)} photons/px/frame`;
      framesOut.textContent = `${N} frame${N > 1 ? "s" : ""} · ${fmtTime(N)}`;
      reconLat.textContent = `${fmtTime(N)} window`;
      const photons = flux * meanLum * N;
      roPhotons.textContent = photons < 10 ? photons.toFixed(2) : photons.toFixed(0);
      roSnr.textContent = `${Math.sqrt(photons).toFixed(1)}×`;
      roLat.textContent = fmtTime(N);
    }

    function render() {
      const { flux, N } = params();
      sceneLum(scene, lumNow, t, t, 1);
      sceneLum(scene, lumWin, t - N, t, Math.min(12, Math.max(1, Math.round(N / 16))));
      sceneLum(scene, lumShort, t - FM_WINDOW, t, 1);
      const satEst = 1 - Math.exp(-flux);
      const bd = B.img.data, rd = R.img.data, fd = F.img.data;
      for (let i = 0; i < W * H; i++) {
        const o = i * 4;
        // A: one binary frame
        const p = 1 - Math.exp(-(flux * lumNow[i] + DARK));
        const hit = rand() < p;
        bd[o] = hit ? PHOTON[0] : 0; bd[o + 1] = hit ? PHOTON[1] : 0; bd[o + 2] = hit ? PHOTON[2] : 0; bd[o + 3] = 255;

        // B: sum N binary frames, invert the SPAD response, tone-map
        const pw = 1 - Math.exp(-(flux * lumWin[i] + DARK));
        const frac = binomial(N, pw) / N;
        const est = -Math.log(1 - Math.min(frac, 1 - 1 / (2 * N))) / Math.max(flux, 1e-6);
        const v = Math.pow(clamp(est, 0, 1), 1 / 2.2) * 255;
        rd[o] = v; rd[o + 1] = v; rd[o + 2] = v; rd[o + 3] = 255;

        // C: dim view of a short photon window, overlaid with structure
        const ps = 1 - Math.exp(-(flux * lumShort[i] + DARK));
        const cs = binomial(FM_WINDOW, ps) / FM_WINDOW;
        const vs = Math.pow(clamp(cs / Math.max(satEst, 1e-3), 0, 1), 0.6) * 0.5;
        fd[o] = vs * 150; fd[o + 1] = vs * 170; fd[o + 2] = vs * 200; fd[o + 3] = 255;
      }
      B.ctx.putImageData(B.img, 0, 0);
      R.ctx.putImageData(R.img, 0, 0);
      F.ctx.putImageData(F.img, 0, 0);

      // Confidence grows with photons collected on the object in a short adaptive window.
      const boxes = spriteBoxes(scene, t);
      for (const b of boxes) {
        const win = Math.min(4096, 400 / Math.max(flux, 0.001));
        const e = boxRate(lumShort, W, b, flux) * win;
        b.conf = 1 - Math.exp(-e / (b.label === "car" ? 900 : 260));
      }
      // light segmentation tint for detected objects
      F.ctx.save();
      F.ctx.globalCompositeOperation = "lighter";
      for (const sp of scene.sprites) {
        const b = boxes.find((x) => x.label === sp.label);
        if (!b || b.conf < 0.5) continue;
        F.ctx.globalAlpha = 0.35 * b.conf;
        F.ctx.fillStyle = sp.label === "car" ? "#1e6c94" : "#2a7fae";
        const { w, h, alpha } = sp.img;
        for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (alpha[y * w + x] > 0.5) F.ctx.fillRect(Math.round(b.x) + x, Math.round(b.y) + y, 1, 1);
      }
      F.ctx.restore();
      drawBoxes(F.ctx, boxes, 1, { minConf: 0.1 });
    }

    fluxIn.addEventListener("input", () => { labels(); if (paused || reduceMotion) render(); });
    framesIn.addEventListener("input", () => { labels(); if (paused || reduceMotion) render(); });
    pauseBtn.addEventListener("click", () => {
      paused = !paused;
      pauseBtn.textContent = paused ? "Play" : "Pause";
      pauseBtn.setAttribute("aria-pressed", String(paused));
    });
    labels();
    animateWhileVisible(cB.closest(".demo"), () => { if (!paused) { t += 40; render(); } }, 24);
    if (reduceMotion) { t = 2000; render(); }
  })();

  // =====================================================================
  //  LOW LIGHT: CMOS (read noise) | SPAD (photon counting) split view
  // =====================================================================
  (function lowLight() {
    const canvas = document.getElementById("viz-lowlight");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 180, H = 110;
    const scene = makeStreetScene(W, H);
    const lum = new Float32Array(W * H);
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const octx = off.getContext("2d");
    const img = octx.createImageData(W, H);
    const PHOTONS = 6, READ_NOISE = 3;
    let t = 5000;
    animateWhileVisible(canvas, () => {
      t += 60;
      sceneLum(scene, lum, t, t, 1);
      const d = img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, o = i * 4;
        const k = poisson(PHOTONS * lum[i]);
        let v;
        if (x < W / 2) v = Math.max(0, Math.round(k + READ_NOISE * gauss())) / PHOTONS;
        else v = k / PHOTONS;
        v = Math.pow(clamp(v, 0, 1), 0.6) * 255;
        if (x >= W / 2) { d[o] = v; d[o + 1] = v * 0.93; d[o + 2] = v * 0.8; }
        else { d[o] = v * 0.92; d[o + 1] = v * 0.95; d[o + 2] = v; }
        d[o + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(canvas.width / 2 - 0.75, 0, 1.5, canvas.height);
    }, 12);
  })();

  // =====================================================================
  //  HIGH SPEED: rotating fan, 33 ms exposure vs 16 binary frames
  // =====================================================================
  (function speed() {
    const canvas = document.getElementById("viz-speed");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 180, H = 110, R = 38;
    const centers = [[45, 52], [135, 52]];
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const octx = off.getContext("2d");
    const img = octx.createImageData(W, H);
    const BLADES = 3;
    const blade = (r, ang) => {
      if (r > R) return 0;
      if (r < 6) return 0.9; // hub
      const seg = (2 * Math.PI) / BLADES;
      let a = ((ang % seg) + seg) % seg;
      const half = 0.16 + 0.32 * (r / R);
      a = Math.min(a, seg - a);
      return a < half ? 0.85 : 0;
    };
    // Conventional: 33 ms exposure at 50 rev/s ≈ 1.65 revolutions -> averaged blur
    const blur = new Float32Array(W * H);
    const SAMPLES = 48, REVS = 1.65;
    for (let y = 0; y < H; y++) for (let x = 0; x < W / 2; x++) {
      const dx = x - centers[0][0], dy = y - centers[0][1];
      const r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      let acc = 0;
      for (let k = 0; k < SAMPLES; k++) acc += blade(r, ang - (2 * Math.PI * REVS * k) / SAMPLES);
      blur[y * W + x] = acc / SAMPLES;
    }
    const FLUX = 0.35, FRAMES = 16;
    let theta = 0;
    animateWhileVisible(canvas, (ts) => {
      theta = reduceMotion ? 0.4 : ts / 1000 * 1.4;
      const d = img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, o = i * 4;
        if (x < W / 2) {
          const ring = Math.hypot(x - centers[0][0], y - centers[0][1]);
          const v = (0.06 + blur[i] + (Math.abs(ring - R - 2) < 0.8 ? 0.25 : 0)) * 255;
          d[o] = v * 0.9; d[o + 1] = v * 0.95; d[o + 2] = v; d[o + 3] = 255;
        } else {
          const dx = x - centers[1][0], dy = y - centers[1][1];
          const r = Math.hypot(dx, dy);
          const l = 0.06 + blade(r, Math.atan2(dy, dx) - theta) + (Math.abs(r - R - 2) < 0.8 ? 0.25 : 0);
          const c = binomial(FRAMES, 1 - Math.exp(-FLUX * l)) / FRAMES;
          const v = Math.pow(c / (1 - Math.exp(-FLUX)), 0.7) * 255;
          d[o] = v; d[o + 1] = v * 0.92; d[o + 2] = v * 0.75; d[o + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(canvas.width / 2 - 0.75, 0, 1.5, canvas.height);
    }, 30);
  })();

  // =====================================================================
  //  HDR chart: response vs log intensity (SVG, hover crosshair + tooltip)
  // =====================================================================
  (function hdr() {
    const svg = document.getElementById("viz-hdr");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const el = (name, attrs, parent = svg) => {
      const n = document.createElementNS(NS, name);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };
    const m = { l: 34, r: 14, t: 12, b: 30 };
    const VW = 360, VH = 220, pw = VW - m.l - m.r, ph = VH - m.t - m.b;
    const LX0 = -2, LX1 = 2.5; // log10 intensity, 1 = conventional full-well
    const S = 4; // SPAD soft-saturation scale (illustrative)
    const spad = (x) => 1 - Math.exp(-x / S);
    const cmos = (x) => Math.min(x, 1);
    const X = (lx) => m.l + ((lx - LX0) / (LX1 - LX0)) * pw;
    const Y = (v) => m.t + (1 - v) * ph;

    for (let lx = LX0; lx <= 2; lx++) {
      el("line", { class: "grid", x1: X(lx), x2: X(lx), y1: m.t, y2: m.t + ph });
      el("text", { class: "axis-label", x: X(lx), y: VH - 14, "text-anchor": "middle" }).textContent = lx === 0 ? "1" : `10${lx < 0 ? "⁻" : ""}${["⁰", "¹", "²"][Math.abs(lx)]}`;
    }
    for (const v of [0, 0.5, 1]) {
      el("line", { class: "grid", x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v) });
      el("text", { class: "axis-label", x: m.l - 6, y: Y(v) + 3, "text-anchor": "end" }).textContent = v.toFixed(1);
    }
    el("text", { class: "axis-label", x: m.l + pw / 2, y: VH - 2, "text-anchor": "middle" }).textContent = "relative light intensity (log)";

    const path = (f) => {
      let dStr = "";
      for (let i = 0; i <= 200; i++) {
        const lx = LX0 + ((LX1 - LX0) * i) / 200;
        dStr += `${i ? "L" : "M"}${X(lx).toFixed(2)},${Y(f(Math.pow(10, lx))).toFixed(2)}`;
      }
      return dStr;
    };
    // clip marker + region where conventional is saturated
    el("rect", { x: X(0), y: m.t, width: X(LX1) - X(0), height: ph, fill: "rgba(92,200,255,0.05)" });
    el("path", { d: path(cmos), fill: "none", stroke: "#5cc8ff", "stroke-width": 2, "stroke-dasharray": "5 4", "stroke-linecap": "round" });
    el("path", { d: path(spad), fill: "none", stroke: "#ffc24b", "stroke-width": 2, "stroke-linecap": "round" });
    el("text", { class: "direct", x: X(0) + 6, y: Y(1) + 13 }).textContent = "conventional clips";
    el("text", { class: "direct", x: X(0.7) + 8, y: Y(spad(Math.pow(10, 0.7))) + 18 }).textContent = "SPAD keeps rising";

    // hover layer
    const cross = el("line", { x1: 0, x2: 0, y1: m.t, y2: m.t + ph, stroke: "rgba(255,255,255,0.35)", "stroke-width": 1, visibility: "hidden" });
    const dotS = el("circle", { r: 4.5, fill: "#ffc24b", stroke: "#0b0d14", "stroke-width": 2, visibility: "hidden" });
    const dotC = el("circle", { r: 4.5, fill: "#5cc8ff", stroke: "#0b0d14", "stroke-width": 2, visibility: "hidden" });
    const hit = el("rect", { x: m.l, y: 0, width: pw, height: VH, fill: "transparent", style: "cursor:crosshair" });
    const tip = document.getElementById("hdr-tip");
    const wrap = svg.parentElement;
    const show = (on) => { for (const n of [cross, dotS, dotC]) n.setAttribute("visibility", on ? "visible" : "hidden"); tip.hidden = !on; };
    const fmtX = (x) => (x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x.toFixed(2));
    hit.addEventListener("pointermove", (e) => {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const lx = LX0 + ((clamp(p.x, m.l, m.l + pw) - m.l) / pw) * (LX1 - LX0);
      const x = Math.pow(10, lx), vs = spad(x), vc = cmos(x);
      cross.setAttribute("x1", X(lx)); cross.setAttribute("x2", X(lx));
      dotS.setAttribute("cx", X(lx)); dotS.setAttribute("cy", Y(vs));
      dotC.setAttribute("cx", X(lx)); dotC.setAttribute("cy", Y(vc));
      tip.innerHTML = `<b>intensity ${fmtX(x)}</b><br><i style="border-color:#ffc24b"></i>SPAD ${vs.toFixed(2)}<br><i style="border-color:#5cc8ff;border-top-style:dashed"></i>Conventional ${vc.toFixed(2)}${x > 1 ? " (clipped)" : ""}`;
      const box = svg.getBoundingClientRect(), wb = wrap.getBoundingClientRect();
      const px = box.left - wb.left + (X(lx) / VW) * box.width;
      const py = box.top - wb.top + (Y(Math.max(vs, vc)) / VH) * box.height;
      tip.style.left = `${clamp(px, 70, wb.width - 70)}px`;
      tip.style.top = `${Math.max(py - 6, 64)}px`;
      show(true);
    });
    hit.addEventListener("pointerleave", () => show(false));

    const tbody = document.querySelector("#hdr-table tbody");
    for (const x of [0.01, 0.1, 0.5, 1, 2, 5, 10, 30, 100, 300]) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${x}</td><td>${spad(x).toFixed(3)}</td><td>${cmos(x).toFixed(3)}${x > 1 ? " (clipped)" : ""}</td>`;
      tbody.appendChild(tr);
    }
  })();

  // =====================================================================
  //  Ambient photon twinkles (page background + contact card)
  // =====================================================================
  function twinkles(canvas, density, fixed) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, dots = [];
    const resize = () => {
      const r = fixed ? { width: innerWidth, height: innerHeight } : canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const spawn = (w * h) / 1e6 * density;
      for (let i = 0; i < spawn; i++) if (rand() < 0.5) dots.push({ x: rand() * w, y: rand() * h, life: 1, warm: rand() < 0.8 });
      dots = dots.filter((d) => (d.life -= 0.035) > 0);
      for (const d of dots) {
        ctx.fillStyle = d.warm ? `rgba(255,214,140,${d.life * 0.8})` : `rgba(140,215,255,${d.life * 0.7})`;
        ctx.fillRect(d.x, d.y, 1.6, 1.6);
      }
    };
    if (reduceMotion) { for (let i = 0; i < 20; i++) tick(); return; }
    animateWhileVisible(fixed ? document.body : canvas, tick, 30);
  }
  const bgc = document.getElementById("bg-photons");
  if (bgc) twinkles(bgc, 9, true);
  const cc = document.getElementById("contact-canvas");
  if (cc) twinkles(cc, 40, false);

  // ---------- reveal on scroll ----------
  const revealables = document.querySelectorAll(".section-head, .pipeline, .pillars article, .demo, .extreme, .app, .timeline li, .contact-card");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { threshold: 0.12 });
    revealables.forEach((n, i) => { n.classList.add("reveal"); n.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(n); });
  }

  // ---------- copy email ----------
  document.querySelectorAll(".copy-email").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const email = btn.dataset.email;
      const state = btn.querySelector(".copy-state");
      try { await navigator.clipboard.writeText(email); state.textContent = "Copied"; }
      catch { state.textContent = "Select ↑"; }
      btn.classList.add("copied");
      setTimeout(() => { btn.classList.remove("copied"); state.textContent = "Copy"; }, 1800);
    });
  });

  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
