# The Build — Patrick Ayrton Hartanto's portfolio

A LEGO-themed portfolio (a nod to BrickNation). Plain HTML/CSS/JS, no build step.

## Pages & sections

**index.html** — navbar: About · Experiences · Skills & Stack · Projects · Network

1. **About** — name, placeholder summary paragraph, GitHub/LinkedIn/email pills.
2. **Experiences** — scroll-driven tower: the CS journey's 8 experiences drop
   as classic 3D LEGO bricks and stack chronologically (oldest at the bottom),
   each title sliding in beside its brick as it lands. Click a brick → popup
   card with the full description.
3. **Skills & Stack** — six skill cards + tech chips (languages, tools, certs).
4. **Projects** — three placeholder cards to fill in later.

**network.html** — "the network, for fun": all 15 experiences arranged as a
readable LEGO wall — one column per skill, bricks filed under their primary
skill, curved connector lines to the other skills each one reinforced. Hover
traces connections; click opens the same popup card.

## Run locally

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

## Deploy

Repo: https://github.com/ayrton-netizen/portfolio

On Vercel: **Add New → Project → Import `ayrton-netizen/portfolio`** — no build
step, no framework preset needed (it's plain static files; the defaults work).
Every `git push` to `main` redeploys automatically.

## Placeholders to fill in

- About summary paragraph (`index.html`, `.about-summary`)
- GitHub URL (`index.html` + `network.html`, search for `your-handle` / `add link`)
- Project cards (`index.html`, `#projects`)

## Editing content

- Experience/skill data: [js/data.js](js/data.js) (`EXPERIENCES`, `SKILLS`).
- Tower order + side labels: `JOURNEY` and `SIDE` in [js/tower.js](js/tower.js).
- Network column assignment: `PRIMARY` and `SHORT` in [js/network.js](js/network.js).
- The 3D brick renderer lives in [js/common.js](js/common.js) (`brickSVG`).

## Dev notes

- `?p=0.6` on index freezes the tower at a fixed scroll progress (0–1).
- Assets are linked with `?v=N` — bump N after editing CSS/JS or browsers may
  serve stale files.
