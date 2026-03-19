# Implementierungsnotizen

## Canvas Rendering (canvas-utils.js)

Shared-Modul fuer Scrollytelling und Explorer (`window.IDECanvasUtils`):

| Funktion | Beschreibung |
|----------|--------------|
| `tracePath(ctx, x, y, r, shape)` | Shape-Dispatch: circle (default), square, diamond, triangle |
| `lerpParticles(particles, now, opts)` | Interpolation mit Stagger-Delay-System. Speeds: lerp 0.06, opacity 0.08, radius 0.1 |
| `drawParticles(ctx, particles)` | 2-Pass: Fill mit Shadow + Stroke ohne Shadow |
| `drawNetworkLines(ctx, links, particleMap, opts)` | Batched Single-Path Linienzeichnung |
| `drawBaseMap(ctx, projection, w, h)` | Offscreen-Canvas fuer TopoJSON, gecacht per `w + 'x' + h` Key |
| `findHoveredParticle(particles, mx, my, opts)` | Rueckwaerts-Iteration, `hitPadding: 4`, `minVisibleOpacity: 0.1` |
| `createTooltipContent(data)` | HTML-Tooltip mit semantischen Labels (TYPE_LABELS + PILLAR_LABELS) |
| `loadMapTopology()` | Laedt world-atlas TopoJSON (countries-110m.json), cached in Variable |
| `invalidateMapCache()` | Setzt Offscreen-Canvas-Cache zurueck (bei Resize) |

## Layouts (layouts.js)

5 Layout-Funktionen (`window.IDELayouts`), alle setzen `targetX`, `targetY`, `targetOpacity`, `baseRadius`:

| Layout | Algorithmus | Rueckgabe |
|--------|-------------|-----------|
| `cloud` | Phyllotaxis-Spirale (Goldener Winkel) | `null` |
| `timeline` | x = Datum (d3.scaleTime), y = Pillar-Band (d3.scaleBand) | `{ scales, margin, undated }` |
| `clusters` | Spirale um feste Pillar-Zentren | `{ clusterPositions, groups }` |
| `network` | Skalierte vorberechnete Positionen | (kein Rueckgabewert) |
| `map` | d3.geoMercator Projektion | `{ projection, placeCounts, withoutCoordsCount }` |

**Kein separates genesis-Layout** -- der genesis-Step in `particles.js` ruft `IDELayouts.timeline()` mit langsamerem Stagger auf.

### Konstanten
- `MAIN_PILLARS = ['Schools', 'RIDE', 'SIDE']`
- `CLUSTER_POSITIONS`: Schools(0.22, 0.42), RIDE(0.50, 0.42), SIDE(0.78, 0.42), Events(0.35, 0.82), Varia(0.65, 0.82)
- `MAP_CENTER = [10.5, 50.5]`, `MAP_SCALE_RATIO = 2.5`
- `TIMELINE_MARGINS = { left: 0.08, right: 0.08, top: 0.10, bottom: 0.12 }`
- Timeline y-Band Padding: `0.15`
- Items pro Jahr: 4er-Raster (4 Zeilen, dann naechste Spalte)

### Timeline-Details
- Haupt-Swim-Lanes: Schools, RIDE, SIDE (via `d3.scaleBand`)
- Sekundaere Items (Events, Varia): `targetOpacity: 0.3`, `baseRadius * 0.6`, am unteren Rand
- Undatierte Items: kleine Spirale unten-rechts, `targetOpacity: 0.3`, `baseRadius * 0.7`

### Map-Details
- Ortsgruppierung: Items am selben Ort in Spirale (`MAP_PLACE_SPREAD = 10`)
- Ohne Koordinaten: horizontale Reihe bei `y = h - 40`, sortiert nach Pillar, `targetOpacity: 0.15`

## Partikel (particles.js)

### Partikel-Objekt
```
{ id, x, y, targetX, targetY, radius, baseRadius, color, shape, opacity, targetOpacity, data, delay, startTime }
```

### Network-Precomputation (`precomputeNetworkLayout()`)
- Bipartiter Force-Graph: Item-Nodes + Creator-Nodes (ohne 'IDE')
- `NETWORK_SIM_CONFIG`: linkDistance 40, linkStrength 0.3, charge -120, ticks 200, collisionRadius 8
- Positionen in `networkPositions` Map gecacht (`{ rawX, rawY, x, y, type, itemCount }`)
- Layout-Funktion skaliert rawX/rawY auf Canvas-Groesse mit `NETWORK_MARGIN = 80`

### Network-Highlighting (`applyNetworkHighlighting()`)
- `CORE_RESEARCHERS`: 8 Personen (Fischer, Neuber, Sahle, Schulz, Gengnagel, Sichani, Spadini, Fritze)
- Kern-Items: `targetOpacity: 1`, volle Groesse
- Rest: `targetOpacity: 0.3`, `baseRadius * 0.6`

### Pillar-Filter (Scrollytelling)
- Buttons `.sf-btn` in `#scrolly-filter` (Alle, Lehre, Rezensionen, Forschung, Events)
- `resetPillarFilter()` bei jedem `applyLayout()`-Aufruf
- Filter setzt nicht-passende Partikel auf `targetOpacity: 0.08`, `baseRadius * 0.5`
- Im Network-Layout wird Filter-Override verhindert (Network-Highlighting hat Vorrang)

### Annotation-Dispatch (`drawAnnotations()`)
- timeline/genesis: X-Achse (alle 2 Jahre), Pillar-Labels (farbig, semantisch), Gridlines, Undated-Label
- clusters: Grosse Anzahl + Pillar-Name pro Cluster
- network: Centroid-Labels der Kern-Forscher (Nachname)
- map: Stadtlabels fuer Orte mit >= 2 Items, "Ohne Ortsangabe"-Label

## Scroll-Controller (scroll.js)

- `LAYOUT_MAP`-Konstante: 6 Eintraege (siehe 05-narrative-structure.md)
- Scrollama: `offset: 0.5`, `progress: true`
- Step-Enter: `.is-active`-Klasse setzen, Layout anwenden, Scroll-Indikator steuern
- Step-Exit: Intro bekommt `.is-exited`, Explorer wird bei `direction === 'up'` deaktiviert
- Explorer: `explorer-activate` / `explorer-deactivate` Custom Events
- Resize-Debounce: 250ms, ruft `scroller.resize()`
- Fortschrittsbalken: `window.scroll`-Event, berechnet Prozent ueber `#scrolly`-Rect

## Explorer (explorer.js)

- Eigenes Canvas (`#explorer-canvas`), eigene Partikel, eigener Render-Loop
- Aktivierung/Deaktivierung via Custom Events
- 5 Layout-Buttons (`.layout-btn` mit `data-layout`): cloud, timeline, clusters, network, map
- Filter: Jahr-Range (2 Slider, `yearMin`/`yearMax`), Pillar-Buttons (`.pillar-btn`)
- Item-Count-Anzeige (`#explorer-item-count`): "X von Y Items"
- Stagger: `EXPLORER_STAGGER = 8` (initial), `EXPLORER_LAYOUT_STAGGER = 5` (Layout-Wechsel)

### Explorer-Network
- Eigene Berechnung: Item-to-Item Links via geteilte Creators (nicht bipartit)
- `EXPLORER_NETWORK_CONFIG`: linkDistance 30, charge -40, ticks 150, collisionRadius 8, margin 60
- Links gespeichert in `explorerNetworkLinks`, gezeichnet via `IDECanvasUtils.drawNetworkLines()`

### Detail-Panel
- Fixiertes Panel rechts (`#detail-panel`), 380px breit (320px auf <= 1199px)
- Zeigt: Titel, Typ, Pillar-Badge (farbig), Datum, Ort, Abstract, Creators, Link
- Oeffnung bei Partikel-Click (Scrollytelling via `particle-click` Event, Explorer direkt)
- Schliessung via Close-Button

## Performance

- Canvas-Rendering: < 8ms/Frame fuer 441 Partikel
- Batched Single-Path fuer alle Netzwerk-Linien (ein `beginPath()`/`stroke()`)
- `particleMap`: O(1) ID-zu-Partikel Lookup
- Offscreen-Canvas fuer Basiskarte (gecacht per Dimension-Key, invalidiert bei Resize)
- Layout-Berechnung: < 50ms (einmalig pro Transition)
- Network-Simulation: 200 Ticks vorab (kein Live-Ticking)
- Shadow-State: nur 2x pro Frame gesetzt (Fill-Pass vs Stroke-Pass)
- Zotero-API: localStorage-Cache (24h TTL, `CACHE_TIME`)
- DPR-Handling: Canvas skaliert mit `devicePixelRatio`, Transform via `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`
