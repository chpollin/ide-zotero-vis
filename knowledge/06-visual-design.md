# Visual Design

## Aesthetik: Light Editorial

Helles, reduziertes Design mit editorischer Geometrie. Klare Typografie, minimale Schatten, geometrische Akzente.

## Farbsystem

### Hintergrund & Oberflaeche
```css
--bg: #ffffff;
--bg-warm: #f5f5f5;
--bg-canvas: #f5f5f3;
--bg-glass: rgba(255, 255, 255, 0.92);   /* Mobile Step-Cards */
--bg-glass-hover: rgba(255, 255, 255, 0.97);
```

### Saeulen-Farben
```css
--color-schools: #b8860b;   /* Schools / Lehre */
--color-ride: #2a7a6f;      /* RIDE / Rezensionen */
--color-side: #a0522d;      /* SIDE / Forschung */
--color-events: #5b7a8a;    /* Events / Veranstaltungen */
/* Varia: #8d8d8d */
```

### Semantische Saeulen-Labels (PILLAR_LABELS in data.js)
| Intern | Deutsch | Englisch |
|--------|---------|----------|
| Schools | Lehre | Teaching |
| RIDE | Rezensionen | Reviews |
| SIDE | Forschung | Research |
| Events | Veranstaltungen | Events |
| Varia | Sonstiges | Other |

### Text
```css
--text-primary: #1a1a1a;
--text-secondary: #4a4a4a;
--text-dim: #999999;
--text-accent: #b8860b;
```

## Typografie

| Element | Font | Gewicht | Groesse |
|---------|------|---------|---------|
| Titel (h1-h3) | Merriweather (serif) | 700 | 2rem (Step-Titel) |
| Body / UI | Inter (sans-serif) | 300/400/600 | 0.95rem |
| Kicker | Inter | 600 | 0.7rem, uppercase, letter-spacing 0.25em |
| Stats-Zahl | Merriweather | 700 | 1.6rem |
| UI-Labels / Buttons | Inter | 600 | 0.65-0.7rem, uppercase |

### Geometrische Akzente
- Step-Cards: `border-left: 3px solid var(--text-primary)`
- Stats-Bereich: `border-top: 1px solid var(--border)` als Separator
- Lang-Toggle: `border: 1.5px solid`, invertiert auf Hover

## Formen (TYPE_SHAPE in data.js)

| Form | Typen | Visuelle Kategorie |
|------|-------|--------------------|
| square | book | Monographien |
| circle | journalArticle, conferencePaper, bookSection | Artikel |
| diamond | blogPost, webpage | Kurzbeitraege/Web |
| triangle | presentation, document | Events/Dokumente |

### Groessen (TYPE_RADIUS in data.js)
| Typ | Radius |
|-----|--------|
| book | 10 |
| journalArticle | 8 |
| conferencePaper | 7 |
| bookSection | 7 |
| presentation | 6 |
| document | 6 |
| blogPost | 5 |
| webpage | 5 |

## Partikel-Rendering (canvas-utils.js)

### 2-Pass Canvas-Rendering
1. **Fill-Pass** mit Shadow: `shadowBlur: 3`, `shadowColor: rgba(0,0,0,0.12)`, `shadowOffsetY: 1`
2. **Stroke-Pass** ohne Shadow: `strokeStyle: rgba(0,0,0,0.1)`, `lineWidth: 0.5`

Shape-Dispatch via `tracePath(ctx, x, y, r, shape)` (circle/square/diamond/triangle).

### Hover
- Radius-Boost: +3px (`HOVER_RADIUS_BOOST`)
- Cursor: pointer
- Tooltip mit semantischen Labels (Typ + Pillar + Jahr)

### Transition / Animation
- Lerp-Interpolation: `speed: 0.06`, `opacitySpeed: 0.08`, `radiusSpeed: 0.1`
- Stagger: `delay = index * 12ms` (Scrollytelling), `25ms` (Genesis)
- Snap-Threshold: `LERP_THRESHOLD = 0.5`

## Netzwerk-Linien

- Scrollytelling Network-Layout: `strokeStyle: rgba(0,0,0,0.15)`, `lineWidth: 0.5`
- Batched Single-Path-Rendering (ein `beginPath()`/`stroke()` fuer alle Linien)
- Explorer Network: `opacity: 0.1`

## Annotationen (SVG-Layer)

SVG-Overlay `#annotation-layer` ueber dem Canvas, `pointer-events: none`.

### CSS-Klassen
| Klasse | Verwendung |
|--------|------------|
| `.axis` | X-Achsen (Domain + Ticks) |
| `.gridline` | Vertikale Gitterlinien (`stroke-dasharray: 2,4`) |
| `.annotation-label` | Standard-Labels (Inter 0.7rem, 600) |
| `.annotation-label-lg` | Grosse Zahlen bei Clusters (Merriweather 1.8rem, 700) |
| `.annotation-label-pillar` | Pillar-Labels (Inter 0.7rem, 600, uppercase) |

## Responsive Breakpoints

| Breakpoint | Anpassung |
|------------|-----------|
| >768px | Side-by-side: 25% Text-Panel + 75% Vis |
| <=1199px | Detail-Panel schmaler (320px) |
| <=768px | Gestapelt: `#scrolly { display: block }`, Steps als Overlay mit `backdrop-filter: blur(20px)`, `margin-top: -100vh` |

## Accessibility

- `:focus-visible` Outline auf allen interaktiven Elementen (2px solid)
- `role="img"` + `aria-label` auf Canvas-Elementen
- `aria-label` auf Range-Inputs und Pillar-Buttons
- `tabindex="-1"` auf Detail-Panel mit `focus()` bei Oeffnung
- `<html lang="de|en">` + CSS-basierte Sprachsichtbarkeit
- `@media (prefers-reduced-motion: reduce)` deaktiviert Animationen
