/* Cabecera común: centra el menú en la sección actual cuando no cabe entero (móvil y tablet). */
(function () {
  'use strict';
  function centerNav() {
    var nav = document.querySelector('.site-header nav');
    var cur = nav && nav.querySelector('[aria-current]');
    if (!cur || nav.scrollWidth <= nav.clientWidth) return;
    var offset = cur.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
    nav.scrollLeft = offset - (nav.clientWidth - cur.offsetWidth) / 2;
  }
  centerNav();
  window.addEventListener('load', centerNav);
  window.addEventListener('resize', centerNav);
})();
