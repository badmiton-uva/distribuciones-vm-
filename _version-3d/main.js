(function () {
  var dbgY = (/[?&]y=([0-9]+)/.exec(location.search) || [])[1];
  if (dbgY) window.addEventListener('load', function () { setTimeout(function () { window.scrollTo(0, +dbgY); if (/[?&]show=1/.test(location.search)) document.querySelectorAll('[data-r]').forEach(function (e) { e.classList.add('in'); }); }, 300); });
  // Entrada de las teselas al verse
  var els = document.querySelectorAll('[data-r]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Vídeo decorativo: quieto si el visitante pide menos movimiento
  var vid = document.querySelector('video');
  if (vid && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { vid.removeAttribute('autoplay'); vid.pause(); }

  // Hora local de Medina del Campo
  var clock = document.getElementById('clock');
  function tick() {
    try {
      clock.textContent = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(new Date());
    } catch (e) {}
  }
  if (clock) { tick(); setInterval(tick, 30000); }

  // ¿Llegamos a tu pueblo?
  var sel = document.getElementById('loc');
  var res = document.getElementById('res');
  if (sel && res) {
    sel.addEventListener('change', function () {
      var v = sel.value;
      var name = sel.options[sel.selectedIndex].text;
      res.className = 'result';
      if (!v) {
        res.innerHTML = '<p>Repartimos en un radio de unos 90 km alrededor de Medina del Campo.</p>';
      } else if (v === 'otra') {
        res.innerHTML = '<p>Escríbenos con el nombre de tu localidad y te confirmamos si llegamos.</p>';
      } else {
        res.className = 'result yes';
        res.innerHTML = '<strong>' + v + ' km</strong><p>' + name + ' está dentro de la zona de reparto.</p><small>Distancia aproximada por carretera desde Medina del Campo. Confirma los días de reparto en el formulario.</small>';
      }
    });
  }

  // Formulario: aún sin destino de envío
  var f = document.getElementById('f');
  var st = document.getElementById('st');
  var EMAIL = ''; // pendiente: correo de la empresa
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.nombre.value.trim() || !f.ok.checked) {
        st.textContent = 'Indica tu nombre y acepta el consentimiento para continuar.';
        return;
      }
      if (!EMAIL) { st.textContent = 'El envío del formulario está en preparación.'; return; }
      var body = 'Nombre: ' + f.nombre.value + '\nContacto: ' + f.contacto.value + '\n\n' + f.mensaje.value;
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Consulta desde la web') + '&body=' + encodeURIComponent(body);
    });
  }

  // Furgoneta: avanza de lado a lado con el scroll
  var van = document.getElementById('van');
  var wheels = van ? van.querySelectorAll('.wheel') : [];
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;
  function drive() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    var x = p * (window.innerWidth - van.getBoundingClientRect().width);
    van.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    for (var i = 0; i < wheels.length; i++) wheels[i].style.transform = 'rotate(' + (x * 1.4).toFixed(1) + 'deg)';
  }
  var lane = document.querySelector('.lane');
  var storyEl = document.getElementById('almacen');
  function laneVis() {
    if (!lane || !storyEl) return;
    var inStory = document.documentElement.classList.contains('has3d') && storyEl.getBoundingClientRect().bottom > window.innerHeight * 0.85;
    lane.classList.toggle('off', inStory);
  }
  window.addEventListener('scroll', laneVis, { passive: true });
  window.addEventListener('load', laneVis);
  laneVis();
  if (van && !still) {
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(drive); } }, { passive: true });
    window.addEventListener('resize', drive);
    drive();
  }
})();
