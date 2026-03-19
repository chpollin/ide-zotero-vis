/**
 * IDE Data Story - Shared Canvas Utilities
 * Render loop, hit detection, and tooltip helpers used by both
 * the scrollytelling particle engine and the interactive explorer.
 */

(function () {
  'use strict';

  const TWO_PI = Math.PI * 2;

  // ─── Default Constants ──────────────────────────────
  const LERP_SPEED = 0.06;
  const OPACITY_SPEED = 0.08;
  const RADIUS_SPEED = 0.1;
  const LERP_THRESHOLD = 0.5;
  const HIT_PADDING = 4;
  const MIN_VISIBLE_OPACITY = 0.1;

  // ─── Lerp Pass ──────────────────────────────────────

  function lerpParticles(particles, now, opts) {
    const speed = (opts && opts.lerpSpeed) || LERP_SPEED;
    const opSpeed = (opts && opts.opacitySpeed) || OPACITY_SPEED;
    const rSpeed = (opts && opts.radiusSpeed) || RADIUS_SPEED;
    const threshold = opts && opts.threshold !== undefined ? opts.threshold : LERP_THRESHOLD;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (p.targetOpacity > 0 && p.opacity < 0.01 && p.startTime === 0) {
        p.startTime = now;
      }
      if (p.startTime > 0 && now - p.startTime < p.delay) continue;

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      if (threshold > 0 && Math.abs(dx) <= threshold && Math.abs(dy) <= threshold) {
        p.x = p.targetX;
        p.y = p.targetY;
      } else {
        p.x += dx * speed;
        p.y += dy * speed;
      }

      const dOp = p.targetOpacity - p.opacity;
      if (Math.abs(dOp) > 0.01) {
        p.opacity += dOp * opSpeed;
      } else {
        p.opacity = p.targetOpacity;
      }

      const dR = p.baseRadius - p.radius;
      if (Math.abs(dR) > 0.1) {
        p.radius += dR * rSpeed;
      }
    }
  }

  // ─── Shape Drawing Helpers ─────────────────────────

  function tracePath(ctx, x, y, r, shape) {
    switch (shape) {
      case 'square':
        var s = r * 0.85; // slightly smaller than radius for visual balance
        ctx.rect(x - s, y - s, s * 2, s * 2);
        break;
      case 'diamond':
        var d = r * 1.1;
        ctx.moveTo(x, y - d);
        ctx.lineTo(x + d, y);
        ctx.lineTo(x, y + d);
        ctx.lineTo(x - d, y);
        ctx.closePath();
        break;
      case 'triangle':
        var t = r * 1.15;
        ctx.moveTo(x, y - t);
        ctx.lineTo(x + t * 0.866, y + t * 0.5);
        ctx.lineTo(x - t * 0.866, y + t * 0.5);
        ctx.closePath();
        break;
      default: // 'circle'
        ctx.arc(x, y, r, 0, TWO_PI);
        break;
    }
  }

  // ─── Draw Pass (Fill + Stroke) ──────────────────────

  function drawParticles(ctx, particles) {
    // Fill pass with shadow
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowOffsetY = 1;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0) continue;
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      tracePath(ctx, p.x, p.y, p.radius, p.shape);
      ctx.fill();
    }

    // Stroke pass without shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0) continue;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      tracePath(ctx, p.x, p.y, p.radius, p.shape);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  // ─── Hit Detection ─────────────────────────────────

  function findHoveredParticle(particles, mx, my, opts) {
    const pad = (opts && opts.hitPadding) || HIT_PADDING;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p.opacity < MIN_VISIBLE_OPACITY) continue;
      const dx = mx - p.x;
      const dy = my - p.y;
      const hitR = p.radius + pad;
      if (dx * dx + dy * dy < hitR * hitR) {
        return p;
      }
    }
    return null;
  }

  // ─── Tooltip Content ────────────────────────────────

  function createTooltipContent(data) {
    var lang = (window.IDENarrative && window.IDENarrative.getLanguage()) || 'de';

    // Semantic type label
    var TYPE_LABELS = (window.IDELayouts && window.IDELayouts.TYPE_LABELS) || {};
    var typeObj = TYPE_LABELS[data.type];
    var typeLabel = typeObj ? (typeObj[lang] || typeObj.de) : data.type.replace(/([A-Z])/g, ' $1').trim();

    // Semantic pillar label
    var PILLAR_LABELS = (window.IDEData && window.IDEData.PILLAR_LABELS) || {};
    var pillarObj = PILLAR_LABELS[data.pillar];
    var pillarLabel = pillarObj ? (pillarObj[lang] || data.pillar) : (data.pillar || '');

    var meta = typeLabel;
    if (pillarLabel) meta += ' · ' + pillarLabel;
    if (data.year) meta += ' · ' + data.year;

    return '<div>' + data.title + '</div>' +
      '<div class="tooltip-type">' + meta + '</div>';
  }

  // ─── Network Line Drawing ─────────────────────────

  function drawNetworkLines(ctx, links, particleMap, opts) {
    if (!links || links.length === 0) return;
    opts = opts || {};
    var opacity = opts.opacity || 0.15;
    var lineWidth = opts.lineWidth || 0.5;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, ' + opacity + ')';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var s = particleMap[link.source];
      var t = particleMap[link.target];
      if (!s || !t) continue;
      if (s.opacity < MIN_VISIBLE_OPACITY || t.opacity < MIN_VISIBLE_OPACITY) continue;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  // ─── Base Map ──────────────────────────────────────

  let mapTopology = null;
  let mapOffscreenCanvas = null;
  let mapCacheKey = '';

  function loadMapTopology() {
    if (mapTopology) return Promise.resolve(mapTopology);
    return fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(function (res) { return res.json(); })
      .then(function (topo) {
        mapTopology = topo;
        return topo;
      })
      .catch(function (err) {
        console.warn('[IDE] Failed to load map topology:', err);
        return null;
      });
  }

  function drawBaseMap(ctx, projection, w, h) {
    if (!mapTopology) return;

    var key = w + 'x' + h;
    if (mapOffscreenCanvas && mapCacheKey === key) {
      // Draw at CSS coordinates (ctx already has DPR transform)
      ctx.drawImage(mapOffscreenCanvas, 0, 0, w, h);
      return;
    }

    // Render at 1x scale — the main canvas ctx already handles DPR
    var offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    var offCtx = offscreen.getContext('2d');

    var countries = topojson.feature(mapTopology, mapTopology.objects.countries);
    var path = d3.geoPath().projection(projection).context(offCtx);

    // Country fills
    offCtx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    offCtx.beginPath();
    path(countries);
    offCtx.fill();

    // Country borders
    var borders = topojson.mesh(mapTopology, mapTopology.objects.countries, function (a, b) { return a !== b; });
    offCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    offCtx.lineWidth = 0.5;
    offCtx.beginPath();
    path(borders);
    offCtx.stroke();

    mapOffscreenCanvas = offscreen;
    mapCacheKey = key;

    ctx.drawImage(offscreen, 0, 0, w, h);
  }

  function invalidateMapCache() {
    mapOffscreenCanvas = null;
    mapCacheKey = '';
  }

  // ─── Export ─────────────────────────────────────────

  window.IDECanvasUtils = {
    lerpParticles,
    drawParticles,
    drawNetworkLines,
    findHoveredParticle,
    createTooltipContent,
    loadMapTopology,
    drawBaseMap,
    invalidateMapCache
  };

})();
