# Narrative Struktur

## 6 Scroll-Steps

Die Data Story folgt 6 Steps (definiert als `data-step` in `index.html`). Jeder Step triggert ein anderes Canvas-Layout.

| Step | data-step | Layout | Inhalt |
|------|-----------|--------|--------|
| 1 | `intro` | cloud | Einstieg — Partikelwolke mit Stats + Legende |
| 2 | `timeline` | timeline | Chronologische Anordnung 2008–2024 |
| 3 | `pillars` | clusters | Drei Säulen: Schools, RIDE, SIDE |
| 4 | `network` | network | Co-Autorenschafts-Netzwerk |
| 5 | `geography` | map | Geo-Projektion (Europa) |
| 6 | `explorer` | cloud | Interaktiver Modus mit Filtern |

## Step → Layout Mapping

Definiert in `scroll.js` als `LAYOUT_MAP`:
```js
const LAYOUT_MAP = {
  intro: 'cloud',
  timeline: 'timeline',
  pillars: 'clusters',
  network: 'network',
  geography: 'map',
  explorer: 'cloud'
};
```

## Intro-Step Sonderbehandlung

- Sofort sichtbar (nicht erst ab `offset: 0.5`)
- Enthält Stats-Zeile und Inline-Legende
- Bekommt `.is-exited` beim Verlassen → faded aus
- `margin-left: 5%` für Hero-Positionierung

## Erzähltexte

Zweisprachig (DE/EN) direkt in `index.html` mit CSS-Klassen `.lang-de` / `.lang-en`.

### Step 1: Entstehung
> Das IDE wurde 2008 gegründet. Jeder Punkt ist ein Beitrag — Bücher, Artikel, Konferenzbeiträge.

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
- Verschwindet bei erstem Step-Enter (`opacity: 0`)
- Animierter Pfeil (CSS `@keyframes bounce`)
