# Zotero-Datenanalyse

## Quelle

- **Zotero Group Library:** 4712864 (IDE-intern)
- **API:** `https://api.zotero.org/groups/4712864`
- **API Key:** in `data.js` (`API_KEY` Konstante)
- **Zeitraum:** 2008–2024
- **Caching:** localStorage, 24h TTL

## Datenprofil

Die tatsächliche Anzahl der Items wird dynamisch aus der API geladen (ca. 441 nach Filterung von Notes/Attachments). Exakte Zahlen können sich bei neuen Zotero-Einträgen ändern.

| Metrik | Hinweis |
|--------|---------|
| Items gesamt | Dynamisch aus API (> 400) |
| Gefiltert | Notes + Attachments werden ausgeschlossen |
| Items mit Datum | Großteil, geparst über `parseZoteroDate()` |
| Items mit Ort | ~19 (aus `place`-Feld + GEO_COORDS Lookup) |
| Einzigartige Creators | ~50+ |
| Top-Level Collections | 6 |

## Collections → Pillars

Die Collection-Zuordnung passiert in `data.js` via `COLLECTION_MAP`:

| Sammlung | Collection Key | Pillar | Farbe (CSS-Variable) |
|----------|---------------|--------|---------------------|
| Schools | ABQVUZ7X | Schools | `--color-schools: #b8860b` |
| RIDE | 96BBH58W | RIDE | `--color-ride: #2a7a6f` |
| SIDE | 8JIZ6LQD | SIDE | `--color-side: #a0522d` |
| Events | WWEZKUJX | Events | `--color-events: #5b7a8a` |
| Varia | 8FRU4J6S | Varia | `#8d8d8d` (grau) |
| Dhd25 | 4DIAPN26 | (leer) | — |

## Item-Typen → Partikelgröße

Definiert in `data.js` (`TYPE_RADIUS`):

| Typ | Radius | Visueller Eindruck |
|-----|--------|-------------------|
| book | 11 | Größte Partikel |
| journalArticle | 9 | Groß |
| conferencePaper | 8 | Mittelgroß |
| bookSection | 7 | Mittel |
| presentation | 6 | Klein |
| document | 6 | Klein |
| blogPost | 5 | Kleinste |
| webpage | 5 | Kleinste |

## Kern-Team (nach Häufigkeit)

| Person | Items | Rolle |
|--------|-------|-------|
| IDE (Institution) | ~18 | Institutioneller Autor |
| Franz Fischer | ~8 | Kernmitglied |
| Frederike Neuber | ~8 | Kernmitglied |
| Patrick Sahle | ~7 | Gründungsfigur |
| Daniela Schulz | ~7 | Kernmitglied |
| Tessa Gengnagel | ~6 | Kernmitglied |
| Anna-Maria Sichani | ~6 | Kernmitglied |
| Elena Spadini | ~6 | Kernmitglied |
| Christiane Fritze | ~5 | Kernmitglied |

## Geografie

Ort-Auflösung via `GEO_COORDS` Lookup-Tabelle in `data.js`:

| Ort | Koordinaten |
|-----|-------------|
| Wien | 48.21, 16.37 |
| Köln | 50.94, 6.96 |
| Berlin | 52.52, 13.41 |
| Graz | 47.07, 15.44 |
| Chemnitz | 50.83, 12.92 |
| Wuppertal | 51.26, 7.18 |
| Norderstedt | 53.70, 10.01 |
| Wiesbaden | 50.08, 8.24 |
| Rostock | 54.09, 12.10 |

## Datenlücken

- **Tags:** Nicht systematisch vergeben → Collections als primäre Struktur
- **Orte:** Nur ~19 Items mit Ort → Items ohne Ort werden beim Map-Layout zentriert angezeigt
- **Abstracts:** Nur bei einigen Typen vorhanden
