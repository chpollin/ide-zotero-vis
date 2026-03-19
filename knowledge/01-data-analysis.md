# Zotero-Datenanalyse

## Quelle

- **Zotero Group Library:** 4712864 (IDE-intern)
- **API:** `https://api.zotero.org/groups/4712864`
- **API Key:** in `src/data.js` (`API_KEY` Konstante)
- **Zeitraum:** 2008--2024
- **Caching:** localStorage (`ide-story-cache`), 24h TTL

## Datenprofil

Die tatsaechliche Anzahl der Items wird dynamisch aus der API geladen (ca. 441 nach Filterung von Notes/Attachments). Exakte Zahlen koennen sich bei neuen Zotero-Eintraegen aendern.

| Metrik | Hinweis |
|--------|---------|
| Items gesamt | Dynamisch aus API (> 400) |
| Gefiltert | Notes + Attachments werden ausgeschlossen |
| Items mit Datum | Grossteil, geparst ueber `parseZoteroDate()` |
| Items mit Ort | Aus `place`-Feld + `shortTitle`-Heuristik + GEO_COORDS Lookup |
| Einzigartige Creators | ~50+ |
| Top-Level Collections | 6 (davon Dhd25 als Alias fuer Varia) |

## Collections -> Pillars

Die Collection-Zuordnung passiert in `src/data.js` via `COLLECTION_MAP`. Subcollections werden automatisch dem Pillar der uebergeordneten Collection zugeordnet.

| Sammlung | Collection Key | Pillar | Farbe (CSS / PILLAR_COLORS) |
|----------|---------------|--------|----------------------------|
| Schools | ABQVUZ7X | Schools | `#b8860b` |
| RIDE | 96BBH58W | RIDE | `#2a7a6f` |
| SIDE | 8JIZ6LQD | SIDE | `#a0522d` |
| Events | WWEZKUJX | Events | `#5b7a8a` |
| Varia | 8FRU4J6S | Varia | `#8d8d8d` |
| Dhd25 | 4DIAPN26 | Varia | (wird Varia zugeordnet) |

## Pillar-Labels (zweisprachig)

Definiert in `PILLAR_LABELS` -- semantische Namen statt Kuerzel:

| Pillar-Key | Deutsch | Englisch | Short |
|------------|---------|----------|-------|
| Schools | Lehre | Teaching | Schools |
| RIDE | Rezensionen | Reviews | RIDE |
| SIDE | Forschung | Research | SIDE |
| Events | Veranstaltungen | Events | Events |
| Varia | Sonstiges | Other | Varia |

## Item-Typen -> Partikelgroesse (TYPE_RADIUS)

| Typ | Radius | Visueller Eindruck |
|-----|--------|-------------------|
| book | 10 | Groesste Partikel |
| journalArticle | 8 | Gross |
| conferencePaper | 7 | Mittelgross |
| bookSection | 7 | Mittel |
| presentation | 6 | Klein |
| document | 6 | Klein |
| blogPost | 5 | Kleinste |
| webpage | 5 | Kleinste |

## Item-Typen -> Partikelform (TYPE_SHAPE)

Vier Formgruppen statt acht Typen -- kodiert die Publikationsart visuell:

| Form | Typen | Bedeutung |
|------|-------|-----------|
| square | book | Monografien |
| circle | journalArticle, conferencePaper, bookSection | Artikel |
| triangle | presentation, document | Vortraege/Dokumente |
| diamond | blogPost, webpage | Kurzbeitraege/Web |

## Kern-Team (CORE_RESEARCHERS)

Acht Personen werden im Netzwerk-Layout hervorgehoben:

| Person | Rolle |
|--------|-------|
| Franz Fischer | Kernmitglied |
| Frederike Neuber | Kernmitglied |
| Patrick Sahle | Gruendungsfigur |
| Daniela Schulz | Kernmitglied |
| Tessa Gengnagel | Kernmitglied |
| Anna-Maria Sichani | Kernmitglied |
| Elena Spadini | Kernmitglied |
| Christiane Fritze | Kernmitglied |

## Geografie

### Hardcodierte Koordinaten (GEO_COORDS)

34 Eintraege in `src/data.js`, Format `[lon, lat]`. Enthaelt Aliase (Wien/Vienna, Koeln/Cologne, Muenchen/Munich):

Wien, Koeln, Berlin, Chemnitz, Norderstedt, Wiesbaden, Graz, Wuppertal, Muenchen, Boston, Hamburg, Paderborn, Rostock, Bamberg, Lueneburg, Frankfurt, Heidelberg, Trier, Zuerich, Bern, Innsbruck, Salzburg, Passau, Wuerzburg, Leipzig, Dresden, Darmstadt, Mainz, Bonn, Duesseldorf, Essen

### Ort-Aufloesung (mehrstufig)

1. `item.data.place` direkt
2. Heuristik: `shortTitle`-Parsing (Pattern `School\d+-\d+-?(\w+)$`)
3. GEO_COORDS Lookup (exakt, Split bei `,;/&`, Substring-Match)
4. Fallback: `data/geo-enriched.json` aus `scripts/geocode.py`

### Geo-Enrichment (optional)

- **Script:** `scripts/geocode.py` (Python, Wikidata SPARQL)
- **Output:** `data/geo-enriched.json`
- **Ablauf:** Zotero-Items holen, Ortsnamen extrahieren, via Wikidata geocodieren
- **Laden:** `loadGeoEnriched()` in `data.js`, graceful Fallback bei fehlendem File

## Co-Autorenschaft

`buildCoAuthorshipLinks(items)` erzeugt Kanten zwischen Items mit gemeinsamen Autoren (exkl. `IDE` als institutioneller Autor). Wird fuer das Netzwerk-Layout genutzt.

## Datenluecken

- **Tags:** Nicht systematisch vergeben -- Collections als primaere Struktur
- **Orte:** Nur ein Teil der Items hat Ortsangaben -- Items ohne Ort werden im Map-Layout als Reihe am unteren Rand angezeigt (opacity 0.15)
- **Abstracts:** Nur bei einigen Typen vorhanden
