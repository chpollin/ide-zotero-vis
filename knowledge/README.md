# IDE Data Story – Knowledge Vault

Wissensspeicher für die Entwicklung der IDE Zotero Data Story.

## Navigation

- [01-data-analysis](01-data-analysis.md) – Zotero-Datenanalyse: Collections, Farben, Item-Typen
- [02-scrollytelling](02-scrollytelling.md) – Scrollytelling-Techniken: Scrollama, CSS Sticky, Side-by-Side Layout
- [03-inspiration](03-inspiration.md) – Best-Practice-Beispiele: The Pudding, NYT, Reuters Graphics
- [04-tech-stack](04-tech-stack.md) – Technologie-Entscheidungen, Datei-Architektur, Code-Stil
- [05-narrative-structure](05-narrative-structure.md) – 6-Step-Aufbau mit Layout-Mapping (Genesis-Intro)
- [06-visual-design](06-visual-design.md) – Light Editorial Design: Farben, Typografie, Partikel, Side-by-Side
- [07-implementation-notes](07-implementation-notes.md) – Canvas-Rendering, Layout-Contract, Genesis-Precomputation, Performance

## Projekt-Kontext

Das **IDE** (Institut für Digitale Edition) dokumentiert seine Institutsgeschichte (2008–2024) in einer Zotero-Bibliothek. Dieses Projekt transformiert diese bibliografischen Daten in eine **scrollbare Data Story** mit Canvas-basierter Partikelvisualisierung.

### Architektur-Überblick

- **Side-by-Side Layout:** 25% Text-Panel (links) + 75% Canvas (rechts, `position: sticky`)
- **Genesis-Intro:** Temporaler Netzwerk-Graph (x = Jahr, Co-Autorenschaft) als Einstieg
- **6 Layouts:** genesis, timeline, clusters, network, map, cloud
- **Vanilla JS + D3 + Scrollama** — kein Build-Step, kein GSAP-Pin
