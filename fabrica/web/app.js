/* Fábrica de Agentes · interfaz
 * Habla con server.js (misma dirección). Todo el texto se inserta con textContent: nada de HTML de fuera. */
(function () {
  'use strict';

  var API = window.FABRICA_API || ''; // vacío = mismo servidor. Ver README para integrarlo en otra web.
  var POLL_MS = 2500;

  var $ = function (id) { return document.getElementById(id); };
  var log = $('log'), logVacio = $('log-vacio'), form = $('form'), texto = $('texto');
  var agentesEl = $('agentes'), tarjetas = $('tarjetas'), resVacio = $('res-vacio'), aviso = $('aviso');
  var sendBtn = form.querySelector('.send');

  /* ---------- ayudas ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    (function añadir(hijos) {
      hijos.forEach(function (c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) return añadir(c);
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    })(Array.prototype.slice.call(arguments, 2));
    return el;
  }
  function fecha(iso) {
    try { return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }
  function api(ruta, opciones) {
    return fetch(API + ruta, opciones).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || 'Algo ha fallado.');
        return d;
      });
    });
  }
  function post(ruta, cuerpo) {
    return api(ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo || {}) });
  }
  function mostrarAviso(msg) {
    if (msg) { aviso.textContent = msg; aviso.hidden = false; } else { aviso.hidden = true; }
  }
  var ESTADOS = { libre: 'Libre', trabajando: 'Trabajando', terminado: 'Terminado' };

  /* ---------- equipo ---------- */
  var sigAgentes = '';
  function pintarAgentes(lista) {
    var sig = JSON.stringify(lista.map(function (a) { return [a.slug, a.estado, a.tarea]; }));
    var cap = lista.filter(function (a) { return a.slug === 'capataz'; })[0];
    if (cap) {
      var pill = $('estado-capataz');
      pill.replaceChildren(h('i', { class: 'dot ' + cap.estado }), h('span', { text: ESTADOS[cap.estado] || cap.estado }));
    }
    if (sig === sigAgentes) return;
    sigAgentes = sig;
    agentesEl.replaceChildren.apply(agentesEl, lista.map(function (a) {
      return h('li', { class: 'agente ' + a.estado },
        h('i', { class: 'dot ' + a.estado }),
        h('div', null,
          h('span', { class: 'nom', text: a.nombre }),
          h('span', { class: 'est', text: ESTADOS[a.estado] || a.estado })),
        a.tarea ? h('p', { class: 'tarea', text: a.tarea }) : h('p', { class: 'fn', text: a.funcion })
      );
    }));
  }

  /* ---------- chat ---------- */
  var mensajes = {}; // id -> {sig, el}
  function mensajeBot(p) {
    var cuerpo;
    if (p.estado === 'nueva') {
      cuerpo = h('div', { class: 'state' }, h('span', { class: 'typing', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', { text: 'En cola. Empiezo enseguida.' }));
    } else if (p.estado === 'procesando') {
      cuerpo = h('div', { class: 'state' }, h('span', { class: 'typing', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', { text: 'El equipo está trabajando en ello…' }));
    } else if (p.estado === 'error') {
      cuerpo = h('div', null,
        h('p', { class: 'body err', text: p.error || 'No se ha podido completar.' }),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', type: 'button', text: 'Reintentar', onclick: function () {
          post('/api/peticiones/' + p.id + '/reintentar').then(refrescar).catch(function (e) { mostrarAviso(e.message); });
        } })));
    } else {
      var r = p.resultado || {};
      cuerpo = h('div', null,
        h('p', { class: 'body', text: (r.titulo ? r.titulo + '\n\n' : '') + (r.resumen || 'Trabajo terminado.') }),
        h('div', { class: 'row' }, h('a', { class: 'link-btn', href: '#res-' + p.id, text: 'Ver resultado y decidir' })));
    }
    return h('div', { class: 'msg bot' }, h('div', { class: 'who', text: 'Capataz' }), cuerpo);
  }
  function mensajeUsuario(p) {
    var quien = p.origen === 'programada' ? 'Tarea programada' : p.origen === 'cambios' ? 'Cambios pedidos' : 'Tú';
    return h('div', { class: 'msg user' }, h('div', { class: 'who', text: quien + ' · ' + fecha(p.creado) }), h('div', { class: 'body', text: p.texto }));
  }
  function pintarChat(lista) {
    var cerca = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    var cambio = false;
    lista.forEach(function (p) {
      var sig = [p.estado, p.error, p.resultado && p.resultado.resumen].join('|');
      var m = mensajes[p.id];
      if (m && m.sig === sig) return;
      var el = h('div', { class: 'par', 'data-id': p.id }, mensajeUsuario(p), mensajeBot(p));
      el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.gap = '14px';
      if (m) m.el.replaceWith(el); else log.appendChild(el);
      mensajes[p.id] = { sig: sig, el: el };
      cambio = true;
    });
    logVacio.hidden = lista.length > 0;
    if (cambio && cerca) log.scrollTop = log.scrollHeight;
  }

  /* ---------- resultados ---------- */
  var cards = {}; // id -> {sig, el}
  var ETIQUETA = { pendiente: ['Pendiente de tu revisión', ''], aprobado: ['Aprobado', 'ok'], cambios: ['Cambios pedidos', 'warn'] };

  function entregable(e) {
    var pre = h('pre', { text: e.contenido });
    var copiar = h('button', { class: 'btn ghost sm', type: 'button', text: 'Copiar', onclick: function (ev) {
      var b = ev.currentTarget;
      (navigator.clipboard ? navigator.clipboard.writeText(e.contenido) : Promise.reject()).then(function () {
        b.textContent = 'Copiado'; setTimeout(function () { b.textContent = 'Copiar'; }, 1500);
      }).catch(function () { b.textContent = 'Selecciona y copia'; });
    } });
    return h('details', { class: 'ent' },
      h('summary', null, h('span', null,
        h('span', { class: 'ent-t', text: e.titulo || 'Entregable' }),
        h('span', { class: 'ent-a', text: (e.tipo === 'borrador' ? 'Borrador · ' : '') + e.agente }))),
      h('div', { class: 'ent-body' }, pre, copiar));
  }

  function bloqueWeb(cw) {
    var texto = { pendiente: 'Cambios preparados en una copia. Tu web real no se ha tocado.', aplicado: 'Aplicado en tu copia de la web. Falta publicarlo en internet.', publicado: 'Publicado en internet.' }[cw.estado];
    return h('div', { class: 'cw' },
      h('p', { class: 'pend-t', text: 'Cambios en la web' }),
      h('p', { class: 'cw-t', text: texto }),
      h('ul', { class: 'pend' }, cw.archivos.map(function (a) { return h('li', { text: a.ruta + ' (' + a.estado + ')' }); })),
      cw.resumen ? h('p', { class: 'pend-t', text: cw.resumen }) : null,
      cw.vista_previa ? h('a', { class: 'link-btn', href: cw.vista_previa, target: '_blank', rel: 'noopener', text: 'Ver vista previa de la web con los cambios' }) : null);
  }

  function tarjeta(r) {
    var rev = r.revision || { estado: 'pendiente' };
    var et = ETIQUETA[rev.estado] || ETIQUETA.pendiente;
    var cw = r.cambio_web;
    var hecho = rev.estado === 'aprobado';
    var cont = h('div', { class: 'actions' });
    var el = h('article', { class: 'card', id: 'res-' + r.id, 'aria-label': r.titulo },
      h('span', { class: 'badge ' + et[1], text: et[0] }),
      h('h3', { text: r.titulo }),
      r.agentes.length ? h('div', { class: 'tags' }, r.agentes.map(function (a) { return h('span', { class: 'tag', text: a }); })) : null,
      h('p', { class: 'resumen', text: r.resumen }),
      r.pendiente.length ? h('div', null, h('p', { class: 'pend-t', text: 'Pendiente de confirmar' }), h('ul', { class: 'pend' }, r.pendiente.map(function (x) { return h('li', { text: x }); }))) : null,
      cw ? bloqueWeb(cw) : null,
      r.entregables.map(entregable),
      rev.comentario ? h('p', { class: 'pend-t', text: 'Tu comentario: ' + rev.comentario }) : null,
      cont);

    var aprobar = h('button', { class: 'btn sm', type: 'button', text: hecho ? 'Aprobado' : (cw && cw.estado === 'pendiente' ? 'Aprobar y aplicar a la web' : 'Aprobar') });
    aprobar.disabled = hecho;
    aprobar.addEventListener('click', function () {
      aprobar.disabled = true;
      var ruta = cw && cw.estado === 'pendiente' ? '/aplicar' : '/decision';
      var cuerpo = ruta === '/decision' ? { decision: 'aprobado' } : {};
      post('/api/resultados/' + r.id + ruta, cuerpo).then(refrescar).catch(function (e) { aprobar.disabled = false; mostrarAviso(e.message); });
    });
    var pedir = h('button', { class: 'btn ghost sm', type: 'button', text: 'Pedir cambios' });
    pedir.addEventListener('click', function () {
      pedir.hidden = true; aprobar.hidden = true;
      var ta = h('textarea', { 'aria-label': 'Qué hay que cambiar', placeholder: 'Cuéntame qué hay que cambiar…' });
      var enviar = h('button', { class: 'btn sm', type: 'button', text: 'Enviar cambios' });
      var cancelar = h('button', { class: 'btn ghost sm', type: 'button', text: 'Cancelar' });
      cancelar.addEventListener('click', function () { caja.remove(); pedir.hidden = false; aprobar.hidden = false; });
      enviar.addEventListener('click', function () {
        if (!ta.value.trim()) { ta.focus(); return; }
        enviar.disabled = true;
        post('/api/resultados/' + r.id + '/decision', { decision: 'cambios', comentario: ta.value }).then(function () {
          refrescar(); $('chat').scrollIntoView({ behavior: 'smooth' });
        }).catch(function (e) { enviar.disabled = false; mostrarAviso(e.message); });
      });
      var caja = h('div', { class: 'cambios' }, ta, h('div', { class: 'actions' }, enviar, cancelar));
      cont.replaceWith(caja);
      ta.focus();
    });
    if (cw && cw.estado !== 'pendiente') {
      // El cambio ya está aplicado: solo queda publicar (o ya está publicado)
      var pub = h('button', { class: 'btn sm', type: 'button', text: cw.estado === 'publicado' ? 'Publicado en internet' : 'Publicar en internet' });
      pub.disabled = cw.estado === 'publicado';
      var armado = false;
      pub.addEventListener('click', function () {
        if (!armado) { armado = true; pub.textContent = 'Confirmar: publicar ahora'; setTimeout(function () { armado = false; if (!pub.disabled) pub.textContent = 'Publicar en internet'; }, 5000); return; }
        pub.disabled = true; pub.textContent = 'Publicando…';
        post('/api/resultados/' + r.id + '/publicar').then(refrescar).catch(function (e) { pub.disabled = false; pub.textContent = 'Publicar en internet'; mostrarAviso(e.message); });
      });
      cont.append(pub);
      return el;
    }
    cont.append(aprobar, pedir);
    return el;
  }

  function pintarResultados(lista) {
    var orden = [];
    lista.forEach(function (r) {
      var sig = JSON.stringify([r.titulo, r.resumen, r.revision, r.entregables.length, r.pendiente.length, r.cambio_web]);
      var c = cards[r.id];
      if (!c || c.sig !== sig) {
        // si el usuario está escribiendo cambios en esta tarjeta, no la tocamos
        if (c && c.el.querySelector('.cambios textarea') && c.el.querySelector('.cambios textarea').value) { orden.push(c.el); return; }
        var el = tarjeta(r);
        if (c) c.el.replaceWith(el);
        cards[r.id] = { sig: sig, el: el };
      }
      orden.push(cards[r.id].el);
    });
    var actuales = Array.prototype.slice.call(tarjetas.children);
    var igual = actuales.length === orden.length && actuales.every(function (n, i) { return n === orden[i]; });
    if (!igual) tarjetas.replaceChildren.apply(tarjetas, orden);
    resVacio.hidden = lista.length > 0;
  }

  /* ---------- sondeo ---------- */
  var ocupado = false;
  function refrescar() {
    if (ocupado) return Promise.resolve();
    ocupado = true;
    return Promise.all([api('/api/agentes'), api('/api/peticiones'), api('/api/resultados')]).then(function (d) {
      mostrarAviso('');
      pintarAgentes(d[0]); pintarChat(d[1]); pintarResultados(d[2]);
    }).catch(function () {
      mostrarAviso('No se puede conectar con la fábrica. Comprueba que el servidor está encendido (en la carpeta fabrica: node server.js).');
    }).then(function () { ocupado = false; });
  }
  setInterval(function () { if (!document.hidden) refrescar(); }, POLL_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refrescar(); });

  /* ---------- formulario ---------- */
  function ajustar() {
    texto.style.height = 'auto';
    texto.style.height = Math.min(texto.scrollHeight, 180) + 'px';
    sendBtn.disabled = !texto.value.trim();
  }
  texto.addEventListener('input', ajustar);
  texto.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = texto.value.trim();
    if (!t) return;
    sendBtn.disabled = true;
    post('/api/peticiones', { texto: t }).then(function () {
      texto.value = ''; ajustar(); mostrarAviso('');
      return refrescar();
    }).then(function () { log.scrollTop = log.scrollHeight; }).catch(function (err) {
      mostrarAviso(err.message || 'No se pudo enviar la petición.'); ajustar();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (b) {
    b.addEventListener('click', function () { texto.value = b.textContent; ajustar(); texto.focus(); });
  });
  $('btn-pedir').addEventListener('click', function () { setTimeout(function () { texto.focus({ preventScroll: true }); }, 400); });

  ajustar();
  refrescar();
})();
