(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dbg = location.search;
  window.addEventListener('error', function (e) { window.__err = e.message + ' @' + e.lineno; });

  /* ---------- funciones que no dependen de GSAP ---------- */
  var clock = document.getElementById('clock');
  function tick() {
    try { clock.textContent = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(new Date()); } catch (e) {}
  }
  if (clock) { tick(); setInterval(tick, 30000); }

  var sel = document.getElementById('loc'), res = document.getElementById('res');
  if (sel && res) {
    sel.addEventListener('change', function () {
      var v = sel.value, name = sel.options[sel.selectedIndex].text;
      res.className = 'result';
      if (!v) res.innerHTML = '<p>Distancia aproximada por carretera desde Medina del Campo.</p>';
      else if (v === 'otra') res.innerHTML = '<p>Escríbenos con el nombre de tu localidad y te confirmamos si llegamos.</p>';
      else {
        res.className = 'result yes';
        res.innerHTML = '<strong>' + v + ' km</strong><p>' + name + ' está dentro de la zona de reparto.</p><small>Distancia aproximada por carretera. Confirma los días de reparto en el formulario.</small>';
      }
    });
  }

  var f = document.getElementById('f'), st = document.getElementById('st');
  var EMAIL = ''; // pendiente: correo de la empresa
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.nombre.value.trim() || !f.ok.checked) { st.textContent = 'Indica tu nombre y acepta el consentimiento para continuar.'; return; }
      if (!EMAIL) { st.textContent = 'El envío del formulario está en preparación.'; return; }
      var body = 'Nombre: ' + f.nombre.value + '\nContacto: ' + f.contacto.value + '\n\n' + f.mensaje.value;
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Consulta desde la web') + '&body=' + encodeURIComponent(body);
    });
  }

  var top = document.querySelector('.top');
  function solid() { top.classList.toggle('solid', window.scrollY > window.innerHeight * 0.8); }
  window.addEventListener('scroll', solid, { passive: true });
  solid();



  /* ---------- vídeo de YouTube ligado al scroll ---------- */
  var ytReady = null;
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(function (resolve) {
      if (window.YT && window.YT.Player) return resolve();
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) prev(); resolve(); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
    return ytReady;
  }
  function makeVideo(scrubbed) {
    var host = document.getElementById('vid-player');
    if (!host) return Promise.resolve(null);
    var frame = host.parentNode, start = +host.dataset.start || 0, id = host.dataset.id;
    return loadYT().then(function () {
      return new Promise(function (resolve) {
        var p = new window.YT.Player('vid-player', {
          videoId: id,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { controls: 1, modestbranding: 1, rel: 0, playsinline: 1, start: start, fs: 1, iv_load_policy: 3 },
          events: {
            onReady: function (e) {
              frame.classList.add('vid-ready');
              resolve(e.target);
            },
            onError: function () { resolve(null); }
          }
        });
      });
    });
  }

  function start() {
    if (!window.gsap || !window.ScrollTrigger || reduce) { html.classList.add('static'); makeVideo(false); return; }
    var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    html.classList.add('gsap');
    ScrollTrigger.config({ ignoreMobileResize: true });

    // portada: entrada lenta de la fotografía y paralaje al salir
    gsap.fromTo('.hero-bg', { scale: 1.16 }, { scale: 1.02, duration: 2.8, ease: 'power3.out' });
    gsap.from('.hero h1, .hero-sub, .hero .actions, .hero-cap', { y: 36, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, delay: 0.25 });
    gsap.to('.hero-bg', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-in', { yPercent: -10, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: true } });

    // revelados con retardo escalonado
    gsap.utils.toArray('[data-r]').forEach(function (el) { el.removeAttribute('data-r'); });
    ScrollTrigger.batch('.reparto-copy, .con-sub, form', {
      start: 'top 88%', once: true,
      onEnter: function (b) { gsap.fromTo(b, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true, onComplete: function () { gsap.set(b, { clearProps: 'transform' }); } }); }
    });
    gsap.set('.reparto-copy, .con-sub, form', { autoAlpha: 0 });

    // cifras
    gsap.utils.toArray('[data-count]').forEach(function (b) {
      var end = +b.dataset.count, o = { v: 0 };
      ScrollTrigger.create({ trigger: b, start: 'top 85%', once: true, onEnter: function () {
        gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: function () { b.textContent = Math.round(o.v); } });
      } });
      b.textContent = '0';
    });

    // titulares grandes: entrada por líneas
    gsap.utils.toArray('.big').forEach(function (h) {
      if (h.closest('.cafe') || h.closest('.drinks')) return;
      gsap.from(h, { y: 60, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });

    var mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 1001px)', mob: '(max-width: 1000px)' }, function (ctx) {
      var mob = ctx.conditions.mob;

      /* café: pantalla fija con caída de granos reales (recortes fotográficos) y profundidad de campo */
      var rain = document.querySelector('.rain');
      rain.innerHTML = '';
      var N = mob ? 16 : 34, beans = [];
      var seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      for (var i = 0; i < N; i++) {
        var depth = rnd();                    // 0 lejos, 1 cerca
        var size = (mob ? 46 : 54) + depth * (mob ? 120 : 190);
        var img = document.createElement('img');
        img.src = 'assets/grano-recortado.png'; img.alt = ''; img.className = 'bean';
        img.width = 438; img.height = 398;
        img.style.width = size + 'px'; img.style.height = 'auto';
        var blur = depth > 0.82 ? (depth - 0.82) * 36 : (depth < 0.25 ? (0.25 - depth) * 14 : 0);
        img.style.filter = 'drop-shadow(0 ' + (10 + depth * 22) + 'px ' + (8 + depth * 14) + 'px rgba(0,0,0,.45)) blur(' + blur.toFixed(1) + 'px) brightness(' + (0.7 + depth * 0.35).toFixed(2) + ')'; // taste-skill-ignore: sombra física del grano
        rain.appendChild(img);
        beans.push({ el: img, size: size, depth: depth, x: rnd(), rot: rnd() * 360, spin: (rnd() < 0.5 ? -1 : 1) * (180 + rnd() * 420), flip: rnd() < 0.5 ? -1 : 1, start: rnd() * 5.4, dur: 5.2 - depth * 2.6 });
      }
      var tl = gsap.timeline({ scrollTrigger: { trigger: '.cafe', start: 'top top', end: '+=' + (mob ? 220 : 280) + '%', pin: '.cafe-stage', scrub: 0.9, invalidateOnRefresh: true } });
      tl.fromTo('.cafe-bg', { scale: 1.3, filter: 'brightness(.28) saturate(1)' }, { scale: 1.02, filter: 'brightness(.55) saturate(1.1)', duration: 10, ease: 'none' }, 0);
      beans.forEach(function (b) {
        var W = function () { return rain.clientWidth; }, H = function () { return rain.clientHeight; };
        gsap.set(b.el, { x: function () { return b.x * (W() - b.size * 0.4) - b.size * 0.2; }, scaleX: b.flip, rotation: b.rot });
        tl.fromTo(b.el, { y: function () { return -b.size * 1.4; } }, { y: function () { return H() + b.size * 0.4; }, rotation: b.rot + b.spin, ease: 'none', duration: b.dur }, b.start);
      });
      tl.from('.cafe-copy .big', { y: 70, autoAlpha: 0, duration: 1.6, ease: 'power3.out' }, 0.5);
      tl.from('.cafe-copy p', { y: 40, autoAlpha: 0, duration: 1.3, ease: 'power3.out' }, 1.2);
      tl.from('.cafe-copy .actions', { y: 30, autoAlpha: 0, duration: 1.1, ease: 'power3.out' }, 1.8);
      tl.from('.cafe-card', { x: mob ? 0 : 120, y: mob ? -40 : 0, autoAlpha: 0, rotation: mob ? 0 : 4, duration: 1.6, ease: 'power3.out' }, 3.4);
      tl.fromTo('.cafe-logo', { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'power3.out' }, 9.6);
      tl.to({}, { duration: 1.2 });
      var dc = (/[?&]cafe=([0-9.]+)/.exec(dbg) || [])[1];
      if (dc) { // depuración: muestra el café en un punto exacto de la línea de tiempo
        var st = document.createElement('style');
        st.textContent = 'main>section:not(.cafe),.top,.foot{display:none!important}';
        document.head.appendChild(st);
        tl.scrollTrigger.kill(true); tl.progress(parseFloat(dc)); }

      /* zona de reparto: paralaje suave */
      gsap.fromTo('.reparto-photo img', { scale: 1.2, yPercent: -6 }, { scale: 1.02, yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.reparto-photo', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // aparición progresiva: cada bloque entra al ritmo del scroll (y se deshace al subir)
    try { (function () {
      function rise(targets, trig, o) {
        o = o || {};
        gsap.utils.toArray(targets).forEach(function (el, i) {
          gsap.fromTo(el, { y: o.y || 90, autoAlpha: 0, scale: o.scale || 1 }, { y: 0, autoAlpha: 1, scale: 1, ease: 'none',
            scrollTrigger: { trigger: trig ? (typeof trig === 'function' ? trig(el) : trig) : el, start: 'top ' + (97 - (o.step ? (i % o.step) * 5 : 0)) + '%', end: 'top ' + (o.end || 58) + '%', scrub: true } });
        });
      }
      rise('.why .big', null, { y: 70 });
      rise('.why-item', null, { y: 80, step: 4 });
      rise('.fig', null, { y: 70, step: 3 });
      rise('.cat-head', null, { y: 60 });
      rise('.card', null, { y: 110, scale: 0.94, step: 4, end: 52 });
      rise('.reparto-photo', null, { y: 100, scale: 0.95 });
      rise('.contacto .big', null, { y: 70 });
    })(); } catch (e) { window.__err = 'rise: ' + e.message; }

    // vídeo: reproductor normal de YouTube (play manual); se prepara al acercarse a la sección
    try {
      var secV = document.getElementById('video');
      if (secV) {
        if ('IntersectionObserver' in window) {
          var ioV = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { makeVideo(false); ioV.disconnect(); } }, { rootMargin: '120% 0px 120% 0px' });
          ioV.observe(secV);
        } else makeVideo(false);
      }
    } catch (e) { window.__err = 'vid: ' + e.message; }

    // recorrido: escenas ilustradas con zoom y fundido controlados por el scroll
    (function () {
      var reco = document.getElementById('recorrido');
      if (!reco) return;
      var imgs = Array.prototype.slice.call(reco.querySelectorAll('.reco-scene img'));
      var left = imgs.length, okAll = true;
      function done() {
        if (--left > 0) return;
        if (!okAll) return; // faltan imágenes: la sección permanece oculta
        reco.hidden = false;
        var scenes = gsap.utils.toArray('.reco-scene'), caps = gsap.utils.toArray('.reco-cap'), dots = gsap.utils.toArray('.reco-dots i');
        gsap.set(scenes, { autoAlpha: 0 });
        gsap.set(caps, { autoAlpha: 0 });
        var mm = gsap.matchMedia();
        mm.add('(min-width: 0px)', function () {
          var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: reco, start: 'top top', end: '+=' + (scenes.length * 170) + '%', pin: '.reco-stage', scrub: 0.8, invalidateOnRefresh: true } });
          tl.from('.reco-title', { y: 40, autoAlpha: 0, duration: 0.6, ease: 'power3.out' }, 0);
          scenes.forEach(function (s, i) {
            var t = i * 3;
            // entra desde lejos (escala menor) y se acerca; al final se agranda y se funde con la siguiente
            tl.fromTo(s, { autoAlpha: i === 0 ? 1 : 0, scale: i === 0 ? 1 : 0.78 }, { autoAlpha: 1, scale: 1, duration: i === 0 ? 0.01 : 1, ease: 'power2.out' }, t);
            tl.fromTo(caps[i], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, t + 0.4);
            tl.to(s, { scale: 1.12, duration: 2, ease: 'none' }, t + 0.6);
            tl.call(function () { dots.forEach(function (d, k) { d.classList.toggle('on', k === i); }); }, null, t + 0.2);
            if (i < scenes.length - 1) {
              tl.to(s, { autoAlpha: 0, scale: 1.4, duration: 0.9, ease: 'power2.in' }, t + 2.1);
              tl.to(caps[i], { autoAlpha: 0, y: -24, duration: 0.6 }, t + 2.3);
            } else {
              tl.to({}, { duration: 1 }, t + 2.4);
            }
          });
        });
        var dr = (/[?&]reco=([0-9.]+)/.exec(dbg) || [])[1];
        if (dr) { var sr = document.createElement('style'); sr.textContent = 'main>section:not(#recorrido),.top,.foot{display:none!important}'; document.head.appendChild(sr); var st = ScrollTrigger.getAll().filter(function (x) { return x.trigger === reco; })[0]; if (st) { var an = st.animation; st.kill(true); an.progress(parseFloat(dr)); } }
        ScrollTrigger.refresh();
      }
      imgs.forEach(function (im) {
        var probe = new Image();
        probe.onload = function () { done(); };
        probe.onerror = function () { okAll = false; done(); };
        probe.src = im.getAttribute('src');
      });
    })();

    // del almacén a tu negocio: la furgoneta entra, presenta el servicio y sale
    var vs = document.querySelector('.van-stage');
    if (vs) {
      var mmV = gsap.matchMedia();
      mmV.add({ desk: '(min-width: 641px)', mob: '(max-width: 640px)' }, function (c) {
        var mob = c.conditions.mob, vf = document.getElementById('van-fig'), steps = gsap.utils.toArray('.van-step');
        var vw = function () { return window.innerWidth; };
        var home = 0;
        var tlV = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.van-world', start: 'top top', end: '+=' + (mob ? 420 : 480) + '%', pin: '.van-stage', scrub: 0.9, invalidateOnRefresh: true } });
        gsap.set(vf, { x: function () { return vw() * 1.15; }, rotation: 0.6, transformOrigin: '50% 90%' });
        gsap.set(steps, { autoAlpha: 0, y: 40 });
        tlV.fromTo('.van-title', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.6, ease: 'power3.out' }, 0);
        // entrada desde la derecha: frena poco a poco, con ligero cabeceo y desenfoque de movimiento
        tlV.to(vf, { x: home, duration: 4, ease: 'power3.out' }, 0.6);
        tlV.fromTo(vf, { filter: 'blur(7px)' }, { filter: 'blur(0px)', duration: 3.2, ease: 'power2.out' }, 0.6);
        tlV.fromTo(vf, { rotation: 1.2 }, { rotation: 0, duration: 4, ease: 'power3.out' }, 0.6);
        tlV.fromTo(vf, { scale: 0.9 }, { scale: 1, duration: 4, ease: 'power2.out' }, 0.6);
        tlV.to('.van-title', { autoAlpha: 0.14, y: -20, duration: 1.6 }, 5);
        steps.forEach(function (s, i) {
          tlV.to(s, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 5.4 + i * 1.5);
          if (mob) tlV.to(s, { autoAlpha: 0, y: -24, duration: 0.5 }, 5.4 + i * 1.5 + 1.0);
        });
        tlV.to({}, { duration: 1 });
        // salida: la información se desvanece y la furgoneta sigue su camino hacia la izquierda
        if (!mob) tlV.to(steps, { autoAlpha: 0, y: -28, duration: 1.1, stagger: 0.1 }, 10.8);
        tlV.to('.van-title', { autoAlpha: 0, duration: 1 }, 11.2);
        tlV.fromTo(vf, { filter: 'blur(0px)' }, { filter: 'blur(6px)', duration: 2.4, ease: 'power2.in', immediateRender: false }, 11.4);
        tlV.to(vf, { x: function () { return -vw() * 1.2; }, duration: 3.2, ease: 'power2.in' }, 11.4);
        var dv = (/[?&]van=([0-9.]+)/.exec(dbg) || [])[1];
        if (dv) { var st3 = document.createElement('style'); st3.textContent = 'main>section:not(.van-world),.top,.foot{display:none!important}'; document.head.appendChild(st3); tlV.scrollTrigger.kill(true); tlV.progress(parseFloat(dv)); }
      });
    }

    // tarjetas del catálogo: paralaje de la fotografía
    gsap.utils.toArray('.card-photo img').forEach(function (im) {
      gsap.fromTo(im, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // las imágenes diferidas cambian la altura de la página
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    var only = (/[?&]only=([a-z-]+)/.exec(dbg) || [])[1];
    if (only) { var so = document.createElement('style'); so.textContent = 'main>section:not(#' + only + '),.top,.foot{display:none!important}'; document.head.appendChild(so); setTimeout(function () { ScrollTrigger.refresh(); window.scrollTo(0, 1500); ScrollTrigger.update(); gsap.utils.toArray('.ad-products img').forEach(function (i) { gsap.set(i, { y: 0 }); }); }, 800); }
    var dy = (/[?&]y=([0-9]+)/.exec(dbg) || [])[1];
    if (dy) setTimeout(function () { window.scrollTo(0, +dy); ScrollTrigger.update(); }, 600);
  }

  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
