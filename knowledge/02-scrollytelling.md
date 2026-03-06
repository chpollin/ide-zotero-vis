# Scrollytelling-Techniken

## Kernprinzip

Ein **sticky Visualisierungscontainer** bleibt fixiert, während **narrative Textblöcke** darüber scrollen. Jeder Textblock ("Step") triggert eine Transformation der Visualisierung.

```
┌─────────────────────────────────┐
│  [Sticky Visualisierung]        │ ← bleibt an Ort und Stelle
│                                 │
│     ○ ○  ○    ○                 │
│   ○    ○   ○     ○              │
│     ○  ○  ○   ○                 │
│                                 │
│  ┌──────────────┐               │
│  │ Step 2/5     │ ← scrollt     │
│  │ "Das IDE     │    durch      │
│  │  wuchs..."   │               │
│  └──────────────┘               │
└─────────────────────────────────┘
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

### GSAP ScrollTrigger

- **Hersteller:** GreenSock (seit 2024 Webflow, jetzt kostenlos)
- **CDN:** `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js` + ScrollTrigger
- **Key Features:**
  - **Pinning:** Elemente an Scroll-Position fixieren
  - **Scrubbing:** Animation an Scroll-Fortschritt koppeln
  - **Snap:** Zu diskreten Positionen einrasten
- **API:**
  ```js
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    trigger: "#section",
    pin: "#sticky-element",
    start: "top top",
    end: "+=3000",
    scrub: true
  });
  ```
- **Vorteile:** Professionelle Animationsqualität, GPU-beschleunigt

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
}

#sticky-vis {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
}

.step {
  margin: 0 auto;
  max-width: 400px;
  padding: 40vh 0;  /* Platz für Vis */
  opacity: 0.3;
}

.step.is-active {
  opacity: 1;
}
```

### Architektur

1. **Separation of Concerns:** Scroll-Logik, Visualisierung, Daten getrennt
2. **Debouncing:** `resize`-Events mit requestAnimationFrame
3. **Progressive Enhancement:** Statischer Fallback ohne JS
4. **Mobile:** Text-Schritte volle Breite, Vis als Hintergrund
