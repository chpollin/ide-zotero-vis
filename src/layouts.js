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

  const TIMELINE_MARGINS = { left: 0.08, right: 0.08, top: 0.15, bottom: 0.25 };
  const TIMELINE_JITTER = 7.5;
  const TIMELINE_TYPE_ORDER = [
    'book', 'journalArticle', 'conferencePaper', 'bookSection',
    'presentation', 'document', 'blogPost', 'webpage'
  ];

  const CLUSTER_CENTERS = {
    Schools: { x: 0.22, y: 0.45 },
    RIDE:    { x: 0.50, y: 0.45 },
    SIDE:    { x: 0.78, y: 0.45 },
    Events:  { x: 0.35, y: 0.82 },
    Varia:   { x: 0.65, y: 0.82 }
  };
  const CLUSTER_SPACING = 3;

  const NETWORK_MARGIN = 80;

  const MAP_CENTER = [10.5, 50.5];
  const MAP_SCALE_RATIO = 2.5;
  const MAP_PLACE_SPREAD = 10;
  const MAP_NO_COORDS_SPREAD = 6;

  const GENESIS_MARGIN = 60;

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
  }

  // ─── Timeline (x = date, y = type band) ───────────

  function timeline(ps, w, h) {
    const dated = [];
    const undated = [];
    for (const p of ps) {
      if (p.data.date) dated.push(p);
      else undated.push(p);
    }

    if (dated.length === 0) {
      cloud(ps, w, h);
      return;
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

    const yBand = d3.scaleBand()
      .domain(TIMELINE_TYPE_ORDER)
      .range([margin.top, h - margin.bottom])
      .padding(0.3);

    for (const p of dated) {
      p.targetX = x(p.data.date);
      const bandY = yBand(p.data.type);
      p.targetY = (bandY !== undefined ? bandY + yBand.bandwidth() / 2 : h / 2)
                  + (Math.random() - 0.5) * (TIMELINE_JITTER * 2);
      p.targetOpacity = 1;
      p.baseRadius = p.data.radius;
    }

    undated.forEach((p, i) => {
      const r = Math.sqrt(i) * 8;
      const theta = i * GOLDEN_ANGLE;
      p.targetX = w * 0.85 + r * Math.cos(theta);
      p.targetY = h * 0.85 + r * Math.sin(theta);
      p.targetOpacity = 0.3;
      p.baseRadius = p.data.radius * 0.7;
    });
  }

  // ─── Clusters (grouped by pillar) ──────────────────

  function clusters(ps, w, h) {
    const groups = { Schools: [], RIDE: [], SIDE: [], Events: [], Varia: [] };

    for (const p of ps) {
      const g = groups[p.data.pillar];
      if (g) g.push(p);
      else groups.Varia.push(p);
    }

    for (const name of Object.keys(groups)) {
      const items = groups[name];
      const centerDef = CLUSTER_CENTERS[name];
      if (!centerDef || items.length === 0) continue;

      const cx = w * centerDef.x;
      const cy = h * centerDef.y;

      items.forEach((p, i) => {
        const r = Math.sqrt(i) * (p.data.radius + CLUSTER_SPACING);
        const theta = i * GOLDEN_ANGLE;
        p.targetX = cx + r * Math.cos(theta);
        p.targetY = cy + r * Math.sin(theta);
        p.targetOpacity = 1;
        p.baseRadius = p.data.radius;
      });
    }
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
    const projection = d3.geoMercator()
      .center(MAP_CENTER)
      .scale(Math.min(w, h) * MAP_SCALE_RATIO)
      .translate([w / 2, h / 2]);

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

    withoutCoords.forEach((p, i) => {
      const r = Math.sqrt(i) * MAP_NO_COORDS_SPREAD;
      const theta = i * GOLDEN_ANGLE;
      p.targetX = w * 0.85 + r * Math.cos(theta);
      p.targetY = h * 0.85 + r * Math.sin(theta);
      p.targetOpacity = 0.25;
      p.baseRadius = p.data.radius * 0.7;
    });
  }

  // ─── Genesis (temporal network, x = year) ─────────

  function genesis(ps, w, h, opts) {
    const positions = opts && opts.genesisPositions;
    if (!positions) return;

    const allPos = Object.values(positions);
    const xExtent = d3.extent(allPos, d => d.rawX);
    const yExtent = d3.extent(allPos, d => d.rawY);

    const scaleX = d3.scaleLinear().domain(xExtent).range([GENESIS_MARGIN, w - GENESIS_MARGIN]);
    const scaleY = d3.scaleLinear().domain(yExtent).range([GENESIS_MARGIN, h - GENESIS_MARGIN]);

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
      } else {
        p.targetX = w / 2;
        p.targetY = h * 0.9;
        p.targetOpacity = 0.2;
      }
      p.baseRadius = p.data.radius;
    }
  }

  // ─── Export ────────────────────────────────────────

  window.IDELayouts = { cloud, timeline, clusters, network, map, genesis };

})();
