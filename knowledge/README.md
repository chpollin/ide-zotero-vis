# IDE Data Story – Knowledge Vault

Wissensspeicher für die Entwicklung der IDE Zotero Data Story.

## Navigation

- [01-data-analysis](01-data-analysis.md) – Zotero-Daten: Collections, Typen, Formen, Farben, Geodaten
- [02-scrollytelling](02-scrollytelling.md) – Scroll-Mechanik: Scrollama, CSS Sticky, Pillar-Filter
- [03-inspiration](03-inspiration.md) – Best-Practice-Beispiele: The Pudding, NYT, Reuters Graphics
- [04-tech-stack](04-tech-stack.md) – Technologien, Datei-Architektur, Abhängigkeiten
- [05-narrative-structure](05-narrative-structure.md) – 6-Step-Aufbau mit Layout-Mapping
- [06-visual-design](06-visual-design.md) – Design-System: Farben, Formen, Typografie, Responsive
- [07-implementation-notes](07-implementation-notes.md) – Canvas-Rendering, Layouts, Annotations, Performance

## Projekt-Kontext

Das **IDE** (Institut für Digitale Edition) dokumentiert seine Institutsgeschichte (2008–2024) in einer Zotero-Bibliothek. Dieses Projekt transformiert diese bibliografischen Daten in eine **scrollbare Data Story** mit Canvas-basierter Partikelvisualisierung.

### Architektur-Überblick

- **Side-by-Side Layout:** 25% Text-Panel (links) + 75% Canvas (rechts, `position: sticky`)
- **Intro:** Timeline mit langsamem progressivem Aufbau als Einstieg
- **5 Layouts:** timeline, clusters, network, map, cloud (Genesis nutzt timeline mit langsamerem Stagger)
- **Formen:** Quadrat (Buch), Kreis (Artikel), Raute (Kurzbeitrag), Dreieck (Vortrag)
- **Semantische Labels:** Schools→Lehre, RIDE→Rezensionen, SIDE→Forschung
- **Pillar-Filter:** In jedem Scrollytelling-View anklickbar (Lehre, Rezensionen, Forschung, Events)
- **Vanilla JS + D3 + Scrollama + TopoJSON** — kein Build-Step
- **8 Module:** data, canvas-utils, annotations, layouts, particles, scroll, narrative, explorer
