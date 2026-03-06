# Visual Design

## Ästhetik: Light Editorial (inspiriert von editopia 2026)

Helles, reduziertes Design mit editorischer Geometrie. Klare Typografie, minimale Schatten, geometrische Akzente statt dekorativer Effekte.

## Farbsystem

### Hintergrund & Oberfläche
```css
--bg: #ffffff;                          /* Reines Weiß */
--bg-warm: #f5f5f5;                     /* Leicht warm-grau */
--bg-canvas: #f5f5f3;                   /* Canvas-Fläche */
--bg-glass: rgba(255, 255, 255, 0.92);  /* Step-Card Hintergrund */
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
| Kicker (Akt-Nr.) | Inter | 600 | 0.75rem, uppercase, letter-spacing 0.15em |
| Fließtext | Inter | 400 | 1.05rem |
| Stats-Zahl | Inter | 700 | 1.6rem |
| UI-Labels | Inter | 400 | 0.85rem |

### Geometrische Akzente
- Step-Cards: `border-left: 3px solid var(--text-dim)` (geometrischer Akzent)
- Stats-Bereich: `border-top: 1px solid var(--border)` als Separator
- Lang-Toggle: `border: 2px solid`, invertiert auf hover

## Partikel-Design

### Rendering (2-Pass)
1. **Fill-Pass** mit Shadow: `shadowBlur: 4`, `shadowColor: rgba(0,0,0,0.15)`, `shadowOffsetY: 1`
2. **Stroke-Pass** ohne Shadow: `strokeStyle: rgba(0,0,0,0.1)`, `lineWidth: 0.5`

Kein Glow-Effekt. Subtile Schatten + dünner Stroke für Tiefe auf hellem Hintergrund.

### Hover
- Radius: +3px
- Cursor: pointer
- Tooltip: HTML-Element, positioniert relativ zum Canvas

### Transition
- Interpolation: `lerp(current, target, 0.06)` pro Frame
- Staggering: `delay = index * 12` (ms-Versatz pro Partikel)
- Threshold: `LERP_THRESHOLD = 0.5` — snapped wenn nah genug

## Step-Cards

```css
.step {
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-left: 3px solid var(--text-dim);
  padding: 2.5rem 3rem;
  max-width: 480px;
  box-shadow: var(--shadow-soft);
}
```

### Intro-Step Sonderbehandlung
- Sofort sichtbar (`opacity: 1`) statt `0.12`
- `margin-left: 5%` (Hero-Pattern)
- Enthält Statistiken + Inline-Legende
- Bekommt `.is-exited` Klasse beim Wegscrollen → faded zu `opacity: 0.12`

## Responsive Breakpoints

| Breakpoint | Anpassung |
|------------|-----------|
| Desktop (>1200px) | Steps links, Vis volle Höhe |
| Tablet (768–1199px) | Steps zentriert, schmaler |
| Mobile (<768px) | Steps volle Breite, Vis als Hintergrund, Padding reduziert |

## Accessibility

- `:focus-visible` Outline auf allen interaktiven Elementen (`2px solid var(--text-primary)`)
- `aria-label` auf Range-Inputs (Start/End year)
- Sprachumschaltung via `<html lang="de|en">` + CSS-basierte Sichtbarkeit
