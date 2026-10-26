(function () {
  'use strict';

  var chapters = Array.prototype.slice.call(document.querySelectorAll('.m-chapter'));
  var media = Array.prototype.slice.call(document.querySelectorAll('.m-stage-media'));
  var spriteSets = media.map(function (item) { return Array.prototype.slice.call(item.querySelectorAll('.m-sprite')); });
  var journey = document.querySelector('.m-journey');
  var index = document.getElementById('m-stage-index');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ticking = false;
  var centers = [];
  var lastActive = -1;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function measure() {
    centers = chapters.map(function (chapter) {
      var box = chapter.getBoundingClientRect();
      return window.scrollY + box.top + box.height / 2;
    });
    update();
  }

  function update() {
    ticking = false;
    if (!journey || !centers.length) return;
    var focus = window.scrollY + window.innerHeight * (window.innerWidth <= 700 ? .65 : .52);
    var position = 0;
    if (focus >= centers[centers.length - 1]) position = centers.length - 1;
    else if (focus > centers[0]) {
      for (var i = 0; i < centers.length - 1; i++) {
        if (focus < centers[i + 1]) {
          position = i + (focus - centers[i]) / (centers[i + 1] - centers[i]);
          break;
        }
      }
    }

    var active = Math.round(position);
    if (active !== lastActive) {
      lastActive = active;
      index.innerHTML = String(active + 1).padStart(2, '0') + ' <span>/ 05</span>';
      journey.setAttribute('data-active', chapters[active].getAttribute('data-chapter'));
    }

    media.forEach(function (item, i) {
      var delta = position - i;
      var weight = reduce.matches ? (i === active ? 1 : 0) : clamp(1 - Math.abs(delta) * 2, 0, 1);
      item.style.opacity = weight.toFixed(3);
      item.style.visibility = weight > .001 ? 'visible' : 'hidden';
      item.style.transform = reduce.matches ? 'none' :
        'translate3d(' + (-delta * 12).toFixed(1) + 'px,' + (delta * -35).toFixed(1) + 'px,0) scale(' + (.91 + weight * .09).toFixed(3) + ')';
      spriteSets[i].forEach(function (sprite) {
        var depth = +(sprite.getAttribute('data-depth') || .5);
        sprite.style.transform = reduce.matches ? 'none' :
          'translate3d(' + (-delta * depth * 32).toFixed(1) + 'px,' + (delta * depth * 20).toFixed(1) + 'px,0) rotate(' + (delta * depth * 2.5).toFixed(2) + 'deg)';
      });
    });
  }

  function requestUpdate() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  if (journey && chapters.length === media.length) {
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    if (reduce.addEventListener) reduce.addEventListener('change', requestUpdate);
    window.addEventListener('load', measure);
    measure();
  }

  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add('m-no-gsap');
    return;
  }
  if (reduce.matches) return;
  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  gsap.from('.m-hero-copy > *', {
    y: 24, autoAlpha: 0, duration: 1, stagger: .09, ease: 'power3.out', delay: .08
  });
  gsap.from('.m-hero-pack', {
    x: 70, y: 80, rotation: 5, scale: .9, autoAlpha: 0,
    duration: 1.5, ease: 'power3.out', delay: .25
  });
  gsap.to('.m-hero-pack', {
    yPercent: -14, rotation: -1, ease: 'none',
    scrollTrigger: { trigger: '.m-hero', start: 'top top', end: 'bottom top', scrub: .5 }
  });
  gsap.to('.m-halo', {
    scale: 1.13, rotation: 8, ease: 'none',
    scrollTrigger: { trigger: '.m-hero', start: 'top top', end: 'bottom top', scrub: .5 }
  });

  gsap.fromTo('.m-service-image img', { scale: 1.08, yPercent: -3 }, {
    scale: 1.08, yPercent: 3, ease: 'none',
    scrollTrigger: { trigger: '.m-service', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  window.addEventListener('load', function () { window.ScrollTrigger.refresh(); measure(); });
})();
