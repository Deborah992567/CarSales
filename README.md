# 🏁 VELOCITY — Premium Performance Car Showroom

A cinematic, single-page car showroom built with **Three.js** 3D scenes,
**Bootstrap 5** grid and a custom motion-design layer.

## ✨ Features

- **Interactive 3D hero** — a stylised concept car rendered in Three.js inside a
  particle showroom with neon rim lights, reflective floor and mouse parallax.
- **Interior reveal on hover** — each vehicle card slides open a ken-burns
  interior preview (real cabin photography) plus animated spec bars and a
  rotating 360° badge.
- **3D tilt cards** — cards track the cursor in perspective space with a
  travelling glare highlight.
- **Motion design** — preloader, custom cursor, scroll-reveal choreography,
  animated counters, brand marquee, parallax media and glowing CTA banners.
- **Live filtering** — combine colour + brand filters with animated transitions.
- **Reservation modal** — tap Buy on any car for a purchase flow build.

## 🛠 Tech

| Layer     | Tooling                                        |
|-----------|------------------------------------------------|
| 3D        | Three.js r160 (vendored, ESM)                  |
| CSS       | Custom design system + Bootstrap 5 grid        |
| JS        | Vanilla ES modules, IntersectionObserver, RAF  |
| Fonts     | Space Grotesk + Inter (Google Fonts)           |

## 🚀 Run locally

```bash
# any static server works (ES modules require http)
python3 -m http.server 8000
# open http://localhost:8000
```

## 📁 Structure

```
bootstrap/        Bootstrap 5 assets
image/            exterior + interior photography (Pexels, royalty-free)
lib/              vendored Three.js module build
js/
  app.js          interactions, tilt, filters, modal, counters
  hero3d.js       3D hero + CTA scenes (module)
car.css           full design system
index.html        single-page showroom
```

> Photography: exterior + interior shots via Pexels (free to use). All 3D
> geometry is generated procedurally with Three.js primitives.