/* Shared: 3D LEGO brick SVG renderer + focus-card popup. */

/* ——— color helpers ——— */
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}
function shade(hex, dl) {
  const [h, s, l] = hexToHsl(hex);
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${Math.max(4, Math.min(96, l + dl)).toFixed(1)}%)`;
}

/* ——— classic 2.5-D brick: front face, top face, side face, cylinder studs ——— */
function brickSVG(color, opts = {}) {
  const studs = opts.studs ?? 4;
  const w = opts.w ?? 168;      // front face width
  const h = opts.h ?? 50;       // front face height
  const dx = opts.dx ?? Math.round(w * 0.14); // top/side depth
  const dy = Math.round(dx * 0.72);
  const rx = (w / studs) * 0.3; // stud radius
  const ry = rx * 0.47;
  const studH = Math.round(ry * 2.2);

  const top = shade(color, 13);
  const side = shade(color, -15);
  const studBody = shade(color, 7);
  const studTop = shade(color, 20);
  const studRim = shade(color, -8);

  const M = 2;                        // margin
  const TY = M + studH + ry + dy;     // front-face top y
  const W = w + dx + M * 2, H = TY + h + M;

  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  /* top face */
  s += `<polygon points="${M},${TY} ${M + dx},${TY - dy} ${M + dx + w},${TY - dy} ${M + w},${TY}" fill="${top}"/>`;
  /* studs (back-to-front so overlaps look right) */
  for (let i = 0; i < studs; i++) {
    const cx = M + dx * 0.5 + (w * (i + 0.5)) / studs;
    const cy = TY - dy * 0.5;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${studRim}"/>`;
    s += `<rect x="${cx - rx}" y="${cy - studH}" width="${rx * 2}" height="${studH}" fill="${studBody}"/>`;
    s += `<ellipse cx="${cx}" cy="${cy - studH}" rx="${rx}" ry="${ry}" fill="${studTop}"/>`;
  }
  /* front + side faces */
  s += `<rect x="${M}" y="${TY}" width="${w}" height="${h}" fill="${color}"/>`;
  s += `<polygon points="${M + w},${TY} ${M + dx + w},${TY - dy} ${M + dx + w},${TY - dy + h} ${M + w},${TY + h}" fill="${side}"/>`;
  /* subtle front sheen */
  s += `<rect x="${M}" y="${TY}" width="${w}" height="${Math.round(h * 0.16)}" fill="rgba(255,255,255,0.14)"/>`;
  s += `</svg>`;
  return s;
}

/* ——— focus card popup (shared by tower + network) ——— */
const focusUI = (() => {
  const overlay = document.getElementById("focus-overlay");
  if (!overlay) return null;
  const card = document.getElementById("focus-card");
  const skillById = {};
  (typeof SKILLS !== "undefined" ? SKILLS : []).forEach((s) => (skillById[s.id] = s));

  function open(exp) {
    const accent = exp.color === "#e8e6df" ? "#ffc928" : exp.color;
    card.style.setProperty("--accent", accent);
    document.getElementById("focus-meta").textContent =
      [exp.category, exp.dates, exp.place].filter(Boolean).join("  ·  ");
    document.getElementById("focus-title").textContent = exp.title;
    document.getElementById("focus-org").textContent = exp.org || "";
    const ul = document.getElementById("focus-points");
    ul.innerHTML = "";
    (exp.points || []).forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      ul.appendChild(li);
    });
    const links = document.getElementById("focus-links");
    links.innerHTML = "";
    (exp.skills || []).forEach((sid) => {
      const sk = skillById[sid];
      if (!sk) return;
      const chip = document.createElement("span");
      chip.className = "skill-chip";
      chip.style.setProperty("--chip", sk.color);
      chip.innerHTML = "<b>" + sk.label + "</b>";
      links.appendChild(chip);
    });
    overlay.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("open")));
    document.body.style.overflow = "hidden";
    card.querySelector(".focus-close").focus();
  }
  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { overlay.hidden = true; }, 380);
  }
  overlay.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) close(); });
  return { open, close };
})();
