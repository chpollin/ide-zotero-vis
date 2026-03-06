# Narrative Struktur

## 6 Scroll-Steps

Die Data Story folgt 6 Steps (definiert als `data-step` in `index.html`). Jeder Step triggert ein anderes Canvas-Layout.

| Step | data-step | Layout | Inhalt |
|------|-----------|--------|--------|
| 1 | `intro` | genesis | Temporaler Netzwerk-Graph (x = Jahr, Co-Autorenschaft) |
| 2 | `timeline` | timeline | Chronologische Anordnung 2008–2024 |
| 3 | `pillars` | clusters | Drei Säulen: Schools, RIDE, SIDE |
| 4 | `network` | network | Bipartiter Co-Autorenschafts-Graph |
| 5 | `geography` | map | Geo-Projektion (Europa) |
| 6 | `explorer` | cloud | Interaktiver Modus mit Filtern |

## Step → Layout Mapping

Definiert in `scroll.js` als `LAYOUT_MAP`:
```js
const LAYOUT_MAP = {
  intro: 'genesis',
  timeline: 'timeline',
  pillars: 'clusters',
  network: 'network',
  geography: 'map',
  explorer: 'cloud'
};
```

## Side-by-Side Layout

- **25% linkes Panel** (`#steps`): Narrative Textblöcke, immer sichtbar
- **75% rechtes Canvas** (`#sticky-vis`): Partikelvisualisierung, `position: sticky`
- Intro-Step ist sofort sichtbar (`opacity: 1`)
- Andere Steps sind gedimmt (`opacity: 0.25`), `.is-active` → `opacity: 1`

## Intro-Step (Genesis-Layout)

- Zeigt temporalen Netzwerk-Graph: x-Achse = Jahr (sqrt-skaliert), y = force-directed
- Verbindungslinien zeigen geteilte Autorenschaft (≥2 gemeinsame Autoren)
- Partikel erscheinen chronologisch durch Stagger-Mechanismus
- Jahr-Labels am unteren Canvas-Rand (2008, 2012, 2016, 2020, 2024)
- Enthält Stats-Zeile (Anzahl Beiträge, Zeitraum, Sammlungen)
- Enthält Inline-Legende (Farben + Größen)
- Scroll-CTA am Ende: "↓ Scrollen Sie, um die Geschichte zu erkunden"

## Erzähltexte

Zweisprachig (DE/EN) direkt in `index.html` mit CSS-Klassen `.lang-de` / `.lang-en`.

### Step 1: Genesis-Netzwerk
> Jeder Punkt ist eine Publikation, ein Workshop, ein Beitrag. Beobachten Sie, wie das IDE-Netzwerk seit 2008 gewachsen ist – Verbindungslinien zeigen geteilte Autorenschaft.

### Step 2: Chronologie
> Auf der Zeitachse wird der Rhythmus der Produktion sichtbar.

### Step 3: Drei Säulen
> Schools, RIDE und SIDE — drei Säulen tragen das IDE.

### Step 4: Netzwerk
> Hinter den Publikationen steht ein Netzwerk von Menschen.

### Step 5: Geografie
> Von Köln über Wien bis Graz — die geografische Reichweite des IDE.

### Step 6: Explorer
> Erkunden Sie die Daten selbst.

## Scroll-Indikator

- `position: fixed`, `bottom: 2.5rem`, zentriert
- Sichtbarkeit über CSS-Klasse `.visible` (nicht inline opacity)
- Wird nach Loading-Screen eingeblendet
- Bei Step-Enter: Intro → `visible`, andere Steps → nicht `visible`
- Animierter Pfeil: `@keyframes bounce-arrow` (5px translateY)
