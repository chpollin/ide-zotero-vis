/**
 * IDE Data Story - SVG Annotation Layer
 * Provides axes, gridlines, and labels rendered into the #annotation-layer SVG.
 * Used by all views to add readable context to the canvas particle engine.
 */

(function () {
  'use strict';

  function getSvg() {
    return d3.select('#annotation-layer');
  }

  function getLang() {
    return (window.IDENarrative && window.IDENarrative.getLanguage()) || 'de';
  }

  // ─── Clear ────────────────────────────────────────

  function clear() {
    getSvg().selectAll('*').remove();
  }

  // ─── X Axis ───────────────────────────────────────

  /**
   * @param {d3.Scale} scale - D3 scale for the x-axis
   * @param {number} w - canvas width
   * @param {number} h - canvas height
   * @param {object} opts
   *   opts.ticks - D3 tick specifier (e.g. d3.timeYear.every(2))
   *   opts.tickFormat - D3 format function
   *   opts.margin - { bottom } offset from canvas bottom
   *   opts.label - bilingual label { de, en }
   */
  function drawXAxis(scale, w, h, opts) {
    opts = opts || {};
    const svg = getSvg();
    const margin = opts.margin || { bottom: 30 };
    const y = h - margin.bottom;

    const axis = d3.axisBottom(scale)
      .tickSize(4)
      .tickPadding(6);

    if (opts.ticks) axis.ticks(opts.ticks);
    if (opts.tickFormat) axis.tickFormat(opts.tickFormat);
    if (opts.tickValues) axis.tickValues(opts.tickValues);

    const g = svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0, ${y})`)
      .call(axis);

    // Style: hide domain line, keep ticks subtle
    g.select('.domain').attr('stroke', 'rgba(0,0,0,0.1)');
    g.selectAll('.tick line').attr('stroke', 'rgba(0,0,0,0.1)');
    g.selectAll('.tick text')
      .attr('fill', 'rgba(0,0,0,0.35)')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '0.65rem');

    if (opts.label) {
      const lang = getLang();
      const text = typeof opts.label === 'object' ? (opts.label[lang] || opts.label.de) : opts.label;
      svg.append('text')
        .attr('class', 'annotation-label')
        .attr('x', w / 2)
        .attr('y', y + 28)
        .attr('text-anchor', 'middle')
        .text(text);
    }
  }

  // ─── Y Axis ───────────────────────────────────────

  /**
   * @param {d3.Scale} scale - D3 band scale for the y-axis
   * @param {number} w - canvas width
   * @param {number} h - canvas height
   * @param {object} opts
   *   opts.margin - { left } offset
   *   opts.labels - Map of domain value → { de, en } display label
   */
  function drawYAxis(scale, w, h, opts) {
    opts = opts || {};
    const svg = getSvg();
    const margin = opts.margin || { left: 0 };
    const labels = opts.labels || {};
    const lang = getLang();

    const domain = scale.domain();

    domain.forEach(function (key) {
      const y = scale(key);
      if (y === undefined) return;
      const bandH = scale.bandwidth();
      const labelObj = labels[key];
      const text = labelObj
        ? (typeof labelObj === 'object' ? (labelObj[lang] || labelObj.de) : labelObj)
        : key;

      svg.append('text')
        .attr('class', 'axis-y-label')
        .attr('x', margin.left + 8)
        .attr('y', y + bandH / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('fill', 'rgba(0,0,0,0.3)')
        .style('font-family', 'Inter, sans-serif')
        .style('font-size', '0.6rem')
        .style('font-weight', '500')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.05em')
        .text(text);
    });
  }

  // ─── Gridlines ────────────────────────────────────

  /**
   * @param {d3.Scale} scale - D3 scale
   * @param {number} w - canvas width
   * @param {number} h - canvas height
   * @param {'vertical'|'horizontal'} orientation
   * @param {object} opts
   *   opts.margin - { top, bottom, left, right }
   *   opts.ticks - D3 tick specifier
   */
  function drawGridlines(scale, w, h, orientation, opts) {
    opts = opts || {};
    const svg = getSvg();
    const margin = opts.margin || { top: 0, bottom: 30, left: 0, right: 0 };

    let tickValues;
    if (opts.ticks && scale.ticks) {
      tickValues = scale.ticks(opts.ticks);
    } else if (scale.ticks) {
      tickValues = scale.ticks();
    } else if (scale.domain) {
      tickValues = scale.domain();
    }

    const g = svg.append('g').attr('class', 'gridlines');

    tickValues.forEach(function (val) {
      if (orientation === 'vertical') {
        const x = scale(val);
        if (x === undefined || x === null) return;
        g.append('line')
          .attr('class', 'gridline')
          .attr('x1', x).attr('x2', x)
          .attr('y1', margin.top)
          .attr('y2', h - margin.bottom);
      } else {
        const y = scale(val);
        if (y === undefined || y === null) return;
        g.append('line')
          .attr('class', 'gridline')
          .attr('x1', margin.left).attr('x2', w - margin.right)
          .attr('y1', y).attr('y2', y);
      }
    });
  }

  // ─── Labels (general purpose) ─────────────────────

  /**
   * @param {Array} labels - Array of { text, x, y, anchor, className, color, fontSize }
   */
  function drawLabels(labels) {
    const svg = getSvg();

    labels.forEach(function (item) {
      const el = svg.append('text')
        .attr('class', item.className || 'annotation-label')
        .attr('x', item.x)
        .attr('y', item.y)
        .attr('text-anchor', item.anchor || 'middle')
        .attr('dy', '0.35em')
        .text(item.text);

      if (item.color) el.attr('fill', item.color);
      if (item.fontSize) el.style('font-size', item.fontSize);
    });
  }

  // ─── Bilingual Labels ────────────────────────────

  /**
   * Like drawLabels but picks text based on current language.
   * @param {Array} labels - Array of { de, en, x, y, anchor, className, color, fontSize }
   */
  function drawBilingualLabels(labels) {
    const lang = getLang();
    drawLabels(labels.map(function (item) {
      return Object.assign({}, item, {
        text: (typeof item.de === 'string') ? (item[lang] || item.de) : item.text
      });
    }));
  }

  // ─── Export ───────────────────────────────────────

  window.IDEAnnotations = {
    clear: clear,
    drawXAxis: drawXAxis,
    drawYAxis: drawYAxis,
    drawGridlines: drawGridlines,
    drawLabels: drawLabels,
    drawBilingualLabels: drawBilingualLabels
  };

})();
