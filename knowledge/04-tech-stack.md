# Tech Stack

## Entscheidung: Vanilla JS + D3

| Technologie | Version | Zweck | CDN |
|-------------|---------|-------|-----|
| **D3.js** | 7 | Skalen, Force-Simulation, Geo-Projektion | `cdn.jsdelivr.net/npm/d3@7` |
| **Scrollama** | latest | Scroll-Trigger (IntersectionObserver) | `unpkg.com/scrollama` |
| **GSAP** | 3 | ScrollTrigger-Pinning | `cdn.jsdelivr.net/npm/gsap@3` |
| **Google Fonts** | — | Merriweather + Inter | Google Fonts CDN |

## Begründung: Warum kein React?

1. **DOM-Kontrolle:** Scrollytelling braucht direkte DOM-Manipulation (Scrollama, GSAP)
2. **Canvas:** Partikel-Engine rendert auf Canvas, nicht DOM — React bringt keinen Vorteil
3. **Simplizität:** Kein Build-Step, keine Transpilation — direkt deploybar
4. **Performance:** Weniger Overhead, kein Virtual DOM nötig
5. **Vorbild:** The Pudding arbeitet mit Vanilla JS + D3 + Scrollama

## Begründung: Canvas statt SVG

1. **Performance:** 400+ Partikel — SVG wird bei Animationen langsam
2. **Schatten:** `ctx.shadowBlur` direkt nutzbar
3. **Smooth Transitions:** `requestAnimationFrame` mit Lerp
4. **Hover-Detection:** Distanz-basiert statt DOM-Events

## Code-Stil

- **ES6+:** `const`/`let`, Arrow Functions, Template Literals, Destructuring, `for...of`
- **Module-Pattern:** Jedes Modul ist eine IIFE `(function() { 'use strict'; ... })()`
- **Exports:** Über `window.IDE*` Namespace (z.B. `window.IDEData`, `window.IDEParticles`)
- **Kein Console-Logging:** Nur `console.error` im Bootstrap-Catch-Block

## Datei-Architektur

```
src/
├── data.js       # Zotero-API, Caching, Daten-Enrichment → window.IDEData
├── layouts.js    # 5 shared Layout-Funktionen → window.IDELayouts
├── particles.js  # Canvas-Engine, Render-Loop, Hover → window.IDEParticles
├── scroll.js     # Scrollama + GSAP, Step-Handling → window.IDEScroll
├── narrative.js  # Sprachumschaltung (DE/EN) → window.IDENarrative
└── explorer.js   # Interaktiver Modus, Filter, Detail → window.IDEExplorer
```

### Lade-Reihenfolge in index.html

1. `data.js` (definiert API + PILLAR_COLORS + COLLECTION_MAP)
2. `layouts.js` (Layout-Funktionen, von particles + explorer genutzt)
3. `particles.js` (braucht IDEData + IDELayouts)
4. `scroll.js` (braucht IDEParticles)
5. `narrative.js` (unabhängig)
6. `explorer.js` (braucht IDEData + IDELayouts)
7. Bootstrap `<script>` (orchestriert Init-Aufrufe)

## Keine Dependencies

Kein `package.json`, kein `node_modules`, kein Build-Schritt. Alles via CDN. Direkt auf GitHub Pages deploybar durch `git push`.
