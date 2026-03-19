# Scrollytelling-Techniken

## Kernprinzip

Ein **sticky Visualisierungscontainer** (75% Breite, rechts) bleibt fixiert, waehrend **narrative Textbloecke** in einer linken Spalte (25% Breite) scrollen. Jeder Textblock ("Step") triggert eine Transformation der Partikelvisualisierung.

```
+------------+------------------------------+
| Step 1/6   |                              |
| "Das IDE   |   [Sticky Visualisierung]    |
|  wurde..." |      o o  o    o             |
|            |    o    o   o     o           |
| - - - - -  |      o  o  o   o             |
| Step 2/6   |                              |
| (gedimmt)  |                              |
+------------+------------------------------+
  25% Panel      75% Canvas (sticky)
```

## Aktuelle Implementierung

### Side-by-Side Layout (Flexbox)

```css
#scrolly { display: flex; }
#steps { width: 25%; min-width: 320px; order: -1; }
#sticky-vis { flex: 1; position: sticky; top: 0; height: 100vh; }
```

- **Kein GSAP/ScrollTrigger** -- natives CSS `position: sticky` reicht fuer Side-by-Side
- Text-Panel ist immer sichtbar (kein Overlay)
- Steps dimmen auf `opacity: 0.25`, aktiver Step auf `opacity: 1` via `.is-active`

### Mobile Fallback (<=768px)

Gestapeltes Overlay-Layout mit Backdrop-Blur:

```css
@media (max-width: 768px) {
  #scrolly { display: block; }
  #steps { width: 100%; margin-top: -100vh; }
  .step-content { backdrop-filter: blur(20px); }
}
```

## 6 Scroll-Steps -> Layout-Mapping

Definiert in `src/scroll.js` als `LAYOUT_MAP`:

| Step (data-step) | Layout-Funktion | Beschreibung |
|------------------|----------------|--------------|
| `intro` | `genesis` | Temporales Netzwerk (nutzt Timeline-Layout mit langsamem Stagger) |
| `timeline` | `timeline` | Zeitachse: x=Datum, y=Pillar-Baender (Schools/RIDE/SIDE) |
| `pillars` | `clusters` | Kompakte Spiralen, gruppiert nach 5 Pillars |
| `network` | `network` | Co-Autorenschafts-Netzwerk (D3 force, vorberechnet) |
| `geography` | `map` | Geo-Projektion (d3.geoMercator) mit Basiskarte |
| `explorer` | `cloud` | Phyllotaxis-Spirale, Uebergang zum interaktiven Explorer |

### Genesis-Layout (Intro)

Das Intro nutzt das Timeline-Layout mit verlaengertem Partikel-Stagger (`GENESIS_PARTICLE_STAGGER = 25` vs. normal `PARTICLE_STAGGER = 12`), um ein progressives Erscheinen der Punkte zu erzeugen.

## Pillar-Filter (#scrolly-filter)

- Positioniert im `#sticky-vis` Container, oben rechts
- Buttons: Alle, Lehre (Schools), Rezensionen (RIDE), Forschung (SIDE), Events
- Filtert ueber Opacity-Dimming (nicht-passende Items auf `opacity: 0.08`, Radius halbiert)
- **Reset bei jedem Layout-Wechsel:** `resetPillarFilter()` wird in `applyLayout()` aufgerufen
- Respektiert Netzwerk-Highlighting (ueberschreibt nicht die Kern-Forscher-Hervorhebung)

## Scroll-Indikator

- `position: fixed`, `bottom: 2.5rem`, zentriert
- Sichtbarkeit ueber CSS-Klasse `.visible` gesteuert (nicht inline `style.opacity`)
- Wird nach Loading-Screen eingeblendet, beim Verlassen des Intro-Steps ausgeblendet
- Bounce-Animation: `@keyframes bounce-arrow` (5px, `will-change: transform`)

## Fortschrittsbalken

- `#progress-bar` am oberen Fensterrand
- Breite basiert auf Scroll-Position relativ zum `#scrolly`-Container
- Update via `scroll`-Event in `scroll.js`

## Scrollama

- **Version:** 3.2.0 (unpkg CDN)
- **Prinzip:** IntersectionObserver-basiert, step-getriggert
- **Setup:** `step: '#steps .step'`, `offset: 0.5`, `progress: true`
- **Callbacks:** `onStepEnter` (Layout-Wechsel + CSS-Klassen), `onStepExit` (Explorer-Deaktivierung)
- **Resize:** Debounced (250ms), ruft `scroller.resize()` auf

## SVG Annotation Layer

Ein `<svg id="annotation-layer">` liegt ueber dem Canvas und zeigt Achsen, Gridlines und Labels:

- **Timeline:** X-Achse (Jahre), Y-Labels (Pillar-Namen mit Farbe), vertikale Gridlines, "Ohne Datum"-Label
- **Clusters:** Grosse Zahl + Pillar-Name ueber jedem Cluster
- **Network:** Nachnamen der 8 Kern-Forscher als Labels
- **Map:** Staedtenamen mit Itemanzahl, "Ohne Ortsangabe"-Label
- Alle Labels sind zweisprachig (DE/EN) via `IDENarrative.getLanguage()`

## Explorer-Aktivierung

- Scroll-Step `explorer` loest `CustomEvent('explorer-activate')` aus
- `#explorer-section` wird eingeblendet (`.hidden` entfernt)
- Eigener Canvas (`#explorer-canvas`), eigene Partikel, eigene Filter (Jahr-Range, Pillar)
- Layout-Buttons: Wolke, Zeit, Saeulen, Netzwerk, Karte
- Deaktivierung bei Scroll nach oben (`direction === 'up'`)
