# Cars NG — Premium Car Marketplace

Nigeria's premium car marketplace. A single-page site that pairs a **Three.js**
3D showroom with a mature, white-and-orange interface — hover any vehicle to
reveal its **real interior** before you commit.

## Why this build

- **A real car, not a concept** — the hero drives a vendored Ferrari GLB
  (decoded from its embedded Draco stream with a local decoder, no workers or
  WASM needed). Hover it and watch it dismantle into two halves, reassemble,
  then fade to an x-ray view of a photographed interior before sealing back
  up. WebGL fails gracefully, so the site still reads perfectly without it.
- **Motion with a purpose** — the car's hover choreography tells the story:
  split apart → come back → let you inside → return. Everything respects
  `prefers-reduced-motion`.
- **No glassmorphism** — surfaces are solid white; depth comes from borders,
  shadows and typography rather than backdrop blur.

## Features

- **3D hero scene** (Three.js r160, vendored): a real Ferrari showing off its
  factory leather red over showroom rings, particle field and starfield. A
  hover performs a 5-second sequence — dismantle → assemble → interior cutaway
  → exterior — with camera dollies and x-ray material fades. Mouse parallax +
  idle float; pauses when off-screen.
- **Simulated checkout** — confirm a reservation, then run a card through a
  two-step payment UI (with auto-formatting card number / expiry inputs), watch
  the authorisation spinner, and collect an order reference. Nothing is ever
  charged.
- **Interior reveal on hover / tap** — each of the 9 cards swaps in real cabin
  photography with a ken-burns zoom and a `360° interior` chip.
- **3D tilt cards** — cursor-tracking perspective tilt with a soft orange glare.
- **Live filtering** — colour / brand filter combined, with an ARIA-live count
  and an empty state.
- **Buy flow** — reservation modal with vehicle details, an exterior/interior
  viewer, and a simulated checkout (name/email, card, authorisation spinner,
  deposit calculated from each vehicle's price). Dialogue, focus-trapped and
  keyboard-accessible with focus return.
- **Showroom extras** — testimonials, gallery strip, animated stats, FAQ
  accordion, highlighted CTA banner, contact form, newsletter and footer.
- **Performance & a11y** — CSS is modularised (`@import` chain), JS is split
  into small classic scripts + one ESM module; lazy images, WebP, preloads,
  `content-visibility`, fetch priority, print stylesheet, skip-link, semantic
  landmarks and accessible focus states. The host's device memory is used to
  trim 3D effects on low-end hardware, and the render loops pause when the tab
  is hidden.

## Tech

| Layer     | Tooling                                       |
|-----------|-----------------------------------------------|
| 3D        | Three.js r160 (vendored, ESM)                 |
| 3D model  | Ferrari GLB + Draco decode (asm.js, vendored) |
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
lib/
  three.module.min.js   vendored Three.js module build
  car.glb               vendored Ferrari GLB (Draco-compressed)
  glb.js                minimal GLB loader: plain accessors + Draco decode
  draco/draco_decoder.js  Emscripten asm.js Draco decoder (vendored)
js/
  app.js          entry point / loader
  ui.js           preloader, scroll progress, navbar state
  reveal.js       scroll reveal, counters, parallax
  cards.js        3D tilt, glare, tap-reveal, filters
  modal.js        reservation + simulated checkout + forms
  hero3d.js       Three.js 3D hero + CTA scenes (module)
index.html        single-page showroom
favicon.svg       brand mark (reused by the web manifest)
```

> Photography: exterior + interior shots via Pexels (free to use). The hero
> car is the standard Ferrari test model bundled with Three.js.
>
> Tip: append `?carsngdebug` to the URL for verbose 3D / model-load logging.