/**
 * IDE Data Story - Data Layer
 * Loads, filters, and enriches Zotero items for visualization.
 */

(function () {
  'use strict';

  const API_KEY = 'jpnx4yzOKT55S0ZXx6Q7fZ0s';
  const BASE_URL = 'https://api.zotero.org/groups/4712864';
  const CACHE_KEY = 'ide-story-cache';
  const CACHE_TIME = 24 * 60 * 60 * 1000;

  const GEO_COORDS = {
    'Wien': [16.37, 48.21],
    'Vienna': [16.37, 48.21],
    'Köln': [6.96, 50.94],
    'Cologne': [6.96, 50.94],
    'Berlin': [13.41, 52.52],
    'Chemnitz': [12.92, 50.83],
    'Norderstedt': [10.01, 53.70],
    'Wiesbaden': [8.24, 50.08],
    'Graz': [15.44, 47.07],
    'Wuppertal': [7.18, 51.26],
    'München': [11.58, 48.14],
    'Munich': [11.58, 48.14],
    'Boston': [-71.06, 42.36],
    'Hamburg': [9.99, 53.55],
    'Paderborn': [8.75, 51.72],
    'Rostock': [12.10, 54.09],
    'Bamberg': [10.89, 49.89],
    'Lüneburg': [10.41, 53.25],
    'Frankfurt': [8.68, 50.11],
    'Heidelberg': [8.69, 49.40],
    'Trier': [6.64, 49.75],
    'Zürich': [8.54, 47.38],
    'Bern': [7.45, 46.95],
    'Innsbruck': [11.39, 47.26],
    'Salzburg': [13.05, 47.80],
    'Passau': [13.43, 48.57],
    'Würzburg': [9.93, 49.79],
    'Leipzig': [12.37, 51.34],
    'Dresden': [13.74, 51.05],
    'Darmstadt': [8.65, 49.87],
    'Mainz': [8.27, 50.00],
    'Bonn': [7.10, 50.73],
    'Düsseldorf': [6.77, 51.23],
    'Essen': [7.01, 51.46]
  };

  const COLLECTION_MAP = {
    'ABQVUZ7X': { name: 'Schools', pillar: 'Schools' },
    '96BBH58W': { name: 'RIDE', pillar: 'RIDE' },
    '8JIZ6LQD': { name: 'SIDE', pillar: 'SIDE' },
    'WWEZKUJX': { name: 'Events', pillar: 'Events' },
    '8FRU4J6S': { name: 'Varia', pillar: 'Varia' },
    '4DIAPN26': { name: 'Dhd25', pillar: 'Varia' }
  };

  const PILLAR_COLORS = {
    'Schools': '#b8860b',
    'RIDE': '#2a7a6f',
    'SIDE': '#a0522d',
    'Events': '#5b7a8a',
    'Varia': '#8d8d8d'
  };

  const TYPE_RADIUS = {
    'book': 11,
    'journalArticle': 9,
    'conferencePaper': 8,
    'bookSection': 7,
    'presentation': 6,
    'document': 6,
    'blogPost': 5,
    'webpage': 5
  };

  // ─── API ──────────────────────────────────────────

  function fetchAllItems() {
    const items = [];
    let start = 0;
    const limit = 100;

    function fetchPage() {
      const url = `${BASE_URL}/items?limit=${limit}&start=${start}&key=${API_KEY}`;
      return fetch(url).then(res => {
        if (!res.ok) throw new Error(`Zotero API error: ${res.status}`);
        const totalResults = parseInt(res.headers.get('Total-Results') || '0');
        return res.json().then(batch => {
          items.push(...batch);
          start += limit;
          if (start >= totalResults || batch.length === 0) return items;
          return fetchPage();
        });
      });
    }

    return fetchPage();
  }

  // ─── Place Resolution ─────────────────────────────

  function resolvePlace(item) {
    if (item.data.place) return item.data.place;
    const shortTitle = item.data.shortTitle || '';
    const match = shortTitle.match(/(?:School\d+-\d+-?)(\w+)$/);
    return match ? match[1] : null;
  }

  function resolveCoords(place) {
    if (!place) return null;
    if (GEO_COORDS[place]) return GEO_COORDS[place];

    const parts = place.split(/[,;/&]+/).map(s => s.trim());
    for (const part of parts) {
      if (GEO_COORDS[part]) return GEO_COORDS[part];
    }

    for (const key of Object.keys(GEO_COORDS)) {
      if (place.toLowerCase().includes(key.toLowerCase())) return GEO_COORDS[key];
    }

    return null;
  }

  // ─── Date Parsing ─────────────────────────────────

  function parseZoteroDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}$/.test(dateStr)) return new Date(parseInt(dateStr), 0, 1);
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [year, month] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function getCreatorName(creator) {
    if (creator.name) return creator.name;
    return [creator.firstName, creator.lastName].filter(Boolean).join(' ');
  }

  // ─── Main Data Loader ─────────────────────────────

  function loadData() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TIME) {
          const items = parsed.data.map(item => {
            const copy = { ...item };
            if (copy.date) copy.date = new Date(copy.date);
            return copy;
          });
          return Promise.resolve(items);
        }
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    return fetchAllItems().then(rawItems => {
      return fetch(`${BASE_URL}/collections?limit=100&key=${API_KEY}`)
        .then(res => res.json())
        .then(allCollections => {
          const subCollectionToPillar = {};
          allCollections.forEach(col => {
            const parentKey = col.data.parentCollection;
            if (parentKey && COLLECTION_MAP[parentKey]) {
              subCollectionToPillar[col.key] = COLLECTION_MAP[parentKey].pillar;
            }
            if (COLLECTION_MAP[col.key]) {
              subCollectionToPillar[col.key] = COLLECTION_MAP[col.key].pillar;
            }
          });

          const filtered = rawItems.filter(item =>
            item.data.itemType !== 'note' && item.data.itemType !== 'attachment'
          );

          const enriched = filtered.map(item => {
            const date = parseZoteroDate(item.data.date);
            const place = resolvePlace(item);
            const coords = resolveCoords(place);
            const collections = item.data.collections || [];

            let pillar = 'Varia';
            for (const colKey of collections) {
              if (subCollectionToPillar[colKey]) {
                pillar = subCollectionToPillar[colKey];
                break;
              }
            }

            return {
              id: item.key,
              title: item.data.title || '(Untitled)',
              type: item.data.itemType,
              date,
              dateStr: item.data.date || '',
              year: date ? date.getFullYear() : null,
              place,
              coords,
              pillar,
              color: PILLAR_COLORS[pillar] || PILLAR_COLORS.Varia,
              radius: TYPE_RADIUS[item.data.itemType] || 5,
              creators: (item.data.creators || []).map(getCreatorName),
              url: item.data.url || null,
              abstract: item.data.abstractNote || null,
              collections
            };
          });

          enriched.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date - b.date;
          });

          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: enriched
          }));

          return enriched;
        });
    });
  }

  // ─── Co-authorship Links ──────────────────────────

  function buildCoAuthorshipLinks(items) {
    const links = [];
    const creatorItems = {};

    items.forEach(item => {
      item.creators.forEach(name => {
        if (name === 'IDE') return;
        if (!creatorItems[name]) creatorItems[name] = [];
        creatorItems[name].push(item.id);
      });
    });

    const seen = new Set();
    items.forEach(item => {
      const creators = item.creators.filter(n => n !== 'IDE');
      for (let i = 0; i < creators.length; i++) {
        for (let j = i + 1; j < creators.length; j++) {
          const key = [creators[i], creators[j]].sort().join('|||');
          if (!seen.has(key)) {
            seen.add(key);
            links.push({ source: creators[i], target: creators[j] });
          }
        }
      }
    });

    return { links };
  }

  // ─── Export ───────────────────────────────────────

  window.IDEData = {
    loadData,
    buildCoAuthorshipLinks,
    PILLAR_COLORS,
    GEO_COORDS,
    COLLECTION_MAP
  };

})();
