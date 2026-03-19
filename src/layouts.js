/**
 * IDE Data Story - Shared Layout Functions
 * Used by both the scrollytelling particle engine and the interactive explorer.
 *
 * Each function sets targetX, targetY, targetOpacity, baseRadius on particle objects.
 */

(function () {
  'use strict';

  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  // ─── Layout Configuration ───────────────────────────
  const CLOUD_RADIUS_RATIO = 0.35;

  const TIMELINE_MARGINS = { left: 0.08, right: 0.08, top: 0.10, bottom: 0.12 };
  const TIMELINE_TYPE_ORDER = [
    'book', 'journalArticle', 'conferencePaper', 'bookSection',
    'presentation', 'document', 'blogPost', 'webpage'
  ];
  const TYPE_LABELS = {
    book:            { de: 'Buch',                  en: 'Book' },
    journalArticle:  { de: 'Zeitschriftenartikel',  en: 'Journal Article' },
    conferencePaper: { de: 'Konferenzbeitrag',      en: 'Conference Paper' },
    bookSection:     { de: 'Buchkapitel',            en: 'Book Section' },
    presentation:    { de: 'Vortrag',               en: 'Presentation' },
    document:        { de: 'Dokument',               en: 'Document' },
    blogPost:        { de: 'Blogbeitrag',            en: 'Blog Post' },
    webpage:         { de: 'Webseite',               en: 'Webpage' }
  };

  const NETWORK_MARGIN = 80;

  const MAP_CENTER = [10.5, 50.5];
  const MAP_SCALE_RATIO = 2.5;
  const MAP_PLACE_SPREAD = 10;
  const MAP_NO_COORDS_SPREAD = 6;

  // ─── Cloud (Phyllotaxis Spiral) ────────────────────

  function cloud(ps, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * CLOUD_RADIUS_RATIO;
    const len = ps.length;

    for (let i = 0; i < len; i++) {
      const p = ps[i];
      const r = Math.sqrt(i / len) * maxR;
      const theta = i * GOLDEN_ANGLE;
      p.targetX = cx + r * Math.cos(theta);
      p.targetY = cy + r * Math.sin(theta);
      p.targetOpacity = 1;
      p.baseRadius = p.data.radius;
    }
    return null;
  }

  // ─── Timeline (x = date, y = pillar band) ─────────
  //
  // Y-axis shows pillars (Schools, RIDE, SIDE) — the narratively relevant
  // dimension. Dot size encodes publication type. Colour matches pillar.
  // Items within each band use force-collision to avoid overlap.

  // Main pillars — derived from PILLAR_COLORS, excluding secondary ones
  const MAIN_PILLARS = ['Schools', 'RIDE', 'SIDE'];

  function timeline(ps, w, h) {
    const dated = [];
    const undated = [];
    for (const p of ps) {
      if (p.data.date) dated.push(p);
      else undated.push(p);
    }

    if (dated.length === 0) {
      cloud(ps, w, h);
      return null;
    }

    const margin = {
      left: w * TIMELINE_MARGINS.left,
      right: w * TIMELINE_MARGINS.right,
      top: h * TIMELINE_MARGINS.top,
      bottom: h * TIMELINE_MARGINS.bottom
    };

    const extent = d3.extent(dated, p => p.data.date);
    const x = d3.scaleTime()
      .domain(extent)
      .range([margin.left, w - margin.right]);

    // Three main swim-lanes by pillar
    const yBand = d3.scaleBand()
      .domain(MAIN_PILLARS)
      .range([margin.top, h - margin.bottom])
      .padding(0.15);

    // Group by pillar
    const byPillar = {};
    MAIN_PILLARS.forEach(function (name) { byPillar[name] = []; });
    const secondary = []; // Events + Varia

    for (const p of dated) {
      if (byPillar[p.data.pillar]) {
        byPillar[p.data.pillar].push(p);
      } else {
        secondary.push(p);
      }
    }

    // Position items within each pillar band
    for (const pillar of MAIN_PILLARS) {
      const items = byPillar[pillar];
      if (items.length === 0) continue;

      const bandY = yBand(pillar);
      const bandH = yBand.bandwidth();

      // Sort chronologically
      items.sort((a, b) => a.data.date - b.data.date);

      // Bin by year to handle overlap within the same year
      const byYear = {};
      items.forEach(function (p) {
        const yr = p.data.year;
        if (!byYear[yr]) byYear[yr] = [];
        byYear[yr].push(p);
      });

      for (const yr of Object.keys(byYear)) {
        const yearItems = byYear[yr];
        const baseX = x(yearItems[0].data.date);

        for (let i = 0; i < yearItems.length; i++) {
          const p = yearItems[i];
          // Spread horizontally and vertically within the year bin
          const col = Math.floor(i / 4);
          const row = i % 4;
          const spacing = p.data.radius * 2.4;
          p.targetX = baseX + col * spacing;
          p.targetY = bandY + bandH * 0.2 + row * spacing;
          p.targetOpacity = 1;
          p.baseRadius = p.data.radius;
        }
      }
    }

    // Secondary items (Events, Varia): small, along bottom
    secondary.forEach((p, i) => {
      p.targetX = x(p.data.date);
      p.targetY = h - margin.bottom - 5 + ((i % 3) - 1) * 8;
      p.targetOpacity = 0.3;
      p.baseRadius = p.data.radius * 0.6;
    });

    // Undated items — small spiral, bottom-right
    const undatedCount = undated.length;
    undated.forEach((p, i) => {
      const r = Math.sqrt(i) * 7;
      const theta = i * GOLDEN_ANGLE;
      p.targetX = w * 0.92 + r * Math.cos(theta);
      p.targetY = h * 0.88 + r * Math.sin(theta);
      p.targetOpacity = 0.3;
      p.baseRadius = p.data.radius * 0.7;
    });

    return {
      scales: { x: x, y: yBand },
      margin: margin,
      undated: { count: undatedCount, x: w * 0.92, y: h * 0.88 }
    };
  }

  // ─── Clusters (grouped by pillar, compact spirals) ──
  //
  // Shows proportional distribution: three large clusters for main pillars,
  // two smaller ones for Events + Varia. No time axis — purely categorical.

  const CLUSTER_POSITIONS = {
    Schools: { x: 0.22, y: 0.42 },
    RIDE:    { x: 0.50, y: 0.42 },
    SIDE:    { x: 0.78, y: 0.42 },
    Events:  { x: 0.35, y: 0.82 },
    Varia:   { x: 0.65, y: 0.82 }
  };

  function clusters(ps, w, h) {
    const groups = { Schools: [], RIDE: [], SIDE: [], Events: [], Varia: [] };

    for (const p of ps) {
      const g = groups[p.data.pillar];
      if (g) g.push(p);
      else groups.Varia.push(p);
    }

    const allPillars = Object.keys(CLUSTER_POSITIONS);

    for (const name of allPillars) {
      const items = groups[name];
      if (!items || items.length === 0) continue;

      const pos = CLUSTER_POSITIONS[name];
      const cx = w * pos.x;
      const cy = h * pos.y;
      const isSecondary = (name === 'Events' || name === 'Varia');
      const spacing = isSecondary ? 2.5 : 3;

      items.forEach((p, i) => {
        const r = Math.sqrt(i) * (p.data.radius * 0.6 + spacing);
        const theta = i * GOLDEN_ANGLE;
        p.targetX = cx + r * Math.cos(theta);
        p.targetY = cy + r * Math.sin(theta);
        p.targetOpacity = isSecondary ? 0.5 : 1;
        p.baseRadius = p.data.radius;
      });
    }

    return {
      clusterPositions: CLUSTER_POSITIONS,
      groups: {
        Schools: groups.Schools.length,
        RIDE: groups.RIDE.length,
        SIDE: groups.SIDE.length,
        Events: groups.Events.length,
        Varia: groups.Varia.length
      }
    };
  }

  // ─── Network (uses precomputed positions) ──────────

  function network(ps, w, h, opts) {
    const positions = opts && opts.networkPositions;
    if (!positions) return;

    const allPos = Object.values(positions);
    const xExtent = d3.extent(allPos, d => d.rawX);
    const yExtent = d3.extent(allPos, d => d.rawY);

    const scaleX = d3.scaleLinear().domain(xExtent).range([NETWORK_MARGIN, w - NETWORK_MARGIN]);
    const scaleY = d3.scaleLinear().domain(yExtent).range([NETWORK_MARGIN, h - NETWORK_MARGIN]);

    for (const id of Object.keys(positions)) {
      const pos = positions[id];
      pos.x = scaleX(pos.rawX);
      pos.y = scaleY(pos.rawY);
    }

    for (const p of ps) {
      const pos = positions[p.id];
      if (pos) {
        p.targetX = pos.x;
        p.targetY = pos.y;
        p.targetOpacity = 1;
        p.baseRadius = p.data.radius;
      } else {
        p.targetX = w / 2 + (Math.random() - 0.5) * 100;
        p.targetY = h * 0.9;
        p.targetOpacity = 0.2;
      }
    }
  }

  // ─── Map (d3.geoMercator projection) ──────────────

  function map(ps, w, h) {
    // Fit projection to the visible canvas area with padding
    const mapPadding = 80;
    const projection = d3.geoMercator()
      .center(MAP_CENTER)
      .scale(Math.min(w, h) * MAP_SCALE_RATIO)
      .translate([w * 0.5, h * 0.45]); // slightly above center to leave room below

    const byPlace = {};
    const withoutCoords = [];

    for (const p of ps) {
      if (p.data.coords) {
        const key = p.data.place || 'unknown';
        if (!byPlace[key]) byPlace[key] = [];
        byPlace[key].push(p);
      } else {
        withoutCoords.push(p);
      }
    }

    for (const placeKey of Object.keys(byPlace)) {
      const group = byPlace[placeKey];
      const base = projection(group[0].data.coords);
      if (!base) continue;

      group.forEach((p, i) => {
        if (group.length === 1) {
          p.targetX = base[0];
          p.targetY = base[1];
        } else {
          const r = Math.sqrt(i) * MAP_PLACE_SPREAD;
          const theta = i * GOLDEN_ANGLE;
          p.targetX = base[0] + r * Math.cos(theta);
          p.targetY = base[1] + r * Math.sin(theta);
        }
        p.targetOpacity = 1;
        p.baseRadius = p.data.radius;
      });
    }

    // Items without coordinates: arrange as a neat horizontal row
    // at the bottom of the map, sorted by pillar, with reduced opacity
    withoutCoords.sort(function (a, b) {
      if (a.data.pillar < b.data.pillar) return -1;
      if (a.data.pillar > b.data.pillar) return 1;
      return 0;
    });
    const rowY = h - 40;
    const totalWidth = w * 0.7;
    const startX = w * 0.15;
    const spacing = withoutCoords.length > 1
      ? Math.min(12, totalWidth / withoutCoords.length)
      : 0;
    withoutCoords.forEach((p, i) => {
      p.targetX = startX + i * spacing;
      p.targetY = rowY + ((i % 2) * 6); // slight stagger for legibility
      p.targetOpacity = 0.15;
      p.baseRadius = p.data.radius * 0.5;
    });

    // Collect place counts for annotations
    const placeCounts = {};
    for (const placeKey of Object.keys(byPlace)) {
      placeCounts[placeKey] = {
        count: byPlace[placeKey].length,
        coords: byPlace[placeKey][0].data.coords
      };
    }

    return {
      projection: projection,
      placeCounts: placeCounts,
      withoutCoordsCount: withoutCoords.length
    };
  }

  // ─── Export ────────────────────────────────────────

  window.IDELayouts = { cloud, timeline, clusters, network, map, TYPE_LABELS };

})();
