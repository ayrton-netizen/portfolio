/* Experiences tower — the CS journey stacks brick by brick as you scroll.
   Bricks fall from above, land on the stack, and their title slides in
   beside them. Landed bricks are clickable → focus card. */
(() => {
  const section = document.querySelector(".tower-scrolly");
  const towerEl = document.getElementById("tower");
  const countEl = document.getElementById("tower-count");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* The CS/software journey, chronological — bottom of the tower first. */
  const JOURNEY = [
    "voxwood",      // first automation scripts for the family of businesses
    "canimundo",    // financial software pipeline
    "bc",           // formal CS foundation
    "fsae",         // full-stack team platform
    "bostonracing", // head of software / digital OS
    "daq",          // embedded firmware
    "receivos",     // industry internship
    "handshake",    // LLM training work
  ];
  const byId = {};
  EXPERIENCES.forEach((e) => (byId[e.id] = e));
  const bricks = JOURNEY.map((id) => byId[id]).filter(Boolean);
  const N = bricks.length;

  /* Short label + year shown beside each brick as it lands. */
  const SIDE = {
    voxwood:      { tag: "Voxwood",            note: "First automations — Python + Sheets" },
    canimundo:    { tag: "CaniMUNDO",          note: "Financial proposal pipeline" },
    bc:           { tag: "Boston College",     note: "B.S. Economics & CS", year: "2025" },
    fsae:         { tag: "Mecha Eagles FSAE",  note: "Team platform — React + CI/CD" },
    bostonracing: { tag: "Boston Racing CRS",  note: "Digital OS — Next.js + PostgreSQL" },
    daq:          { tag: "Baja DAQ",           note: "Embedded firmware — C/C++" },
    receivos:     { tag: "Receivos",           note: "SWE intern — AI document tooling" },
    handshake:    { tag: "Handshake AI",       note: "LLM evaluation & training" },
  };
  const year = (e) => (e.dates.match(/20\d\d/) || [""])[0];

  /* ——— build DOM ——— */
  const rows = [];
  bricks.forEach((exp, k) => {
    const row = document.createElement("div");
    row.className = "tower-row " + (k % 2 ? "label-left" : "label-right");

    const brick = document.createElement("button");
    brick.className = "tower-brick";
    brick.type = "button";
    brick.setAttribute("aria-label", exp.title + " — " + exp.org);
    brick.innerHTML = brickSVG(exp.color === "#e8e6df" ? "#dcd9cf" : exp.color);
    brick.addEventListener("click", () => focusUI && focusUI.open(exp));

    const label = document.createElement("div");
    label.className = "tower-label";
    const meta = SIDE[exp.id] || { tag: exp.org, note: "" };
    label.innerHTML =
      `<span class="t-year">${meta.year || year(exp)}</span>` +
      `<span class="t-tag">${meta.tag}</span>` +
      `<span class="t-note">${meta.note}</span>`;

    row.appendChild(brick);
    row.appendChild(label);
    towerEl.appendChild(row);
    rows.push({ row, brick, label, exp, k });
  });

  /* ——— dynamic sizing: the stack always fills the stage, however many
     bricks the journey has and whatever the viewport shape is ——— */
  const RATIO = 216 / 51; // brick svg width : front-face height
  const headEl = document.querySelector(".tower-head");
  function sizeTower() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const desktop = vw > 720;
    /* fill everything between the heading and the bottom edge */
    const headSpace = (headEl ? headEl.offsetHeight : 110) + 98;
    const availH = vh - headSpace - Math.max(44, vh * 0.07);
    let frontH = availH / N;
    let brickW = frontH * RATIO;
    const maxW = desktop ? Math.min(vw * 0.34, 340) : vw * 0.42;
    if (brickW > maxW) { brickW = maxW; frontH = brickW / RATIO; }
    frontH = Math.max(28, Math.min(96, frontH));
    brickW = frontH * RATIO;
    towerEl.style.setProperty("--rowH", frontH.toFixed(1) + "px");
    towerEl.style.setProperty("--brickW", brickW.toFixed(1) + "px");
  }
  sizeTower();
  window.addEventListener("resize", sizeTower);

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  /* small landing bounce */
  const landEase = (t) => {
    if (t < 0.8) return easeOut(t / 0.8);
    const u = (t - 0.8) / 0.2;
    return 1 + Math.sin(u * Math.PI) * 0.045 * (1 - u);
  };

  const SPAN = (1 / N) * 1.6;
  const startOf = (k) => (k / N) * (1 - SPAN * 0.62);
  const rowHeight = () =>
    parseFloat(getComputedStyle(towerEl).getPropertyValue("--rowH")) || 51;

  let lastP = -1;
  function render(p) {
    if (p === lastP) return;
    lastP = p;

    const assemble = clamp(p / 0.86, 0, 1);
    /* Each brick drops in from above its resting spot so it clearly lands ON
       the stack. The drop scales with brick size so it reads the same at any
       tower height. Reduce-Motion gets a gentle 1-brick drop, no tilt. */
    const drop = reduced ? rowHeight() * 1.1 : rowHeight() * 3.2 + 40;
    let landed = 0;

    for (const r of rows) {
      const raw = clamp((assemble - startOf(r.k)) / SPAN, 0, 1);
      const settled = raw >= 1;
      if (raw >= 0.6) landed++;

      if (raw <= 0) {
        r.row.style.opacity = "0";
        r.row.style.transform = `translateY(${-drop}px)`;
      } else {
        const t = landEase(raw);
        const fall = (1 - t) * -drop;
        const tilt = reduced ? 0 : (1 - t) * (r.k % 2 ? 4 : -4);
        r.row.style.opacity = String(clamp(raw * 3, 0, 1));
        r.row.style.transform = `translateY(${fall}px) rotate(${tilt}deg)`;
      }
      r.row.classList.toggle("settled", settled);
      r.brick.tabIndex = settled ? 0 : -1;
    }

    const done = assemble >= 1;
    countEl.textContent = done
      ? "every brick is clickable — open one"
      : String(Math.min(landed, N)).padStart(2, "0") + " / " + String(N).padStart(2, "0");
    towerEl.classList.toggle("glow", p > 0.9);
  }

  function progress() {
    const rect = section.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    return clamp(-rect.top / total, 0, 1);
  }

  /* Dev hook: ?p=0.6 freezes the tower at a fixed progress. */
  const debugP = new URLSearchParams(location.search).get("p");
  const frozen = debugP !== null ? clamp(parseFloat(debugP), 0, 1) : null;

  /* Scroll-drive the reveal for everyone — reduced-motion users get the same
     brick-by-brick stacking, just as a fade with no falling/tilt. */
  const loop = () => { render(frozen !== null ? frozen : progress()); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  /* ——— Skills section cards (index page only) ——— */
  const skillGrid = document.getElementById("skill-grid");
  if (skillGrid && typeof SKILLS !== "undefined") {
    const BLURBS = {
      "s-web": "React, Next.js, and the plumbing that ships them — CI/CD, edge caching, deploys.",
      "s-data": "Pandas forecasting, LLM evaluation, dashboards that turn rows into decisions.",
      "s-embedded": "C/C++ firmware, real-time sensor polling over I2C/SPI, telemetry schemas.",
      "s-biz": "Founded and ran real ventures — pricing, customers, and profit included.",
      "s-ops": "Inventory engines, bookkeeping systems, financial automation pipelines.",
      "s-lead": "Captained teams, tutored champions, and organized communities of 70+.",
    };
    SKILLS.forEach((s) => {
      const card = document.createElement("div");
      card.className = "skill-card";
      card.style.setProperty("--accent", s.color);
      card.innerHTML =
        `<div class="skill-brick">${brickSVG(s.color, { studs: 2, w: 64, h: 26 })}</div>` +
        `<h3>${s.label}</h3><p>${BLURBS[s.id] || ""}</p>`;
      skillGrid.appendChild(card);
    });
  }

  /* Project placeholder bricks */
  document.querySelectorAll(".project-brick").forEach((el) => {
    el.innerHTML = brickSVG(el.dataset.color, { studs: 3, w: 96, h: 34 });
  });
})();
