# Tech Stack

## Entscheidung: Vanilla JS + D3

| Technologie | Version | Zweck | CDN |
|-------------|---------|-------|-----|
| **D3.js** | 7 | Skalen, Force-Simulation, Geo-Projektion, Achsen | `cdn.jsdelivr.net/npm/d3@7` |
| **topojson-client** | 3 | Basiskarte (Laendergrenzen) fuer Map-Layout | `cdn.jsdelivr.net/npm/topojson-client@3` |
| **Scrollama** | 3.2.0 | Scroll-Trigger (IntersectionObserver) | `unpkg.com/scrollama@3.2.0` |
| **Google Fonts** | -- | Merriweather (Serif) + Inter (Sans-Serif) | Google Fonts CDN |

> **GSAP wurde entfernt.** Das Side-by-Side Layout nutzt natives CSS `position: sticky` -- GSAP ScrollTrigger-Pinning ist nicht mehr noetig.

## Begruendung: Warum kein React?

1. **DOM-Kontrolle:** Scrollytelling braucht direkte DOM-Manipulation (Scrollama)
2. **Canvas:** Partikel-Engine rendert auf Canvas, nicht DOM -- React bringt keinen Vorteil
3. **Simplizitaet:** Kein Build-Step, keine Transpilation -- direkt deploybar
4. **Performance:** Weniger Overhead, kein Virtual DOM noetig
5. **Vorbild:** The Pudding arbeitet mit Vanilla JS + D3 + Scrollama

## Begruendung: Canvas statt SVG

1. **Performance:** 400+ Partikel -- SVG wird bei Animationen langsam
2. **Schatten:** `ctx.shadowBlur` direkt nutzbar
3. **Smooth Transitions:** `requestAnimationFrame` mit Lerp
4. **Hover-Detection:** Distanz-basiert statt DOM-Events

## Rendering-Architektur

- **Canvas 2D** fuer Partikel (Fill + Stroke-Pass, Shape-Dispatch: circle/square/diamond/triangle)
- **Offscreen Canvas** fuer die Basiskarte (world-atlas Topologie, gecacht nach `w x h`)
- **SVG Annotation Layer** (`#annotation-layer`) fuer Achsen, Gridlines, Labels (via D3-Axis)
- **DPR-Handling:** Canvas wird mit `devicePixelRatio` skaliert, Offscreen-Canvas rendert 1x

## Code-Stil

- **ES6+:** `const`/`let`, Arrow Functions, Template Literals, Destructuring, `for...of`
- **Module-Pattern:** Jedes Modul ist eine IIFE `(function() { 'use strict'; ... })()`
- **Exports:** Ueber `window.IDE*` Namespace (z.B. `window.IDEData`, `window.IDEParticles`)
- **Kein Console-Logging:** Nur `console.error` im Bootstrap-Catch-Block, `console.warn` fuer Map-Topology-Fehler

## Datei-Architektur

```
src/
  data.js         # Zotero-API, Caching, Daten-Enrichment         -> window.IDEData
  layouts.js      # 6 Layout-Funktionen (cloud, timeline, ...)    -> window.IDELayouts
  canvas-utils.js # Shared: Lerp, Draw, Hit-Detect, Tooltip, Map  -> window.IDECanvasUtils
  annotations.js  # SVG-Achsen, Gridlines, Labels                 -> window.IDEAnnotations
  particles.js    # Scrollytelling Canvas-Engine, Precomputation   -> window.IDEParticles
  scroll.js       # Scrollama Step-Handling, native sticky         -> window.IDEScroll
  narrative.js    # Sprachumschaltung (DE/EN)                      -> window.IDENarrative
  explorer.js     # Interaktiver Modus, Filter, Detail-Panel      -> window.IDEExplorer

scripts/
  geocode.py      # Python: Geo-Enrichment via Wikidata SPARQL (optional)
```

### Lade-Reihenfolge in index.html

1. `d3.js` (CDN)
2. `topojson-client.js` (CDN)
3. `scrollama.js` (CDN)
4. `data.js` (definiert API + PILLAR_COLORS + COLLECTION_MAP + TYPE_SHAPE + ...)
5. `layouts.js` (Layout-Funktionen, von particles + explorer genutzt)
6. `canvas-utils.js` (Shared Canvas-Utilities inkl. Map-Rendering)
7. `annotations.js` (SVG Annotation Layer)
8. `particles.js` (braucht IDEData + IDELayouts + IDECanvasUtils)
9. `scroll.js` (braucht IDEParticles)
10. `narrative.js` (unabhaengig)
11. `explorer.js` (braucht IDEData + IDELayouts + IDECanvasUtils)
12. Bootstrap `<script>` (orchestriert Init-Aufrufe)

## Keine Dependencies

Kein `package.json`, kein `node_modules`, kein Build-Schritt. Alles via CDN. Direkt auf GitHub Pages deploybar durch `git push`.

## Externe Datenquellen (zur Laufzeit)

| Quelle | Zweck |
|--------|-------|
| Zotero API (groups/4712864) | Bibliografische Items + Collections |
| world-atlas@2 (jsDelivr CDN) | TopoJSON-Laendergrenzen fuer Basiskarte |
| data/geo-enriched.json (lokal, optional) | Vorberechnete Geocoding-Ergebnisse |
