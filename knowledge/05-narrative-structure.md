# Narrative Struktur

## 6 Scroll-Steps

Die Data Story folgt 6 Steps (definiert als `data-step` in `index.html`). Jeder Step triggert ein Canvas-Layout via `LAYOUT_MAP` in `scroll.js`.

| # | data-step | Layout | Beschreibung |
|---|-----------|--------|--------------|
| 1 | `intro` | genesis | Ruft `IDELayouts.timeline()` mit langsamerem Stagger (`GENESIS_PARTICLE_STAGGER=25ms`) auf. Zeigt Pillar-Swim-Lanes + Jahresachse. Keine Netzwerk-Linien. |
| 2 | `timeline` | timeline | Pillar-Swim-Lanes (Schools, RIDE, SIDE). Items pro Jahr innerhalb jedes Bands gebinnt. Sekundaere Items (Events, Varia) unten. `PARTICLE_STAGGER=12ms`. |
| 3 | `pillars` | clusters | 5 kompakte Spiralcluster an festen Positionen. Anzahl + Pillar-Labels als SVG-Annotationen. Keine Zeitachse. |
| 4 | `network` | network | Bipartiter Force-Graph (Items + Creators). 8 Kernforscher hervorgehoben (Opacity 1), Rest gedimmt (0.3). Creator-Centroid-Labels via SVG. |
| 5 | `geography` | map | `d3.geoMercator`, Center `[10.5, 50.5]`. TopoJSON-Basiskarte. Stadtlabels fuer Orte mit >= 2 Items. Items ohne Koordinaten in horizontaler Reihe unten. |
| 6 | `explorer` | cloud | Aktiviert `#explorer-section` mit eigenem Canvas, Layout-Buttons, Jahr-/Pillar-Filtern, Detail-Panel. |

## LAYOUT_MAP (scroll.js)

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

Hinweis: Es gibt kein separates `genesis`-Layout in `layouts.js`. Der genesis-Step ruft `IDELayouts.timeline()` auf, aber mit langsamerem Stagger (`25ms` statt `12ms`).

## Side-by-Side Layout

- **25% linkes Panel** (`#steps`): Narrative Textbloecke, `order: -1`, weisser Hintergrund, `border-right`
- **75% rechtes Canvas** (`#sticky-vis`): Partikelvisualisierung, `position: sticky; top: 0; height: 100vh`
- Intro-Step sofort sichtbar (`opacity: 1`), bekommt `.is-exited` beim Wegscrollen
- Andere Steps gedimmt (`opacity: 0.25`), `.is-active` setzt `opacity: 1`

## Scrollama-Konfiguration

- `offset: 0.5` (Trigger bei 50% Viewport-Hoehe)
- `progress: true` aktiviert
- Resize-Debounce: 250ms

## Pillar-Filter (Scrollytelling)

Buttons in `#scrolly-filter` (CSS-Klasse `.sf-btn`):
- **Alle**, **Lehre** (Schools), **Rezensionen** (RIDE), **Forschung** (SIDE), **Events**
- `resetPillarFilter()` wird bei jedem Layout-Wechsel in `applyLayout()` aufgerufen
- Nicht-passende Partikel: `targetOpacity: 0.08`, `baseRadius * 0.5`

## Scroll-Indikator

- `position: fixed`, `bottom: 2.5rem`, zentriert
- CSS-Klasse `.visible` steuert Sichtbarkeit
- Bei Step-Enter: Intro zeigt Indikator, andere Steps verbergen ihn
- Animierter Pfeil: `@keyframes bounce-arrow` (5px translateY, 2.5s)

## Fortschrittsbalken

- `#progress-bar`: `position: fixed; top: 0`, 2px Hoehe
- Berechnung ueber Scroll-Position relativ zum `#scrolly`-Container
- Update via `window.addEventListener('scroll', updateProgressBar)`

## Explorer-Aktivierung

- `handleStepEnter` mit `step === 'explorer'`: `#explorer-section` wird eingeblendet, `explorer-activate` Event
- `handleStepExit` mit `step === 'explorer'` + `direction === 'up'`: Deaktivierung, `explorer-deactivate` Event

## Erzaehltexte

Zweisprachig (DE/EN) direkt in `index.html` mit CSS-Klassen `.lang-de` / `.lang-en`. Sprachumschaltung via `<html lang="de|en">`.
