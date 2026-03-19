# IDE · Eine Datengeschichte

A scrollytelling data story that narrates the history of the **Institute for Digital Scholarly Editing (IDE)** through its Zotero bibliographic data (2008–2024).

## Experience

The story unfolds in a **side-by-side layout** — a 25% text panel on the left with a 75% sticky canvas visualization on the right:

1. **Intro** – A progressive timeline reveals the IDE's output since 2008, grouped by pillar
2. **Chronologie** – Items arrange on a timeline with pillar swim-lanes (Lehre, Rezensionen, Forschung)
3. **Drei Säulen** – Items cluster into Schools, RIDE, SIDE, Events, and Varia with count labels
4. **Netzwerk** – A bipartite force-directed graph highlights the 8 core researchers
5. **Geografie** – Items fly to their geographic origins on a TopoJSON base map of Europe
6. **Explorer** – Interactive mode with layout switching, year/pillar filters, and detail views

Each pillar can be filtered in every view via buttons in the top-right corner.

## Getting Started

Open `index.html` in a modern browser with internet access. No build step required.

```
python3 -m http.server 8080
# → http://localhost:8080
```

Optional: Run `python scripts/geocode.py` to enrich geographic data via Wikidata SPARQL.

## Tech Stack

- **D3.js v7** – Scales, force simulation, geo projection, axes
- **topojson-client v3** – Base map rendering (country borders)
- **Scrollama.js 3.2** – Scroll-triggered narrative steps (IntersectionObserver)
- **Canvas 2D** – Particle rendering with shape support (circles, squares, diamonds, triangles)
- **SVG Annotation Layer** – Axes, labels, gridlines via D3
- **CSS `position: sticky`** – Side-by-side layout pinning
- **Vanilla JS (ES6+)** – IIFE modules, no framework, no build step

## Project Structure

```
├── index.html              # Main entry point (6 scroll steps + explorer)
├── style.css               # Light editorial design system
├── src/
│   ├── data.js             # Zotero API + data enrichment + constants
│   ├── canvas-utils.js     # Shared canvas: lerp, shapes, hit-detect, tooltip, base map
│   ├── annotations.js      # SVG annotation layer (axes, labels, gridlines)
│   ├── layouts.js          # 5 layout functions (cloud, timeline, clusters, network, map)
│   ├── particles.js        # Canvas particle engine + network precomputation
│   ├── scroll.js           # Scrollama integration, step handling
│   ├── narrative.js        # Language switching (DE/EN)
│   └── explorer.js         # Interactive post-story explorer
├── scripts/
│   └── geocode.py          # Wikidata SPARQL geocoding (optional)
├── data/
│   └── geo-enriched.json   # Output of geocode.py (not committed)
└── knowledge/              # Development knowledge vault
```

## Data Source

Zotero Group Library **4712864** (IDE-intern), fetched live via API with 24h localStorage cache.

## Visual Encoding

| Dimension | Encoding |
|-----------|----------|
| Pillar (Collection) | Colour: Gold (Lehre), Teal (Rezensionen), Sienna (Forschung), Steel (Events), Gray (Sonstiges) |
| Publication Type | Shape: ■ Book, ● Article, ◆ Short form, ▲ Presentation |
| Date | X-position (timeline views) |
| Connections | Lines between items sharing ≥2 creators (network view) |

## Features

- **Progressive intro**: Timeline with slow particle reveal (25ms stagger)
- **Pillar filter**: Available in every scrollytelling view
- **Semantic labels**: Schools→Lehre, RIDE→Rezensionen, SIDE→Forschung
- **Shape encoding**: 4 geometric shapes for publication types
- **Base map**: TopoJSON country borders for geography view
- **Core researcher highlighting**: 8 core members emphasized in network view
- **Side-by-side layout**: Text always visible alongside visualization
- **Bilingual**: German (default) with English toggle
- **Responsive**: Desktop side-by-side + Mobile overlay
- **No build step**: Deploys directly to GitHub Pages
