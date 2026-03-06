# IDE · Eine Datengeschichte

A scrollytelling data story that narrates the history of the **Institute for Digital Scholarly Editing (IDE)** through its Zotero bibliographic data (2008–2024).

## Experience

The story unfolds in a **side-by-side layout** — a 25% text panel on the left with a 75% sticky canvas visualization on the right:

1. **Genesis** – A temporal network graph reveals how the IDE grew since 2008, with co-authorship connections
2. **Chronologie** – Particles arrange on a timeline, revealing the rhythm of production
3. **Drei Säulen** – Particles cluster into Schools, RIDE, and SIDE
4. **Netzwerk** – A bipartite force-directed graph shows co-authorship connections
5. **Geografie** – Particles fly to their geographic origins across Europe
6. **Explorer** – Interactive mode with layout switching, filters, and detail views

## Getting Started

Open `index.html` in a modern browser with internet access. No build step required – all dependencies load from CDNs.

```
python3 -m http.server 8080
# → http://localhost:8080
```

## Tech Stack

- **D3.js v7** – Data visualization, scales, force simulation & geo projection
- **Scrollama.js** – Scroll-triggered narrative steps (IntersectionObserver)
- **Canvas 2D** – Particle rendering (2-pass: fill with shadow + stroke)
- **CSS `position: sticky`** – Side-by-side layout pinning (no GSAP needed)
- **Vanilla JS (ES6+)** – No framework, no build step

## Project Structure

```
├── index.html              # Main entry point
├── style.css               # Light editorial design system
├── src/
│   ├── data.js             # Zotero API + data enrichment
│   ├── canvas-utils.js     # Shared canvas: lerp, draw, hit-detect, tooltip
│   ├── layouts.js          # 6 shared layout functions (cloud, timeline, clusters, network, map, genesis)
│   ├── particles.js        # Canvas particle engine + force precomputation
│   ├── scroll.js           # Scrollama integration, step handling
│   ├── narrative.js        # Language switching (DE/EN)
│   └── explorer.js         # Interactive post-story explorer
└── knowledge/              # Development knowledge vault
```

## Data Source

Zotero Group Library **4712864** (IDE-intern), fetched live via API with 24h localStorage cache.

## Features

- **Genesis intro**: Temporal network graph showing IDE's growth with co-authorship lines
- **Side-by-side layout**: Text always visible alongside visualization
- Bilingual: German (default) with English toggle
- Light editorial aesthetic with geometric accents
- Canvas-based rendering for smooth 60fps animations
- Responsive (Desktop side-by-side + Mobile overlay)
- No build step – deploys directly to GitHub Pages
- localStorage caching (24h) for API responses
