# Scrollytelling-Techniken

## Kernprinzip

Ein **sticky Visualisierungscontainer** (75% Breite) bleibt fixiert, während **narrative Textblöcke** in einer linken Spalte (25% Breite) scrollen. Jeder Textblock ("Step") triggert eine Transformation der Visualisierung.

```
┌────────────┬──────────────────────────────┐
│ Step 1/6   │                              │
│ "Das IDE   │   [Sticky Visualisierung]    │
│  wurde..." │      ○ ○  ○    ○             │
│            │    ○    ○   ○     ○           │
│ ─ ─ ─ ─ ─ │      ○  ○  ○   ○             │
│ Step 2/6   │                              │
│ (gedimmt)  │                              │
└────────────┴──────────────────────────────┘
  25% Panel      75% Canvas (sticky)
```

## Aktuelle Implementierung

### Side-by-Side Layout (Flexbox)

```css
#scrolly { display: flex; }
#steps { width: 25%; min-width: 320px; order: -1; }
#sticky-vis { flex: 1; position: sticky; top: 0; height: 100vh; }
```

- **Kein GSAP/ScrollTrigger** — natives CSS `position: sticky` reicht für Side-by-Side
- Text-Panel ist immer sichtbar (kein Overlay)
- Steps dimmen auf `opacity: 0.25`, aktiver Step auf `opacity: 1`

### Mobile Fallback (≤768px)

Auf kleinen Bildschirmen wird zum gestapelten Overlay-Layout zurückgekehrt:

```css
@media (max-width: 768px) {
  #scrolly { display: block; }
  #steps { width: 100%; margin-top: -100vh; } /* Overlay über Vis */
  .step-content { backdrop-filter: blur(20px); }
}
```

## Libraries

### Scrollama.js

- **Autor:** Russell Goldenberg (The Pudding)
- **Prinzip:** IntersectionObserver-basiert, step-getriggert
- **CDN:** `https://unpkg.com/scrollama`
- **API:**
  ```js
  const scroller = scrollama();
  scroller.setup({ step: '.step', offset: 0.5 })
    .onStepEnter(({ element, index, direction }) => { ... })
    .onStepExit(({ element, index, direction }) => { ... });
  ```
- **Vorteile:** Leichtgewichtig (~5KB), keine Dependencies, The-Pudding-erprobt
- **Quelle:** https://github.com/russellsamora/scrollama

### CSS Scroll-Driven Animations

- **Status:** Native Browser-API, Safari 26+ (Sep 2025)
- **Zwei Typen:**
  - `animation-timeline: scroll()` → an Scroll-Position gebunden
  - `animation-timeline: view()` → an Element-Sichtbarkeit gebunden
- **Nutzen:** Reveal-Effekte ohne JS, 60fps auf Compositor-Thread
- **Einschränkung:** Kein Pinning, begrenzte Choreografie

## Best-Practice-Pattern (The Pudding)

### Responsive Scrollytelling

```css
#scrolly {
  position: relative;
  display: flex;           /* Side-by-side auf Desktop */
}

#sticky-vis {
  flex: 1;
  position: sticky;
  top: 0;
  height: 100vh;
  align-self: flex-start;
}

.step {
  min-height: 100vh;
  opacity: 0.25;
}

.step.is-active {
  opacity: 1;
}
```

### Architektur

1. **Separation of Concerns:** Scroll-Logik (`scroll.js`), Visualisierung (`particles.js`), Daten (`data.js`) getrennt
2. **Debouncing:** `resize`-Events mit `setTimeout` (200ms)
3. **Native Sticky:** CSS `position: sticky` statt GSAP ScrollTrigger für Pinning
4. **Mobile:** Text-Schritte volle Breite, Vis als Hintergrund mit `margin-top: -100vh`

## Scroll-Indikator

- `position: fixed`, `bottom: 2.5rem`, zentriert
- Sichtbarkeit über CSS-Klasse `.visible` gesteuert (nicht inline `style.opacity`)
- Wird nach Loading-Screen eingeblendet, beim Verlassen des Intro-Steps ausgeblendet
- Subtiler Bounce-Pfeil: `@keyframes bounce-arrow` (5px, `will-change: transform`)
- **Kein CSS `animation: fade-in`** — war Ursache für Flacker-Bug (CSS `fill-mode: both` überschrieb JS inline opacity)
