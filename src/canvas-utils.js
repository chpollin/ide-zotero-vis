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

  // ─── Draw Pass (Fill + Stroke) ──────────────────────

  function drawParticles(ctx, particles) {
    // Fill pass with shadow
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowOffsetY = 1;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0) continue;
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, TWO_PI);
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
      ctx.arc(p.x, p.y, p.radius, 0, TWO_PI);
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
    const typeLabel = data.type.replace(/([A-Z])/g, ' $1').trim();
    return `<div>${data.title}</div>` +
      `<div class="tooltip-type">${typeLabel}${data.year ? ` \u00b7 ${data.year}` : ''}</div>`;
  }

  // ─── Export ─────────────────────────────────────────

  window.IDECanvasUtils = {
    lerpParticles,
    drawParticles,
    findHoveredParticle,
    createTooltipContent
  };

})();
