# IDE · Eine Datengeschichte

A scrollytelling data story that narrates the history of the **Institute for Digital Scholarly Editing (IDE)** through its Zotero bibliographic data (2008–2024).

## Experience

The story unfolds in 6 scroll steps:

1. **Entstehung** – Particles emerge in a phyllotaxis cloud with stats and legend
2. **Chronologie** – Particles arrange on a timeline, revealing the rhythm of production
3. **Drei Säulen** – Particles cluster into Schools, RIDE, and SIDE
4. **Netzwerk** – A force-directed graph shows co-authorship connections
5. **Geografie** – Particles fly to their geographic origins across Europe
6. **Explorer** – Interactive mode with filters and detail views

## Getting Started

Open `index.html` in a modern browser with internet access. No build step required – all dependencies load from CDNs.

```
python3 -m http.server 8080
# → http://localhost:8080
```

## Tech Stack

- **D3.js v7** – Data visualization, scales & geo projection
- **Scrollama.js** – Scroll-triggered narrative steps
- **GSAP 3 + ScrollTrigger** – Sticky pinning
- **Canvas 2D** – Particle rendering (2-pass: fill + stroke)
- **Vanilla JS (ES6+)** – No framework, no build step

## Project Structure

```
├── index.html              # Main entry point
├── style.css               # Light editorial design system
├── src/
│   ├── data.js             # Zotero API + data enrichment
│   ├── layouts.js          # 5 shared layout functions
│   ├── particles.js        # Canvas particle engine
│   ├── scroll.js           # Scrollama + GSAP integration
│   ├── narrative.js        # Language switching (DE/EN)
│   └── explorer.js         # Interactive post-story explorer
└── knowledge/              # Development knowledge vault
```

## Data Source

Zotero Group Library **4712864** (IDE-intern), fetched live via API with 24h localStorage cache.

## Features

- Bilingual: German (default) with English toggle
- Light editorial aesthetic with geometric accents
- Canvas-based rendering for smooth 60fps animations
- Responsive (Desktop + Tablet + Mobile)
- No build step – deploys directly to GitHub Pages
- localStorage caching (24h) for API responses
