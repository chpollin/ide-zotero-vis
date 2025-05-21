# IDE Explorer

This project is a lightweight single-page web application that visualizes bibliographic data from the Institute for Documentology and Editing (IDE) Zotero library.

The application fetches data directly from the Zotero API and provides four interactive views:

1. **Timeline** – chronological view of items
2. **Map** – geographical distribution using Leaflet
3. **Network** – relations between creators and items
4. **Topics** – tag frequency overview

A detail panel shows information about the selected item. Data is cached in `localStorage` to reduce API requests.

## Getting Started

1. Open `index.html` in a modern browser with internet access.
2. The app will load data from the Zotero group (ID `4712864`).
3. Use the navigation buttons to switch between visualizations.
4. Click any element in a visualization to see details in the panel below.

No build step is required. All dependencies are loaded from CDNs at runtime.

## Development Notes

- React, D3, and Leaflet are loaded via `unpkg.com`.
- The API key is stored in `src/app.js` for simplicity. Replace with your own key if necessary.
- Geocoding for the map view uses OpenStreetMap's Nominatim service and is very basic – it simply queries by place name.

## License

This project is provided as-is for demonstration purposes.
## Deploying to GitHub Pages

1. Commit all files to your repository on GitHub.
2. In the repository settings, enable **GitHub Pages** and select the **main branch** as the source ("/" folder).
3. After saving, GitHub will provide a URL like `https://<username>.github.io/<repository>/` where the app will be available.
4. It may take a minute for the page to appear. Refresh the URL to see the IDE Explorer.

