# Implementierungsnotizen

## Canvas Rendering Pattern (2-Pass)

```js
function render() {
  ctx.clearRect(0, 0, width, height);
  const now = performance.now();

  // Lerp-Pass: Positionen + Opacity interpolieren
  for (const p of particles) {
    if (!p.visible) continue;
    if (p.targetOpacity > 0 && p.opacity < 0.01 && p.startTime === 0) {
      p.startTime = now;
    }
    if (p.startTime > 0 && now - p.startTime < p.delay) continue;

    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    if (Math.abs(dx) > LERP_THRESHOLD || Math.abs(dy) > LERP_THRESHOLD) {
      p.x += dx * LERP_SPEED;
      p.y += dy * LERP_SPEED;
    } else {
      p.x = p.targetX;
      p.y = p.targetY;
    }
    p.opacity += (p.targetOpacity - p.opacity) * 0.08;
    p.radius += (p.baseRadius - p.radius) * 0.1;
  }

  // Fill-Pass (mit Shadow — nur 1× gesetzt)
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowOffsetY = 1;
  for (const p of particles) {
    if (!p.visible || p.opacity <= 0) continue;
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, TWO_PI);
    ctx.fill();
  }

  // Stroke-Pass (ohne Shadow — nur 1× gesetzt)
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  for (const p of particles) {
    if (!p.visible || p.opacity <= 0) continue;
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, TWO_PI);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(render);
}
```

**Key:** Shadow-State wird nur 2× pro Frame gesetzt (statt 441× mit `save()/restore()`).

## Shared Layout-Funktionen (layouts.js)

Alle 5 Layouts folgen demselben Contract:
```js
function layoutName(particles, width, height, options?) {
  // Setzt auf jedem Partikel:
  // - targetX, targetY (Zielposition)
  // - targetOpacity (0 oder 1)
  // - baseRadius (optional, für Größenanpassung)
}
```

### Cloud (Phyllotaxis)
```js
const golden = Math.PI * (3 - Math.sqrt(5));
const scale = Math.min(w, h) * 0.35;
particles.forEach((p, i) => {
  const r = Math.sqrt(i / particles.length) * scale;
  const theta = i * golden;
  p.targetX = w / 2 + r * Math.cos(theta);
  p.targetY = h / 2 + r * Math.sin(theta);
});
```

### Network (Bipartites Modell in particles.js)
- Creator-Nodes + Item-Nodes als bipartiter Graph
- `d3.forceSimulation` mit 200 Ticks vorab berechnet
- Positionen in `networkPositions` Map gecacht
- Explorer nutzt eigenes Network (Item-to-Item via shared Creators)

## Scrollama + GSAP Integration

```js
// GSAP pinnt den Canvas
ScrollTrigger.create({
  trigger: '#scrolly',
  pin: '#sticky-vis',
  start: 'top top',
  end: 'bottom bottom',
  pinSpacing: false
});

// Scrollama triggert Layout-Wechsel via LAYOUT_MAP
const LAYOUT_MAP = {
  intro: 'cloud',
  timeline: 'timeline',
  pillars: 'clusters',
  network: 'network',
  geography: 'map',
  explorer: 'cloud'
};
```

## Sprachumschaltung (i18n)

CSS-basiert über `<html lang="de|en">`:
```css
html[lang="de"] .lang-en { display: none !important; }
html[lang="en"] .lang-de { display: none !important; }
```

JS setzt `document.documentElement.lang` + `localStorage.setItem('ide-lang', lang)`.

## Hover-Detection (Canvas)

```js
// Rückwärts iterieren — oberstes Element zuerst
for (let i = particles.length - 1; i >= 0; i--) {
  const p = particles[i];
  if (!p.visible || p.opacity < 0.1) continue;
  const dx = mx - p.x, dy = my - p.y;
  const hitR = p.radius + 4;
  if (dx * dx + dy * dy < hitR * hitR) {
    found = p;
    break;
  }
}
```

## Geo-Projektion

```js
const projection = d3.geoMercator()
  .center([11, 50])          // Deutschland/Österreich
  .scale(w * 1.2)
  .translate([w / 2, h / 2]);
```

Items ohne Ort werden zentriert unterhalb der Karte platziert (`y = h * 0.85`).

## Performance-Ziele

- Canvas-Render: < 8ms pro Frame bei 441 Partikeln
- Layout-Berechnung: < 50ms (einmalig pro Transition)
- Network Force-Simulation: 200 Ticks vorab (kein Live-Ticking)
- Zotero-API: localStorage-Cache (24h TTL)
