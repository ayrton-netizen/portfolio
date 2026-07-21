/* About-page toy: click anywhere in the hero to drop a LEGO brick.
   Bricks fall, land, and stack into a little skyline along the bottom.
   Lightweight: tiny 2D canvas, physics only runs while bricks are moving. */
(() => {
  const section = document.getElementById("about");
  const canvas = document.getElementById("hero-bricks");
  if (!section || !canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COLORS_POOL = ["#e5432e", "#ffc928", "#3d7bf4", "#35b558", "#f78c1e", "#2fb8c9"];
  const MAX_BRICKS = 60;

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = section.clientWidth; H = section.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", () => {
    resize();
    /* re-anchor settled stacks to the new floor/grid */
    const settled = bricks.filter((b) => b.settled);
    for (const k of Object.keys(stackH)) delete stackH[k];
    for (const b of settled) {
      b.col = Math.min(COLS() - 1, Math.max(0, b.col));
      b.x = b.col * BW + (W - COLS() * BW) / 2;
      b.y = H - 4 - ((stackH[b.col] || 0) + 1) * BH;
      stackH[b.col] = (stackH[b.col] || 0) + 1;
    }
    redraw();
  });

  const BW = 46, BH = 22;              // brick size
  const COLS = () => Math.max(1, Math.floor(W / BW));
  const bricks = [];                   // {col, x, y, vy, rot, vr, color, settled}
  const stackH = {};                   // per-column settled count

  function floorFor(col) {
    return H - 4 - (stackH[col] || 0) * BH;
  }

  function drawBrick(b) {
    ctx.save();
    ctx.translate(b.x + BW / 2, b.y + BH / 2);
    ctx.rotate(b.rot);
    ctx.translate(-BW / 2, -BH / 2);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(0, 0, BW, BH, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.beginPath();
    ctx.roundRect(0, 0, BW, BH * 0.26, [3, 3, 0, 0]);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.roundRect(0, BH * 0.78, BW, BH * 0.22, [0, 0, 3, 3]);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.ellipse(BW * (0.28 + i * 0.44), BH * 0.3, BW * 0.11, BH * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function redraw() {
    ctx.clearRect(0, 0, W, H);
    for (const b of bricks) drawBrick(b);
  }

  let running = false;
  function tick() {
    let alive = false;
    for (const b of bricks) {
      if (b.settled) continue;
      b.vy += 0.55;                     // gravity
      b.y += b.vy;
      b.rot += b.vr;
      const fl = floorFor(b.col) - BH;
      if (b.y >= fl) {
        b.y = fl;
        b.rot = 0;
        b.settled = true;
        stackH[b.col] = (stackH[b.col] || 0) + 1;
      } else {
        alive = true;
      }
    }
    redraw();
    if (alive) requestAnimationFrame(tick);
    else running = false;
  }

  const gridOffset = () => (W - COLS() * BW) / 2;

  function drop(px) {
    const col = Math.min(COLS() - 1, Math.max(0, Math.floor((px - gridOffset()) / BW)));
    /* keep stacks below the content area */
    if (floorFor(col) - BH < H * 0.55) return;
    if (bricks.length >= MAX_BRICKS) {
      /* recycle the oldest settled brick (and its stack slot) */
      const old = bricks.shift();
      if (old && old.settled) stackH[old.col] = Math.max(0, (stackH[old.col] || 1) - 1);
    }
    const b = {
      col,
      x: col * BW + gridOffset(),
      y: -BH - Math.random() * 30,
      vy: 1.5 + Math.random() * 2,
      rot: (Math.random() - 0.5) * 0.5,
      vr: (Math.random() - 0.5) * 0.04,
      color: COLORS_POOL[Math.floor(Math.random() * COLORS_POOL.length)],
      settled: false,
    };
    if (reduced) { b.y = floorFor(col) - BH; b.rot = 0; b.settled = true; stackH[col] = (stackH[col] || 0) + 1; redraw(); return; }
    bricks.push(b);
    if (!running) { running = true; requestAnimationFrame(tick); }
  }

  section.addEventListener("click", (e) => {
    if (e.target.closest("a, button, img")) return; // don't hijack real clicks
    const r = section.getBoundingClientRect();
    drop(e.clientX - r.left);
  });
})();
