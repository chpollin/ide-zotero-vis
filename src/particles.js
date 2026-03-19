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
  let particleMap = {};
  let overlayElements = [];
  let tooltipEl = null;
  let mapProjection = null;

  // ─── Constants ────────────────────────────────────────
  const PARTICLE_STAGGER = 12;
  const HOVER_RADIUS_BOOST = 3;
  const NETWORK_SIM_CONFIG = {
    linkDistance: 40,
    linkStrength: 0.3,
    charge: -120,
    ticks: 200,
    collisionRadius: 8
  };
  const GENESIS_PARTICLE_STAGGER = 25;

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
      shape: item.shape || 'circle',
      opacity: 0,
      targetOpacity: 1,
      data: item,
      delay: i * 15,
      startTime: 0
    }));

    // Build fast ID → particle lookup
    particleMap = {};
    particles.forEach(p => { particleMap[p.id] = p; });

    networkData = window.IDEData.buildCoAuthorshipLinks(items);
    precomputeNetworkLayout();

    // Preload map topology in background
    window.IDECanvasUtils.loadMapTopology();

    requestAnimationFrame(render);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('click', onClick);

    // Pillar filter buttons in scrollytelling
    setupScrollyFilter();

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
    window.IDECanvasUtils.invalidateMapCache();
    applyLayout(currentLayout, true);
  }

  // ─── Render Loop ──────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, width, height);
    const now = performance.now();

    if (currentLayout === 'map' && mapProjection) {
      window.IDECanvasUtils.drawBaseMap(ctx, mapProjection, width, height);
    }

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
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    for (const link of networkData.links) {
      const sourcePos = networkPositions[link.source];
      const targetPos = networkPositions[link.target];
      if (!sourcePos || !targetPos) continue;

      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
    }

    ctx.stroke();
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
    resetPillarFilter();

    const stagger = layoutName === 'genesis' ? GENESIS_PARTICLE_STAGGER : PARTICLE_STAGGER;
    particles.forEach((p, i) => {
      p.delay = instant ? 0 : i * stagger;
      p.startTime = 0;
    });

    let layoutResult = null;

    if (layoutName === 'network') {
      if (!networkPositions) precomputeNetworkLayout();
      layoutResult = window.IDELayouts.network(particles, width, height, { networkPositions });
      applyNetworkHighlighting();
    } else if (layoutName === 'genesis') {
      // Genesis reuses the timeline layout with slower progressive reveal
      layoutResult = window.IDELayouts.timeline(particles, width, height);
    } else {
      const fn = window.IDELayouts[layoutName];
      if (fn) layoutResult = fn(particles, width, height);
    }

    // Store map projection for base map rendering
    if (layoutName === 'map' && layoutResult && layoutResult.projection) {
      mapProjection = layoutResult.projection;
      window.IDECanvasUtils.invalidateMapCache();
    } else if (layoutName !== 'map') {
      mapProjection = null;
    }

    clearOverlays();
    drawAnnotations(layoutName, layoutResult);
  }

  // ─── Annotation Rendering ─────────────────────────
  function drawAnnotations(layoutName, layoutResult) {
    if (!window.IDEAnnotations) return;
    window.IDEAnnotations.clear();

    if ((layoutName === 'timeline' || layoutName === 'genesis') && layoutResult && layoutResult.scales) {
      drawTimelineAnnotations(layoutResult);
    } else if (layoutName === 'clusters' && layoutResult && layoutResult.clusterPositions) {
      drawClusterAnnotations(layoutResult);
    } else if (layoutName === 'network') {
      drawNetworkAnnotations();
    } else if (layoutName === 'map' && layoutResult) {
      drawMapAnnotations(layoutResult);
    }
  }

  function drawTimelineAnnotations(result) {
    const { scales, margin, undated } = result;
    var pillarColors = window.IDEData.PILLAR_COLORS;
    var pillarLabels = window.IDEData.PILLAR_LABELS || {};
    var lang = (window.IDENarrative && window.IDENarrative.getLanguage()) || 'de';

    // X axis (years)
    window.IDEAnnotations.drawXAxis(scales.x, width, height, {
      ticks: d3.timeYear.every(2),
      tickFormat: d3.timeFormat('%Y'),
      margin: { bottom: margin.bottom }
    });

    // Y axis (semantic pillar labels with colours)
    var domain = scales.y.domain();
    var labels = [];
    domain.forEach(function (pillar) {
      var bandY = scales.y(pillar);
      var bandH = scales.y.bandwidth();
      var labelObj = pillarLabels[pillar];
      var text = labelObj ? (labelObj[lang] || labelObj.short || pillar) : pillar;
      labels.push({
        text: text,
        x: margin.left - 8,
        y: bandY + bandH / 2,
        anchor: 'end',
        className: 'annotation-label-pillar',
        color: pillarColors[pillar] || 'rgba(0,0,0,0.4)'
      });
    });
    window.IDEAnnotations.drawLabels(labels);

    // Gridlines
    window.IDEAnnotations.drawGridlines(scales.x, width, height, 'vertical', {
      ticks: d3.timeYear.every(2),
      margin: { top: margin.top, bottom: margin.bottom }
    });

    // Undated cluster label
    if (undated && undated.count > 0) {
      var lang = (window.IDENarrative && window.IDENarrative.getLanguage()) || 'de';
      var text = lang === 'de'
        ? 'Ohne Datum (' + undated.count + ')'
        : 'Undated (' + undated.count + ')';
      window.IDEAnnotations.drawLabels([{
        text: text,
        x: undated.x,
        y: undated.y - 40,
        anchor: 'middle',
        fontSize: '0.6rem'
      }]);
    }
  }

  function drawClusterAnnotations(result) {
    var lang = (window.IDENarrative && window.IDENarrative.getLanguage()) || 'de';
    var pillarColors = window.IDEData.PILLAR_COLORS;
    var pillarLabels = window.IDEData.PILLAR_LABELS || {};
    var positions = result.clusterPositions;
    var groups = result.groups;

    var labels = [];
    Object.keys(positions).forEach(function (pillar) {
      var pos = positions[pillar];
      var count = groups[pillar] || 0;
      if (count === 0) return;

      var labelObj = pillarLabels[pillar];
      var text = labelObj ? (labelObj[lang] || pillar) : pillar;

      // Large count number above cluster
      labels.push({
        text: String(count),
        x: width * pos.x,
        y: height * pos.y - 55,
        anchor: 'middle',
        className: 'annotation-label-lg',
        color: pillarColors[pillar] || 'rgba(0,0,0,0.2)'
      });

      // Pillar name below count
      labels.push({
        text: text,
        x: width * pos.x,
        y: height * pos.y - 35,
        anchor: 'middle',
        className: 'annotation-label-pillar',
        color: pillarColors[pillar] || 'rgba(0,0,0,0.4)'
      });
    });
    window.IDEAnnotations.drawLabels(labels);
  }


  function drawNetworkAnnotations() {
    if (!networkPositions) return;
    var coreResearchers = (window.IDEData && window.IDEData.CORE_RESEARCHERS) || [];
    if (coreResearchers.length === 0) return;

    // For each core researcher, compute centroid of their items
    var creatorItems = {};
    particles.forEach(function (p) {
      p.data.creators.forEach(function (name) {
        if (coreResearchers.indexOf(name) === -1) return;
        if (!creatorItems[name]) creatorItems[name] = [];
        creatorItems[name].push(p);
      });
    });

    var labels = [];
    Object.keys(creatorItems).forEach(function (name) {
      var items = creatorItems[name];
      var avgX = d3.mean(items, function (p) { return p.targetX; });
      var avgY = d3.mean(items, function (p) { return p.targetY; });
      // Use last name only for compact labels
      var shortName = name.split(' ').pop();
      labels.push({
        text: shortName,
        x: avgX,
        y: avgY - 14,
        anchor: 'middle',
        className: 'annotation-label',
        fontSize: '0.65rem',
        color: 'rgba(0,0,0,0.5)'
      });
    });
    window.IDEAnnotations.drawLabels(labels);
  }

  function drawMapAnnotations(result) {
    if (!result || !result.projection) return;

    var projection = result.projection;
    var placeCounts = result.placeCounts || {};

    // City labels for places with ≥2 items
    var labels = [];
    Object.keys(placeCounts).forEach(function (place) {
      var info = placeCounts[place];
      if (info.count < 2 || !info.coords) return;
      var projected = projection(info.coords);
      if (!projected) return;
      labels.push({
        text: place + ' (' + info.count + ')',
        x: projected[0] + 12,
        y: projected[1] - 8,
        anchor: 'start',
        fontSize: '0.6rem',
        color: 'rgba(0,0,0,0.4)'
      });
    });
    window.IDEAnnotations.drawLabels(labels);

    // Without coords label
    if (result.withoutCoordsCount > 0) {
      var lang = (window.IDENarrative && window.IDENarrative.getLanguage()) || 'de';
      var text = lang === 'de'
        ? 'Ohne Ortsangabe (' + result.withoutCoordsCount + ')'
        : 'No location (' + result.withoutCoordsCount + ')';
      window.IDEAnnotations.drawLabels([{
        text: text,
        x: width * 0.85,
        y: height * 0.85 - 35,
        anchor: 'middle',
        fontSize: '0.6rem',
        color: 'rgba(0,0,0,0.25)'
      }]);
    }
  }

  // ─── Network Highlighting ──────────────────────────
  function applyNetworkHighlighting() {
    var coreResearchers = (window.IDEData && window.IDEData.CORE_RESEARCHERS) || [];
    if (coreResearchers.length === 0) return;

    particles.forEach(function (p) {
      var isCore = p.data.creators.some(function (name) {
        return coreResearchers.indexOf(name) !== -1;
      });
      if (isCore) {
        p.targetOpacity = 1;
        p.baseRadius = p.data.radius;
      } else {
        p.targetOpacity = 0.3;
        p.baseRadius = p.data.radius * 0.6;
      }
    });
  }

  // ─── Overlay Management ───────────────────────────
  function clearOverlays() {
    overlayElements.forEach(el => el.remove());
    overlayElements = [];
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

  // ─── Scrollytelling Pillar Filter ─────────────────
  let activePillarFilter = 'all';

  function setupScrollyFilter() {
    document.querySelectorAll('.sf-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.sf-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activePillarFilter = btn.dataset.pillar;
        applyPillarFilter();
      });
    });
  }

  function applyPillarFilter() {
    particles.forEach(function (p) {
      if (activePillarFilter === 'all' || p.data.pillar === activePillarFilter) {
        // Don't override network highlighting
        if (currentLayout !== 'network') {
          p.targetOpacity = 1;
          p.baseRadius = p.data.radius;
        }
      } else {
        p.targetOpacity = 0.08;
        p.baseRadius = p.data.radius * 0.5;
      }
    });
  }

  function resetPillarFilter() {
    activePillarFilter = 'all';
    document.querySelectorAll('.sf-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.pillar === 'all');
    });
  }

  // ─── Public API ───────────────────────────────────
  window.IDEParticles = { init, applyLayout };

})();
