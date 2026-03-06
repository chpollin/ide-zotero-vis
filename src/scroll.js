/**
 * IDE Data Story - Scroll Controller
 * Scrollama-based step detection with native CSS sticky layout.
 * Orchestrates layout transitions based on scroll position.
 */

(function () {
  'use strict';

  let scroller = null;

  const LAYOUT_MAP = {
    'intro': 'genesis',
    'timeline': 'timeline',
    'pillars': 'clusters',
    'network': 'network',
    'geography': 'map',
    'explorer': 'cloud'
  };

  function init() {
    scroller = scrollama();
    scroller
      .setup({
        step: '#steps .step',
        offset: 0.5,
        progress: true
      })
      .onStepEnter(handleStepEnter)
      .onStepExit(handleStepExit);

    window.addEventListener('scroll', updateProgressBar);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        scroller.resize();
      }, 250);
    });
  }

  function handleStepEnter({ element, direction }) {
    const step = element.dataset.step;

    document.querySelectorAll('#steps .step').forEach(s => {
      s.classList.remove('is-active');
    });
    element.classList.add('is-active');

    if (step === 'intro') {
      element.classList.remove('is-exited');
    }

    // Scroll indicator: show on intro, hide on other steps
    const indicator = document.getElementById('scroll-indicator');
    if (indicator) {
      if (step === 'intro') {
        indicator.classList.add('visible');
      } else {
        indicator.classList.remove('visible');
      }
    }

    const layout = LAYOUT_MAP[step];
    if (layout && window.IDEParticles) {
      window.IDEParticles.applyLayout(layout, false);
    }

    if (step === 'explorer') {
      activateExplorer();
    }
  }

  function handleStepExit({ element, direction }) {
    const step = element.dataset.step;

    if (step === 'intro') {
      element.classList.add('is-exited');
    }

    if (step === 'explorer' && direction === 'up') {
      deactivateExplorer();
    }
  }

  function activateExplorer() {
    const section = document.getElementById('explorer-section');
    if (section) {
      section.classList.remove('hidden');
      document.dispatchEvent(new CustomEvent('explorer-activate'));
    }
  }

  function deactivateExplorer() {
    const section = document.getElementById('explorer-section');
    if (section) {
      section.classList.add('hidden');
      document.dispatchEvent(new CustomEvent('explorer-deactivate'));
    }
  }

  function updateProgressBar() {
    const scrolly = document.getElementById('scrolly');
    if (!scrolly) return;

    const rect = scrolly.getBoundingClientRect();
    const scrollHeight = scrolly.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, -rect.top / scrollHeight));

    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = `${progress * 100}%`;
  }

  window.IDEScroll = { init };

})();
