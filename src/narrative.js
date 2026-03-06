/**
 * IDE Data Story - Narrative Controller
 * Language switching and text rendering.
 */

(function () {
  'use strict';

  let currentLang = 'de';

  function init() {
    const saved = localStorage.getItem('ide-lang');
    if (saved === 'de' || saved === 'en') {
      currentLang = saved;
    }

    setLanguage(currentLang);

    const toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        currentLang = currentLang === 'de' ? 'en' : 'de';
        setLanguage(currentLang);
      });
    }
  }

  function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('ide-lang', lang);

    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = lang === 'de' ? 'EN' : 'DE';
  }

  function getLanguage() {
    return currentLang;
  }

  window.IDENarrative = { init, setLanguage, getLanguage };

})();
