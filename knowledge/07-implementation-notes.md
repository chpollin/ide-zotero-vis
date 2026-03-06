# Implementierungsnotizen

## Canvas Rendering (canvas-utils.js)

Shared utility module für Scrollytelling und Explorer:

```js
// Lerp-Pass: Positionen, Opacity, Radius interpolieren
lerpParticles(particles, now, { lerpSpeed: 0.06, opacitySpeed: 0.08, radiusSpeed: 0.1, threshold: 0.5 });

// Draw-Pass (2-Pass: Fill + Stroke)
drawParticles(ctx, particles);

// Hit-Detection (rückwärts, oberstes Element zuerst)
findHoveredParticle(particles, mx, my, { hitPadding: 4 });

// Tooltip-Content
createTooltipContent(data);
```

**Key:** Shadow-State wird nur 2× pro Frame gesetzt (statt n× mit `save()/restore()`).

## Shared Layout-Funktionen (layouts.js)

Alle 6 Layouts folgen demselben Contract:
```js
function layoutName(particles, width, height, options?) {
  // Setzt auf jedem Partikel:
  // - targetX, targetY (Zielposition)
  // - targetOpacity (0 oder 1)
  // - baseRadius (optional, für Größenanpassung)
}
```

| Layout | Algorithmus | Precomputed? |
|--------|-------------|-------------|
| cloud | Phyllotaxis-Spirale (Goldener Winkel) | Nein |
| timeline | x = Datum, y = Typ-Band | Nein |
| clusters | Spirale um Pillar-Zentren | Nein |
| network | Bipartiter Force-Graph | Ja (in particles.js) |
| map | d3.geoMercator Projektion | Nein |
| genesis | Temporaler Netzwerk-Graph | Ja (in particles.js) |

## Genesis-Layout: Temporaler Netzwerk-Graph

### Precomputation (particles.js → `precomputeGenesisLayout()`)

1. **Co-Autorenschaft berechnen:** Item-zu-Item Links über gemeinsame Autoren ('IDE' ausgeschlossen)
2. **Gewichtung:** Zählt gemeinsame Autoren pro Item-Paar
3. **Link-Filterung:**
   - `allLinks` (alle Paare) → für Force-Simulation (Clustering)
   - `visibleLinks` (≥ `GENESIS_MIN_SHARED_CREATORS` = 2) → für Zeichnung
4. **x-Position:** `d3.scalePow().exponent(0.5)` (Sqrt-Skala, gibt dichten Jahren mehr Platz)
5. **Force-Simulation:**
   ```js
   GENESIS_SIM_CONFIG = {
     xStrength: 0.6,      // Starke zeitliche Bindung
     yStrength: 0.04,      // Schwache vertikale Zentrierung
     linkDistance: 40,
     linkStrength: 0.06,
     charge: -150,          // Starke Abstoßung → Spread
     collisionRadius: 12,   // Verhindert Überlappung
     ticks: 300
   }
   ```
6. **Jahr-Labels:** Alle 4 Jahre + Randwerte, gezeichnet am Canvas-Boden

### Rendering

- `drawGenesisLines()`: Batched Single-Path (`beginPath()` → alle Linien → `stroke()`)
- `drawYearLabels()`: `ctx.fillText()` mit gleicher sqrt-Skala wie Layout
- Lines werden nur gezeichnet wenn beide Endpunkte `opacity >= 0.1` haben

## Network-Layout: Bipartiter Graph

### Precomputation (particles.js → `precomputeNetworkLayout()`)

- Item-Nodes + Creator-Nodes als bipartiter Graph
- `d3.forceSimulation` mit 200 Ticks vorab berechnet
- Positionen in `networkPositions` Map gecacht
- Explorer nutzt eigenes Network (Item-to-Item via shared Creators)

```js
NETWORK_SIM_CONFIG = {
  linkDistance: 40,
  linkStrength: 0.3,
  charge: -60,
  ticks: 200,
  collisionRadius: 8
}
```

### Rendering

- `drawNetworkLines()`: Batched Single-Path, `strokeStyle: rgba(0,0,0,0.06)`

## Scrollama Integration (scroll.js)

```js
// Scrollama triggert Layout-Wechsel via LAYOUT_MAP
const LAYOUT_MAP = {
  intro: 'genesis',      // Temporaler Netzwerk-Graph
  timeline: 'timeline',
  pillars: 'clusters',
  network: 'network',
  geography: 'map',
  explorer: 'cloud'
};
```

**Kein GSAP ScrollTrigger** — das Side-by-Side Flexbox-Layout mit nativem CSS `position: sticky` ersetzt die GSAP-Pin-Logik vollständig.

## Sprachumschaltung (i18n)

CSS-basiert über `<html lang="de|en">`:
```css
html[lang="de"] .lang-en { display: none !important; }
html[lang="en"] .lang-de { display: none !important; }
```

JS setzt `document.documentElement.lang` + `localStorage.setItem('ide-lang', lang)`.

## Hover-Detection (canvas-utils.js)

```js
// Rückwärts iterieren — oberstes Element zuerst
for (let i = particles.length - 1; i >= 0; i--) {
  const p = particles[i];
  if (p.opacity < 0.1) continue;
  const dx = mx - p.x, dy = my - p.y;
  const hitR = p.radius + 4; // HIT_PADDING
  if (dx * dx + dy * dy < hitR * hitR) return p;
}
```

## Geo-Projektion

```js
const projection = d3.geoMercator()
  .center([10.5, 50.5])          // Mitteleuropa
  .scale(Math.min(w, h) * 2.5)   // MAP_SCALE_RATIO
  .translate([w / 2, h / 2]);
```

Items ohne Ort werden zentriert unterhalb der Karte platziert (`y = h * 0.85`).

## Performance-Optimierungen

- Canvas-Render: < 8ms pro Frame bei 400+ Partikeln
- **Batched Line Drawing:** Ein `beginPath()`/`stroke()` pro Frame (nicht pro Link)
- **particleMap:** O(1) ID→Partikel Lookup für Genesis-Lines
- Layout-Berechnung: < 50ms (einmalig pro Transition)
- Network Force-Simulation: 200 Ticks vorab (kein Live-Ticking)
- Genesis Force-Simulation: 300 Ticks vorab
- Zotero-API: localStorage-Cache (24h TTL)
- Shadow-State nur 2× pro Frame gesetzt (Fill vs Stroke Pass)
