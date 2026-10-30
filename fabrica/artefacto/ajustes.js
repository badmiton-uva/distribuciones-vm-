/* Ajustes: editar la información de la empresa y los agentes sin tocar código */
(function () {
  'use strict';
  var E = window.FabricaEngine; if (!E) return;
  var $ = function (id) { return document.getElementById(id); };
  var sec = $('ajustes'); sec.hidden = false;
  var ctx = $('set-ctx'), sel = $('set-ag'), nom = $('set-nom'), fn = $('set-fn'), ins = $('set-ins');
  var msgC = $('set-ctx-msg'), msgA = $('set-ag-msg');
  var actual = null;

  function decir(el, t) { el.textContent = t; setTimeout(function () { if (el.textContent === t) el.textContent = ''; }, 3000); }
  function llenarSelect(elegir) {
    var c = E.config(); sel.replaceChildren();
    c.agentes.forEach(function (a) { var o = document.createElement('option'); o.value = a.slug; o.textContent = a.nombre; sel.appendChild(o); });
    var n = document.createElement('option'); n.value = '__nuevo'; n.textContent = '+ Nuevo agente'; sel.appendChild(n);
    sel.value = elegir || (c.agentes[0] && c.agentes[0].slug) || '__nuevo';
    mostrar();
  }
  function mostrar() {
    var c = E.config();
    actual = sel.value === '__nuevo' ? null : c.agentes.filter(function (a) { return a.slug === sel.value; })[0] || null;
    nom.value = actual ? actual.nombre : ''; fn.value = actual ? actual.funcion : ''; ins.value = actual ? actual.instrucciones : '';
    $('set-borrar').hidden = !actual || actual.slug === 'web';
    nom.disabled = !!actual;
  }
  ctx.value = E.config().contexto; llenarSelect();
  var primera = true;
  E.onConfig(function (c) { if (primera || document.activeElement !== ctx) ctx.value = c.contexto; primera = false; if (document.activeElement !== ins && document.activeElement !== fn) llenarSelect(sel.value); });
  sel.addEventListener('change', mostrar);
  $('set-ctx-save').addEventListener('click', function () { E.guardarContexto(ctx.value).then(function () { decir(msgC, 'Guardado'); }); });
  $('set-ag-save').addEventListener('click', function () {
    if (!nom.value.trim()) { nom.focus(); return; }
    try {
      E.guardarAgente({ slug: actual && actual.slug, nombre: nom.value, funcion: fn.value, instrucciones: ins.value }).then(function (slug) { llenarSelect(slug); decir(msgA, 'Guardado'); });
    } catch (e) { decir(msgA, e.message); }
  });
  $('set-borrar').addEventListener('click', function () {
    if (!actual) return;
    try { E.borrarAgente(actual.slug).then(function () { llenarSelect(); decir(msgA, 'Agente quitado'); }); } catch (e) { decir(msgA, e.message); }
  });
  $('set-reset').addEventListener('click', function () {
    var b = $('set-reset');
    if (!b.dataset.ok) { b.dataset.ok = '1'; b.textContent = 'Confirmar: restaurar todo'; setTimeout(function () { delete b.dataset.ok; b.textContent = 'Restaurar valores originales'; }, 4000); return; }
    delete b.dataset.ok; b.textContent = 'Restaurar valores originales';
    E.restaurar().then(function () { ctx.value = E.config().contexto; llenarSelect(); decir(msgC, 'Restaurado'); });
  });
})();
