/**
 * IDE Data Story - Interactive Explorer
 * Post-scrollytelling exploration mode with filters and detail panel.
 */

(function () {
  'use strict';

  let explorerCanvas = null;
  let explorerCtx = null;
  let explorerParticles = [];
  let allItems = [];
  let currentLayout = 'cloud';
  let isActive = false;
  let width = 0, height = 0, dpr = 1;
  let hoveredParticle = null;
  let tooltipEl = null;
  const activeFilters = { yearMin: 2008, yearMax: 2024, pillar: 'all' };

  // ─── Constants ──────────────────────────────────────
  const EXPLORER_STAGGER = 8;
  const EXPLORER_LAYOUT_STAGGER = 5;
  const EXPLORER_INITIAL_JITTER = 100;
  const HOVER_RADIUS_BOOST = 3;
  const TOOLTIP_MAX_WIDTH = 300;
  const EXPLORER_NETWORK_CONFIG = {
    linkDistance: 30,
    charge: -40,
    ticks: 150,
    collisionRadius: 8,
    margin: 60
  };

  // ─── Initialization ──────────────────────────────

  function init(items) {
    allItems = items;

    document.addEventListener('explorer-activate', activate);
    document.addEventListener('explorer-deactivate', deactivate);

    setupFilters();
    setupLayoutButtons();
    setupDetailPanel();
  }

  function activate() {
    isActive = true;
    const section = document.getElementById('explorer-section');
    if (section) section.classList.remove('hidden');

    explorerCanvas = document.getElementById('explorer-canvas');
    if (!explorerCanvas) return;

    explorerCtx = explorerCanvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;
    tooltipEl = document.getElementById('explorer-tooltip');

    resizeExplorer();
    createExplorerParticles();
    applyExplorerLayout('cloud');
    requestAnimationFrame(renderExplorer);

    explorerCanvas.addEventListener('mousemove', onMouseMove);
    explorerCanvas.addEventListener('mouseleave', onMouseLeave);
    explorerCanvas.addEventListener('click', onClick);
  }

  function deactivate() {
    isActive = false;
    if (explorerCanvas) {
      explorerCanvas.removeEventListener('mousemove', onMouseMove);
      explorerCanvas.removeEventListener('mouseleave', onMouseLeave);
      explorerCanvas.removeEventListener('click', onClick);
    }
  }

  function resizeExplorer() {
    if (!explorerCanvas) return;
    const rect = explorerCanvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    explorerCanvas.width = width * dpr;
    explorerCanvas.height = height * dpr;
    explorerCanvas.style.width = `${width}px`;
    explorerCanvas.style.height = `${height}px`;
    explorerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createExplorerParticles() {
    const filtered = getFilteredItems();
    explorerParticles = filtered.map((item, i) => ({
      id: item.id,
      x: width / 2 + (Math.random() - 0.5) * EXPLORER_INITIAL_JITTER,
      y: height / 2 + (Math.random() - 0.5) * EXPLORER_INITIAL_JITTER,
      targetX: width / 2,
      targetY: height / 2,
      radius: item.radius,
      baseRadius: item.radius,
      color: item.color,
      opacity: 0,
      targetOpacity: 1,
      data: item,
      delay: i * EXPLORER_STAGGER,
      startTime: 0
    }));
  }

  // ─── Render ───────────────────────────────────────

  function renderExplorer() {
    if (!isActive || !explorerCtx) return;

    explorerCtx.clearRect(0, 0, width, height);
    const now = performance.now();

    window.IDECanvasUtils.lerpParticles(explorerParticles, now, { threshold: 0 });
    window.IDECanvasUtils.drawParticles(explorerCtx, explorerParticles);

    requestAnimationFrame(renderExplorer);
  }

  // ─── Layouts ──────────────────────────────────────

  function applyExplorerLayout(name) {
    currentLayout = name;

    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layout === name);
    });

    explorerParticles.forEach((p, i) => {
      p.delay = i * EXPLORER_LAYOUT_STAGGER;
      p.startTime = 0;
    });

    if (name === 'network') {
      computeExplorerNetwork(explorerParticles, width, height);
    } else {
      const fn = window.IDELayouts[name];
      if (fn) fn(explorerParticles, width, height);
    }
  }

  function computeExplorerNetwork(ps, w, h) {
    const nodes = ps.map(p => ({ id: p.id, x: p.x, y: p.y }));
    const links = [];

    const creatorToItems = {};
    ps.forEach(p => {
      p.data.creators.forEach(c => {
        if (c === 'IDE') return;
        if (!creatorToItems[c]) creatorToItems[c] = [];
        creatorToItems[c].push(p.id);
      });
    });

    const seen = new Set();
    Object.values(creatorToItems).forEach(items => {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const key = items[i] < items[j] ? `${items[i]}|${items[j]}` : `${items[j]}|${items[i]}`;
          if (!seen.has(key)) {
            seen.add(key);
            links.push({ source: items[i], target: items[j] });
          }
        }
      }
    });

    const cfg = EXPLORER_NETWORK_CONFIG;
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(cfg.linkDistance))
      .force('charge', d3.forceManyBody().strength(cfg.charge))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(cfg.collisionRadius))
      .stop();

    for (let i = 0; i < cfg.ticks; i++) sim.tick();

    const posMap = {};
    nodes.forEach(n => { posMap[n.id] = { x: n.x, y: n.y }; });

    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const sx = d3.scaleLinear().domain(d3.extent(xs)).range([cfg.margin, w - cfg.margin]);
    const sy = d3.scaleLinear().domain(d3.extent(ys)).range([cfg.margin, h - cfg.margin]);

    ps.forEach(p => {
      const pos = posMap[p.id];
      if (pos) {
        p.targetX = sx(pos.x);
        p.targetY = sy(pos.y);
      }
      p.targetOpacity = 1;
    });
  }

  // ─── Filters ──────────────────────────────────────

  function getFilteredItems() {
    return allItems.filter(item => {
      if (item.year && (item.year < activeFilters.yearMin || item.year > activeFilters.yearMax)) return false;
      if (activeFilters.pillar !== 'all' && item.pillar !== activeFilters.pillar) return false;
      return true;
    });
  }

  function applyFilters() {
    createExplorerParticles();
    applyExplorerLayout(currentLayout);
  }

  function setupFilters() {
    const minSlider = document.getElementById('year-min');
    const maxSlider = document.getElementById('year-max');
    const yearLabel = document.getElementById('year-label');

    if (minSlider && maxSlider) {
      const updateYears = () => {
        activeFilters.yearMin = parseInt(minSlider.value);
        activeFilters.yearMax = parseInt(maxSlider.value);
        if (activeFilters.yearMin > activeFilters.yearMax) {
          activeFilters.yearMax = activeFilters.yearMin;
          maxSlider.value = minSlider.value;
        }
        if (yearLabel) yearLabel.textContent = `${activeFilters.yearMin} \u2013 ${activeFilters.yearMax}`;
        if (isActive) applyFilters();
      };
      minSlider.addEventListener('input', updateYears);
      maxSlider.addEventListener('input', updateYears);
    }

    document.querySelectorAll('.pillar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pillar-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilters.pillar = btn.dataset.pillar;
        if (isActive) applyFilters();
      });
    });
  }

  function setupLayoutButtons() {
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isActive) applyExplorerLayout(btn.dataset.layout);
      });
    });
  }

  // ─── Detail Panel ─────────────────────────────────

  function setupDetailPanel() {
    const closeBtn = document.getElementById('detail-close');
    if (closeBtn) closeBtn.addEventListener('click', hideDetail);

    document.addEventListener('particle-click', e => {
      showDetail(e.detail);
    });
  }

  function showDetail(item) {
    const panel = document.getElementById('detail-panel');
    if (!panel) return;

    const lang = window.IDENarrative ? window.IDENarrative.getLanguage() : 'de';
    const color = window.IDEData.PILLAR_COLORS[item.pillar] || '#8d8d8d';

    document.getElementById('detail-title').textContent = item.title;

    const badge = `<span class="meta-pillar-badge" style="--badge-color:${color}">${item.pillar}</span>`;

    document.getElementById('detail-meta').innerHTML =
      `<span class="meta-label">${lang === 'de' ? 'Typ' : 'Type'}</span>` +
      `<span class="meta-value">${item.type}</span>` +
      `<span class="meta-label">${lang === 'de' ? 'Sammlung' : 'Collection'}</span>` +
      `<span class="meta-value">${badge}</span>` +
      (item.dateStr ? `<span class="meta-label">${lang === 'de' ? 'Datum' : 'Date'}</span><span class="meta-value">${item.dateStr}</span>` : '') +
      (item.place ? `<span class="meta-label">${lang === 'de' ? 'Ort' : 'Place'}</span><span class="meta-value">${item.place}</span>` : '');

    const abstractEl = document.getElementById('detail-abstract');
    abstractEl.textContent = item.abstract || '';
    abstractEl.style.display = item.abstract ? 'block' : 'none';

    const creatorsEl = document.getElementById('detail-creators');
    if (item.creators.length > 0) {
      creatorsEl.innerHTML =
        `<span class="meta-label">${lang === 'de' ? 'Beteiligte' : 'Contributors'}</span>` +
        item.creators.map(c => `<span class="creator-name">${c}</span>`).join(' ');
      creatorsEl.style.display = 'block';
    } else {
      creatorsEl.style.display = 'none';
    }

    const linkEl = document.getElementById('detail-link');
    if (item.url) {
      linkEl.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener">${lang === 'de' ? 'Zur Ressource' : 'View Resource'} &rarr;</a>`;
      linkEl.style.display = 'block';
    } else {
      linkEl.style.display = 'none';
    }

    panel.classList.remove('hidden');
    panel.classList.add('visible');
    panel.focus();
  }

  function hideDetail() {
    const panel = document.getElementById('detail-panel');
    if (panel) {
      panel.classList.remove('visible');
      panel.classList.add('hidden');
    }
  }

  // ─── Mouse Events ─────────────────────────────────

  function onMouseMove(e) {
    if (!explorerCanvas) return;
    const rect = explorerCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const found = window.IDECanvasUtils.findHoveredParticle(explorerParticles, mx, my);

    if (found !== hoveredParticle) {
      if (hoveredParticle) hoveredParticle.baseRadius = hoveredParticle.data.radius;
      hoveredParticle = found;
      if (found) {
        found.baseRadius = found.data.radius + HOVER_RADIUS_BOOST;
        showTooltip(e, found);
        explorerCanvas.style.cursor = 'pointer';
      } else {
        hideTooltip();
        explorerCanvas.style.cursor = 'default';
      }
    } else if (found) {
      updateTooltipPosition(e);
    }
  }

  function onMouseLeave() {
    if (hoveredParticle) {
      hoveredParticle.baseRadius = hoveredParticle.data.radius;
      hoveredParticle = null;
    }
    hideTooltip();
    if (explorerCanvas) explorerCanvas.style.cursor = 'default';
  }

  function onClick() {
    if (hoveredParticle) showDetail(hoveredParticle.data);
  }

  function showTooltip(e, p) {
    if (!tooltipEl) return;
    tooltipEl.innerHTML = window.IDECanvasUtils.createTooltipContent(p.data);
    tooltipEl.style.display = 'block';
    updateTooltipPosition(e);
  }

  function updateTooltipPosition(e) {
    if (!tooltipEl || !explorerCanvas) return;
    const rect = explorerCanvas.parentElement.getBoundingClientRect();
    let x = e.clientX - rect.left + 15;
    let y = e.clientY - rect.top - 15;
    if (x + TOOLTIP_MAX_WIDTH > rect.width) x = e.clientX - rect.left - TOOLTIP_MAX_WIDTH;
    if (y < 0) y = e.clientY - rect.top + 15;
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  // ─── Public API ───────────────────────────────────
  window.IDEExplorer = { init, showDetail, hideDetail };

})();
