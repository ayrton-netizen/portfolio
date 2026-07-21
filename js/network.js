/* The skill web — an Obsidian-style force graph of LEGO bricks.
   Tidied for legibility: seeded layout (same every visit), pre-settled
   physics, collision padding so labels never stack, auto-fit camera,
   and hover-tracing that dims everything but the hovered brick's web. */
(() => {
  const canvas = document.getElementById("net-canvas");
  const ctx = canvas.getContext("2d");
  const stage = document.querySelector(".network-stage");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ——— seeded randomness: identical layout every load ——— */
  let seed = 41;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const SHORT = {
    handshake: "Handshake AI", receivos: "Receivos", daq: "Baja DAQ",
    voxwood: "Voxwood", bricknation: "BrickNation", tutoring: "WSC Tutoring",
    bostonracing: "Boston Racing", fsae: "Mecha Eagles FSAE", canimundo: "CaniMUNDO",
    cef: "CEF Debate", arscc: "Ars : CC", canvas: "CANVAS SDGs",
    wsc: "Scholar's Cup", ffp: "FFP", bc: "Boston College",
  };

  /* ——— nodes & edges ——— */
  const nodes = [];
  const edges = [];
  const byId = {};
  const addNode = (n) => { nodes.push(n); byId[n.id] = n; };

  SKILLS.forEach((s, i) => {
    const a = (i / SKILLS.length) * Math.PI * 2 - Math.PI / 2;
    addNode({
      id: s.id, kind: "skill", label: s.label, color: s.color,
      x: Math.cos(a) * 210, y: Math.sin(a) * 210, vx: 0, vy: 0,
    });
  });
  EXPERIENCES.forEach((e) => {
    const hub = byId[e.skills[0]];
    addNode({
      id: e.id, kind: "exp", label: SHORT[e.id] || e.org, exp: e,
      color: e.color === "#e8e6df" ? "#dcd9cf" : e.color,
      size: e.size || 3,
      x: hub.x * 1.9 + (rand() - 0.5) * 140,
      y: hub.y * 1.9 + (rand() - 0.5) * 140,
      vx: 0, vy: 0,
    });
    e.skills.forEach((sid) => edges.push({ na: byId[e.id], nb: byId[sid] }));
  });

  const neighbors = {};
  nodes.forEach((n) => (neighbors[n.id] = new Set([n.id])));
  edges.forEach((ed) => { neighbors[ed.na.id].add(ed.nb.id); neighbors[ed.nb.id].add(ed.na.id); });

  const nodeW = (n) => (n.kind === "skill" ? 34 : 46 + n.size * 13);
  const nodeH = (n) => (n.kind === "skill" ? 34 : nodeW(n) * 0.4);

  /* ——— legend ——— */
  const legend = document.getElementById("net-legend");
  SKILLS.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="chip" style="background:${s.color}"></span>${s.label}`;
    legend.appendChild(li);
  });

  /* ——— sizing / camera ——— */
  let W = 0, H = 0, dpr = 1;
  const cam = { x: 0, y: 0, scale: 1, tx: 0, ty: 0, tscale: 1 };
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
  }
  resize();
  window.addEventListener("resize", resize);

  const toWorld = (px, py) => ({
    x: (px - W / 2) / cam.scale + cam.x,
    y: (py - H / 2) / cam.scale + cam.y,
  });

  /* ——— physics ——— */
  let dragNode = null;
  function step() {
    const repel = 3600, springK = 0.016;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = rand() - 0.5; dy = rand() - 0.5; d2 = 1; }
        const d = Math.sqrt(d2);
        let f = repel / d2;
        /* collision padding: bricks + their labels never overlap;
           hubs push each other extra hard so the web has open middle */
        const bothHubs = a.kind === "skill" && b.kind === "skill";
        const minD = bothHubs ? 190 : (nodeW(a) + nodeW(b)) / 2 + 46;
        if (d < minD) f += (minD - d) * (bothHubs ? 0.5 : 0.32);
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
    }
    for (const ed of edges) {
      const dx = ed.nb.x - ed.na.x, dy = ed.nb.y - ed.na.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - 150) * springK;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      ed.na.vx += fx; ed.na.vy += fy;
      ed.nb.vx -= fx; ed.nb.vy -= fy;
    }
    for (const n of nodes) {
      n.vx -= n.x * 0.005;
      n.vy -= n.y * 0.005;
      if (n === dragNode) { n.vx = 0; n.vy = 0; continue; }
      n.vx = Math.max(-13, Math.min(13, n.vx * 0.86));
      n.vy = Math.max(-13, Math.min(13, n.vy * 0.86));
      n.x += n.vx; n.y += n.vy;
    }
  }

  /* ——— auto-fit camera (keeps the whole web framed) ——— */
  function autoFit() {
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const n of nodes) {
      const padX = Math.max(nodeW(n) / 2, n.label.length * 3.5) + 14;
      const padY = nodeW(n) / 2 + 40;
      minX = Math.min(minX, n.x - padX); maxX = Math.max(maxX, n.x + padX);
      minY = Math.min(minY, n.y - padY); maxY = Math.max(maxY, n.y + padY);
    }
    const topPad = W > 720 ? 150 : 210, botPad = 60;
    const fit = Math.min(W / (maxX - minX), (H - topPad - botPad) / (maxY - minY));
    cam.tscale = Math.min(Math.max(fit, 0.2), 1.05);
    cam.tx = (minX + maxX) / 2;
    cam.ty = (minY + maxY) / 2 - (topPad - botPad) / 2 / cam.tscale;
  }

  /* ——— drawing ——— */
  function drawBrick(n, alpha, hot) {
    const w = nodeW(n), h = nodeH(n);
    const x = n.x - w / 2, y = n.y - h / 2;
    ctx.globalAlpha = alpha;
    if (hot) { ctx.shadowColor = n.color; ctx.shadowBlur = 20; }
    const r = Math.min(5, h * 0.2);

    if (n.kind === "skill") {
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.beginPath();
      ctx.arc(n.x, n.y - 2, w * 0.26, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.26)";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h * 0.24, [r, r, 0, 0]);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.roundRect(x, y + h * 0.78, w, h * 0.22, [0, 0, r, r]);
      ctx.fill();
      const studs = Math.max(2, n.size);
      const sw = w / studs;
      ctx.fillStyle = "rgba(255,255,255,0.34)";
      for (let i = 0; i < studs; i++) {
        ctx.beginPath();
        ctx.ellipse(x + sw * (i + 0.5), y + h * 0.3, sw * 0.22, h * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.font = (n.kind === "skill" ? "700 " : "400 ") + "11px 'Space Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = hot ? "rgba(232,230,223,0.95)" : "rgba(232,230,223,0.62)";
    ctx.fillText(n.label, n.x, y + h + 7);
    ctx.globalAlpha = 1;
  }

  let hovered = null;
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    autoFit();
    cam.x += (cam.tx - cam.x) * 0.12;
    cam.y += (cam.ty - cam.y) * 0.12;
    cam.scale += (cam.tscale - cam.scale) * 0.12;

    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.x, -cam.y);

    const focusSet = hovered ? neighbors[hovered.id] : null;

    ctx.lineWidth = 1.4;
    for (const ed of edges) {
      const active = focusSet && (hovered === ed.na || hovered === ed.nb);
      ctx.strokeStyle = active
        ? (ed.nb.kind === "skill" ? ed.nb.color : ed.na.color)
        : "rgba(232,230,223," + (focusSet ? 0.04 : 0.13) + ")";
      ctx.globalAlpha = active ? 0.9 : 1;
      ctx.beginPath();
      ctx.moveTo(ed.na.x, ed.na.y);
      ctx.lineTo(ed.nb.x, ed.nb.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const n of nodes) {
      const dim = focusSet && !focusSet.has(n.id);
      drawBrick(n, dim ? 0.15 : 1, hovered === n || (focusSet && focusSet.has(n.id) && n !== hovered));
    }
  }

  /* settle before first paint so the web arrives formed */
  for (let i = 0; i < 420; i++) step();
  autoFit();
  cam.x = cam.tx; cam.y = cam.ty; cam.scale = cam.tscale;

  let frames = 0;
  (function loop() {
    if (!reduced || frames < 2) step();
    render();
    frames++;
    requestAnimationFrame(loop);
  })();

  /* ——— interaction ——— */
  function hit(px, py) {
    const p = toWorld(px, py);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const w = nodeW(n) / 2 + 8, h = nodeH(n) / 2 + 8;
      if (Math.abs(p.x - n.x) < w && Math.abs(p.y - n.y) < h) return n;
    }
    return null;
  }

  let moved = false;
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    moved = false;
    const r = canvas.getBoundingClientRect();
    dragNode = hit(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    if (dragNode) {
      const p = toWorld(px, py);
      dragNode.x = p.x; dragNode.y = p.y;
      moved = true;
    } else {
      hovered = hit(px, py);
      canvas.style.cursor = hovered ? "pointer" : "default";
    }
  });
  canvas.addEventListener("pointerup", () => {
    const clicked = dragNode;
    dragNode = null;
    if (clicked && !moved && clicked.kind === "exp" && focusUI) focusUI.open(clicked.exp);
  });
  canvas.addEventListener("pointerleave", () => { hovered = null; });

  /* ——— explainer popup (every visit) ——— */
  const intro = document.getElementById("net-intro");
  const closeIntro = () => {
    intro.classList.add("closing");
    setTimeout(() => intro.remove(), 320);
  };
  document.getElementById("net-intro-close").addEventListener("click", closeIntro);
  intro.addEventListener("click", (e) => { if (e.target === intro) closeIntro(); });
  window.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape" && document.body.contains(intro)) { closeIntro(); }
  });
})();
