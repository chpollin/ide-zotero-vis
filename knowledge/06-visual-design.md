# Visual Design

## Ästhetik: Light Editorial (inspiriert von editopia 2026)

Helles, reduziertes Design mit editorischer Geometrie. Klare Typografie, minimale Schatten, geometrische Akzente statt dekorativer Effekte.

## Farbsystem

### Hintergrund & Oberfläche
```css
--bg: #ffffff;                          /* Reines Weiß */
--bg-warm: #f5f5f5;                     /* Leicht warm-grau */
--bg-canvas: #f5f5f3;                   /* Canvas-Fläche */
--bg-glass: rgba(255, 255, 255, 0.92);  /* Mobile Step-Card Hintergrund */
```

### Säulen-Farben (Partikel + UI)
```css
--color-schools: #b8860b;   /* Dunkles Gold — Lehre */
--color-ride: #2a7a6f;      /* Gedämpftes Teal — Rezension */
--color-side: #a0522d;      /* Sienna — Forschung */
--color-events: #5b7a8a;    /* Stahlblau — Events */
/* Varia: #8d8d8d (grau) */
```

### Text
```css
--text-primary: #1a1a1a;    /* Fast-Schwarz */
--text-secondary: #4a4a4a;  /* Sekundärtext */
--text-dim: #999999;        /* Gedämpft */
```

### UI-Elemente
```css
--border: rgba(0, 0, 0, 0.08);              /* Subtile Linien */
--shadow-soft: 0 1px 4px rgba(0, 0, 0, 0.04); /* Minimaler Schatten */
```

## Typografie

| Element | Font | Gewicht | Größe |
|---------|------|---------|-------|
| Step-Titel | Merriweather | 700 | 2rem |
| Kicker (Akt-Nr.) | Inter | 600 | 0.7rem, uppercase, letter-spacing 0.25em |
| Fließtext | Inter | 400 | 0.95rem |
| Stats-Zahl | Merriweather | 700 | 1.6rem |
| UI-Labels | Inter | 400 | 0.85rem |

### Geometrische Akzente
- Step-Cards: `border-left: 3px solid var(--text-primary)` (geometrischer Akzent)
- Stats-Bereich: `border-top: 1px solid var(--border)` als Separator
- Lang-Toggle: `border: 1.5px solid`, invertiert auf hover

## Layout: Side-by-Side

### Desktop (>768px)
```
┌──────────────┬────────────────────────────────────┐
│  #steps      │  #sticky-vis                       │
│  25% Breite  │  flex: 1                           │
│  order: -1   │  position: sticky; top: 0          │
│  bg: white   │  height: 100vh                     │
│  border-right│  bg: var(--bg-canvas)              │
│              │                                    │
│  .step       │  <canvas>                          │
│  min-h:100vh │                                    │
│  opacity:0.25│                                    │
│  .is-active→1│                                    │
└──────────────┴────────────────────────────────────┘
```

### Mobile (≤768px)
- Gestapeltes Overlay-Layout: `#scrolly { display: block; }`
- Steps über Vis mit `margin-top: -100vh`
- Step-Cards: `backdrop-filter: blur(20px)`, `background: var(--bg-glass)`

## Partikel-Design

### Rendering (2-Pass in canvas-utils.js)
1. **Fill-Pass** mit Shadow: `shadowBlur: 4`, `shadowColor: rgba(0,0,0,0.15)`, `shadowOffsetY: 1`
2. **Stroke-Pass** ohne Shadow: `strokeStyle: rgba(0,0,0,0.1)`, `lineWidth: 0.5`

Kein Glow-Effekt. Subtile Schatten + dünner Stroke für Tiefe auf hellem Hintergrund.

### Größe (TYPE_RADIUS in data.js)
| Typ | Radius |
|-----|--------|
| book | 11 |
| journalArticle | 9 |
| conferencePaper | 8 |
| bookSection | 7 |
| presentation | 6 |
| document | 6 |
| blogPost | 5 |
| webpage | 5 |

### Hover
- Radius: +3px (`HOVER_RADIUS_BOOST`)
- Cursor: pointer
- Tooltip: HTML-Element, positioniert relativ zum Viewport

### Transition
- Interpolation: `lerp(current, target, 0.06)` pro Frame (in `canvas-utils.js`)
- Staggering: `delay = index * 12` (ms-Versatz pro Partikel)
- Threshold: `LERP_THRESHOLD = 0.5` — snapped wenn nah genug

## Netzwerk-Linien

### Genesis-Layout (Intro)
- Nur Links mit ≥2 gemeinsamen Autoren (`GENESIS_MIN_SHARED_CREATORS`)
- `strokeStyle: rgba(0, 0, 0, 0.08)`, `lineWidth: 0.5`
- Batched Single-Path-Rendering (ein `beginPath()`/`stroke()` für alle Linien)

### Network-Layout
- Bipartite Links (Item → Creator)
- `strokeStyle: rgba(0, 0, 0, 0.06)`, `lineWidth: 0.5`

## Step-Cards

### Desktop (im linken Panel)
```css
.step-content {
  border-left: 3px solid var(--text-primary);
  padding: 2.5rem 3rem;
}
```
Kein Glass/Blur-Effekt auf Desktop (solider weißer Hintergrund im Panel).

### Intro-Step Sonderbehandlung
- Sofort sichtbar (`opacity: 1`) statt `0.25`
- Enthält Statistiken + Inline-Legende + Scroll-CTA
- Bekommt `.is-exited` beim Wegscrollen → faded zu `opacity: 0.25`

## Responsive Breakpoints

| Breakpoint | Anpassung |
|------------|-----------|
| Desktop (>768px) | Side-by-side: 25% Text-Panel + 75% Vis |
| Tablet (≤1199px) | Detail-Panel schmaler (320px) |
| Mobile (≤768px) | Gestapelt, Overlay-Karten, backdrop-blur |

## Accessibility

- `:focus-visible` Outline auf allen interaktiven Elementen (`2px solid var(--text-primary)`)
- `role="img"` + `aria-label` auf Canvas-Elementen
- `aria-label` auf Range-Inputs und Pillar-Buttons
- `tabindex="-1"` auf Detail-Panel mit `focus()` bei Öffnung
- Sprachumschaltung via `<html lang="de|en">` + CSS-basierte Sichtbarkeit
- `@media (prefers-reduced-motion: reduce)` deaktiviert Animationen
