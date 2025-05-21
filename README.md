# IDE Explorer

This project is a lightweight single-page web application that visualizes bibliographic data from the Institute for Documentology and Editing (IDE) Zotero library.

The application fetches data directly from the Zotero API and provides four interactive views with shared filtering:

1. **Timeline** – chronological view of items
2. **Map** – geographical distribution using Leaflet
3. **Network** – relations between creators and items
4. **Topics** – tag frequency overview

Filtering controls and shared state mean that selections and year ranges apply across all visualizations. Map markers are clustered for better performance.

A detail panel shows information about the selected item. Data is cached in `localStorage` to reduce API requests.

## Getting Started

1. Open `index.html` in a modern browser with internet access.
2. The app will load data from the Zotero group (ID `4712864`).
3. Use the navigation buttons to switch between visualizations.
4. Adjust the year range or item type filters to refine the data.
5. Click any element in a visualization to see details in the panel below.

No build step is required. All dependencies are loaded from CDNs at runtime.

## Development Notes

- React, D3, Leaflet, and the MarkerCluster plugin are loaded via `unpkg.com`.
- The API key is stored in `src/app.js` for simplicity. Replace with your own key if necessary.
- Geocoding for the map view uses OpenStreetMap's Nominatim service and results are cached in `localStorage`.

## License

This project is provided as-is for demonstration purposes.
