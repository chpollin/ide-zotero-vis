/**
 * IDE Data Story - Particle Engine
 * Canvas-based visualization with smooth layout transitions.
 */

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────
  let canvas, ctx;
  let particles = [];
  let width = 0, height = 0;
  let dpr = 1;
  let currentLayout = 'cloud';
  let hoveredParticle = null;
  let networkData = null;
  let networkPositions = null;
  let overlayElements = [];
  let tooltipEl = null;

  // ─── Constants ────────────────────────────────────────
  const PARTICLE_STAGGER = 12;
  const LABEL_OFFSET_Y = 50;
  const HOVER_RADIUS_BOOST = 3;
  const NETWORK_SIM_CONFIG = {
    linkDistance: 40,
    linkStrength: 0.3,
    charge: -60,
    ticks: 200,
    collisionRadius: 8
  };

  // ─── Initialization ──────────────────────────────────
  function init(canvasEl, items) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;
    tooltipEl = document.getElementById('tooltip');

    resize();

    particles = items.map((item, i) => ({
      id: item.id,
      x: width / 2 + (Math.random() - 0.5) * 50,
      y: height / 2 + (Math.random() - 0.5) * 50,
      targetX: width / 2,
      targetY: height / 2,
      radius: item.radius,
      baseRadius: item.radius,
      color: item.color,
      opacity: 0,
      targetOpacity: 1,
      data: item,
      delay: i * 15,
      startTime: 0
    }));

    networkData = window.IDEData.buildCoAuthorshipLinks(items);
    precomputeNetworkLayout();

    requestAnimationFrame(render);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('click', onClick);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 200);
    });
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onResize() {
    resize();
    applyLayout(currentLayout, true);
  }

  // ─── Render Loop ──────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, width, height);
    const now = performance.now();

    if (currentLayout === 'network' && networkPositions) {
      drawNetworkLines();
    }

    window.IDECanvasUtils.lerpParticles(particles, now, { threshold: 0.5 });
    window.IDECanvasUtils.drawParticles(ctx, particles);

    requestAnimationFrame(render);
  }

  function drawNetworkLines() {
    if (!networkPositions || !networkData) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 0.5;

    for (const link of networkData.links) {
      const sourcePos = networkPositions[link.source];
      const targetPos = networkPositions[link.target];
      if (!sourcePos || !targetPos) continue;

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ─── Network Precomputation ────────────────────────
  function precomputeNetworkLayout() {
    if (!networkData) return;

    const itemNodes = particles.map(p => ({ id: p.id, type: 'item', fx: null, fy: null }));

    const creatorNodesMap = {};
    particles.forEach(p => {
      p.data.creators.forEach(name => {
        if (name === 'IDE') return;
        if (!creatorNodesMap[name]) {
          creatorNodesMap[name] = { id: name, type: 'creator', itemCount: 0, fx: null, fy: null };
        }
        creatorNodesMap[name].itemCount++;
      });
    });

    const allNodes = itemNodes.concat(Object.values(creatorNodesMap));

    const links = [];
    particles.forEach(p => {
      p.data.creators.forEach(name => {
        if (name === 'IDE') return;
        links.push({ source: p.id, target: name });
      });
    });

    const cfg = NETWORK_SIM_CONFIG;
    const sim = d3.forceSimulation(allNodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(cfg.linkDistance).strength(cfg.linkStrength))
      .force('charge', d3.forceManyBody().strength(cfg.charge))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(cfg.collisionRadius))
      .stop();

    for (let i = 0; i < cfg.ticks; i++) sim.tick();

    networkPositions = {};
    allNodes.forEach(n => {
      networkPositions[n.id] = {
        rawX: n.x, rawY: n.y,
        x: n.x, y: n.y,
        type: n.type,
        itemCount: n.itemCount || 0
      };
    });
  }

  // ─── Layout Application ───────────────────────────
  function applyLayout(layoutName, instant) {
    currentLayout = layoutName;

    particles.forEach((p, i) => {
      p.delay = instant ? 0 : i * PARTICLE_STAGGER;
      p.startTime = 0;
    });

    if (layoutName === 'network') {
      if (!networkPositions) precomputeNetworkLayout();
      window.IDELayouts.network(particles, width, height, { networkPositions });
    } else {
      const fn = window.IDELayouts[layoutName];
      if (fn) fn(particles, width, height);
    }

    clearOverlays();

    if (layoutName === 'clusters') {
      addClusterLabels();
    }
  }

  // ─── Overlay Management ───────────────────────────
  function clearOverlays() {
    overlayElements.forEach(el => el.remove());
    overlayElements = [];

    const svg = document.getElementById('annotation-layer');
    if (svg) svg.innerHTML = '';
  }

  function addClusterLabels() {
    const stickyVis = canvas.parentElement;
    const groups = { Schools: [], RIDE: [], SIDE: [] };
    const pillarColors = window.IDEData.PILLAR_COLORS;

    particles.forEach(p => {
      if (groups[p.data.pillar]) groups[p.data.pillar].push(p);
    });

    for (const name of Object.keys(groups)) {
      const items = groups[name];
      if (items.length === 0) continue;

      const avgX = d3.mean(items, p => p.targetX);
      const minY = d3.min(items, p => p.targetY);

      const label = document.createElement('div');
      label.className = 'cluster-label';
      label.style.left = `${avgX}px`;
      label.style.top = `${minY - LABEL_OFFSET_Y}px`;
      label.style.color = pillarColors[name] || 'var(--text-dim)';
      label.innerHTML = `<span class="cluster-count">${items.length}</span>${name}`;

      stickyVis.appendChild(label);
      overlayElements.push(label);
    }
  }

  // ─── Mouse Interaction ────────────────────────────
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const found = window.IDECanvasUtils.findHoveredParticle(particles, mx, my);

    if (found !== hoveredParticle) {
      if (hoveredParticle) {
        hoveredParticle.baseRadius = hoveredParticle.data.radius;
      }
      hoveredParticle = found;
      if (found) {
        found.baseRadius = found.data.radius + HOVER_RADIUS_BOOST;
        showTooltip(e, found);
        canvas.style.cursor = 'pointer';
      } else {
        hideTooltip();
        canvas.style.cursor = 'default';
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
    canvas.style.cursor = 'default';
  }

  function onClick() {
    if (hoveredParticle) {
      document.dispatchEvent(new CustomEvent('particle-click', { detail: hoveredParticle.data }));
    }
  }

  // ─── Tooltip ──────────────────────────────────────
  function showTooltip(e, p) {
    if (!tooltipEl) return;
    tooltipEl.innerHTML = window.IDECanvasUtils.createTooltipContent(p.data);
    tooltipEl.style.display = 'block';
    updateTooltipPosition(e);
  }

  function updateTooltipPosition(e) {
    if (!tooltipEl) return;
    const pad = 15;
    let x = e.clientX + pad;
    let y = e.clientY - pad;
    const rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - pad;
    if (y < 0) y = e.clientY + pad;
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  // ─── Public API ───────────────────────────────────
  window.IDEParticles = {
    init,
    applyLayout,
    getParticles: () => particles,
    resize
  };

})();
