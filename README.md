# Cars NG — Premium Car Marketplace

Nigeria's premium car marketplace. A single-page site that pairs a **Three.js**
3D showroom with a mature, white-and-orange interface — hover any vehicle to
reveal its **real interior** before you commit.

## Why this build

- **3D, but tasteful** — the concept car is a pearl-white, physically-shaded
  build floating inside an orange-lit particle stage. WebGL fails gracefully,
  so the site still reads perfectly without it.
- **Motion with a purpose** — hover a card and a clip-path reveal lifts the
  cabin photo up with a slow ken-burns drift, animated spec bars and a
  360° badge. Everything respects `prefers-reduced-motion`.
- **No glassmorphism** — surfaces are solid white; depth comes from borders,
  shadows and typography rather than backdrop blur.

## Features

- **3D hero scene** (Three.js r160, vendored): stylised car with clearcoat
  paint, glass canopy, reflectance, rotating showroom rings, particle field
  and starfield; mouse parallax + idle float; pauses when off-screen.
- **Interior reveal on hover / tap** — each of the 9 cards swaps in real cabin
  photography with a ken-burns zoom and a `360° interior` chip.
- **3D tilt cards** — cursor-tracking perspective tilt with a soft orange glare.
- **Live filtering** — colour / brand filter combined, with an ARIA-live count
  and an empty state.
- **Buy flow** — reservation modal with vehicle details; keyboard-accessible
  with focus return.
- **Showroom extras** — testimonials, gallery strip, animated stats, FAQ
  accordion, highlighted CTA banner, contact form, newsletter and footer.
- **Performance & a11y** — CSS is modularised (`@import` chain), JS is split
  into small classic scripts + one ESM module; lazy images, WebP, preloads,
  `content-visibility`, fetch priority, print stylesheet, skip-link, semantic
  landmarks and accessible focus states.

## Tech

| Layer     | Tooling                                       |
|-----------|-----------------------------------------------|
| 3D        | Three.js r160 (vendored, ESM)                 |
| CSS       | Custom design system (white + orange) + Bootstrap 5 grid |
| JS        | Vanilla JS, IntersectionObserver, `requestAnimationFrame` |
| Fonts     | Space Grotesk + Inter (Google Fonts)          |
| Errors    | None in console; `[3D] muted` is the expected graceful fallback |

## Run locally

```bash
# any static server works (ES modules require http)
python3 -m http.server 8000
# open http://localhost:8000
```

## Project structure

```
bootstrap/        Bootstrap 5 assets
css/              design system modules (theme, components, cards, sections, reveal, print)
image/            exterior + interior photography (Pexels, royalty-free), WebP
lib/              vendored Three.js module build
js/
  app.js          entry point / loader
  ui.js           preloader, scroll progress, navbar state
  cursor.js       custom cursor
  reveal.js       scroll reveal, counters, parallax
  cards.js        3D tilt, glare, tap-reveal, filters
  hero3d.js       Three.js 3D hero + CTA scenes (module)
index.html        single-page showroom
favicon.svg       brand mark (reused by the web manifest)
```

> Photography: exterior + interior shots via Pexels (free to use). All 3D
> geometry is generated procedurally with Three.js primitives.