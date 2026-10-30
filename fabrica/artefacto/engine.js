/* Fábrica de Agentes · motor dentro de Claude
 * Usa la cuenta de Claude de quien abre la página (capacidad "sample") y guarda todo en la base de datos del artefacto ("db").
 * Sustituye al servidor local: app.js sigue llamando a /api/..., pero aquí lo contesta este motor. */
(function () {
  'use strict';
  window.FABRICA_MODO = 'artefacto';
  var DEF = window.__FABRICA_DEFAULTS;
  var db = null, sample = null;
  var config = clonar({ contexto: DEF.contexto, agentes: DEF.agentes });
  var configEnDb = false;
  var peticiones = [], resultados = [], estados = {};
  var activos = {}, cola = [], ocupado = false, primeraCarga = { pet: true };
  var escuchas = [];

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }
  function ahora() { return new Date().toISOString(); }
  function uid() { return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6); }
  function json(d, code) { return Promise.resolve(new Response(JSON.stringify(d), { status: code || 200, headers: { 'Content-Type': 'application/json' } })); }

  /* ---------- almacenamiento ---------- */
  var cadena = Promise.resolve();
  function guardar(col, obj) {
    obj.v = (obj.v || 0) + 1;
    var copia = clonar(obj);
    cadena = cadena.then(function () { return db ? db.doc(col + '/' + copia.id).set(copia) : null; }).catch(function () { /* sin base de datos: sigue en memoria */ });
    return cadena;
  }
  function borrarDoc(ruta) { cadena = cadena.then(function () { return db ? db.doc(ruta).delete() : null; }).catch(function () {}); }
  function guardarConfig() {
    config.id = 'config'; config.v = (config.v || 0) + 1;
    var copia = clonar(config); configEnDb = true;
    cadena = cadena.then(function () { return db ? db.doc('fabrica/config').set(copia) : null; }).catch(function () {});
    avisarConfig();
    return cadena;
  }
  function avisarConfig() { escuchas.forEach(function (f) { try { f(config); } catch (e) {} }); reiniciarEstados(true); }

  function fusionar(lista, docs) {
    docs.forEach(function (d) {
      var x = d.data(); if (!x || !x.id) return;
      var i = lista.findIndex(function (y) { return y.id === x.id; });
      if (i < 0) lista.push(clonar(x));
      else if ((x.v || 0) > (lista[i].v || 0)) lista[i] = clonar(x);
    });
  }
  function conectarDb() {
    claude.use('db').then(function (d) {
      if (!d) return; db = d;
      db.collection('peticiones').onSnapshot(function (snap) {
        fusionar(peticiones, snap.docs);
        if (primeraCarga.pet) {
          primeraCarga.pet = false;
          // Lo que se quedó a medias porque se cerró la página
          peticiones.forEach(function (p) {
            if ((p.estado === 'nueva' || p.estado === 'procesando') && !activos[p.id]) {
              p.estado = 'error'; p.error = 'Se interrumpió porque se cerró la página. Pulsa "Reintentar".'; guardar('peticiones', p);
            }
          });
        }
      }, function () {});
      db.collection('resultados').onSnapshot(function (snap) { fusionar(resultados, snap.docs); }, function () {});
      db.doc('fabrica/config').onSnapshot(function (s) {
        if (s.exists) { var c = s.data(); if ((c.v || 0) >= (config.v || 0) && c.contexto) { config = clonar(c); configEnDb = true; avisarConfig(); } }
      }, function () {});
    }).catch(function () {});
  }
  function conectarSample() { claude.use('sample').then(function (s) { sample = s; }).catch(function () {}); }

  /* ---------- agentes ---------- */
  function listaAgentes() {
    return [{ slug: 'capataz', nombre: 'Capataz', funcion: 'Coordinador. Entiende la petición, la reparte entre los especialistas y entrega el resultado ya resumido.' }]
      .concat(config.agentes.map(function (a) { return { slug: a.slug, nombre: a.nombre, funcion: a.funcion }; }));
  }
  function reiniciarEstados(soloFaltan) {
    listaAgentes().forEach(function (a) { if (!soloFaltan || !estados[a.slug]) estados[a.slug] = { estado: 'libre', tarea: '' }; });
  }
  function setEst(slug, estado, tarea) { estados[slug] = { estado: estado, tarea: tarea || '' }; }
  reiniciarEstados();

  /* ---------- Claude ---------- */
  function errorLegible(e) {
    var c = e && e.code;
    if (c === 'sin_claude' || c === 'not_granted') return 'Esta página necesita permiso para usar tu cuenta de Claude. Ábrela dentro de Claude y acepta el permiso cuando lo pida; luego pulsa "Reintentar".';
    if (c === 'rate_limited') return 'Has llegado al límite de uso de tu cuenta de Claude. Espera un rato y pulsa "Reintentar".';
    return 'No se pudo completar: ' + String((e && e.message) || e || 'error desconocido').slice(0, 240);
  }
  function pedirJSON(prompt) {
    return sample.json(prompt).catch(function (e) {
      if (e && (e.code === 'not_granted' || e.code === 'rate_limited')) throw e;
      return sample(prompt + '\n\nResponde SOLO con un JSON válido, sin texto antes ni después.').then(function (r) {
        var m = String(r.text || '').match(/\{[\s\S]*\}/);
        if (!m) throw new Error('Claude no devolvió el formato esperado.');
        return JSON.parse(m[0]);
      });
    });
  }
  var NOTA = '\n\nNota: en esta versión no tienes acceso a archivos ni a internet. Trabaja solo con el contexto de la empresa y la petición. Todo lo que redactes es un BORRADOR: nunca se envía nada a clientes ni se publica sin aprobación humana.';

  function promptPlan(texto) {
    return 'Eres el capataz de un equipo de agentes de IA de la empresa Distribuciones Valentín. Reparte esta petición entre los especialistas necesarios.\n\n' +
      '=== CONTEXTO DE LA EMPRESA ===\n' + config.contexto + '\n\n' +
      '=== ESPECIALISTAS DISPONIBLES ===\n' + config.agentes.map(function (a) { return '- ' + a.slug + ': ' + a.funcion; }).join('\n') + '\n\n' +
      '=== PETICIÓN ===\n' + texto + '\n\n' +
      'Devuelve SOLO un JSON con esta forma exacta:\n{"titulo":"título corto, máximo 80 caracteres","tareas":[{"agente":"slug","tarea":"instrucción concreta para ese especialista"}]}\n' +
      'Reglas: usa solo los especialistas necesarios (de 1 a 4); si la petición pide cambiar algo de la web (textos, páginas, estilos, catálogo, imágenes) incluye al agente "web"; no inventes datos que no estén en el contexto; escribe en español.';
  }
  function promptEsp(a, texto, tarea) {
    return 'Eres el agente "' + a.nombre + '" de la empresa Distribuciones Valentín.\n\n' + a.instrucciones +
      '\n\n=== CONTEXTO DE LA EMPRESA (única fuente de verdad) ===\n' + config.contexto +
      '\n\n=== PETICIÓN ORIGINAL ===\n' + texto +
      '\n\n=== TU TAREA ===\n' + tarea + NOTA +
      '\n\nResponde en español, en Markdown sencillo y solo con el entregable, sin saludos ni explicaciones previas. Si falta un dato, escribe [A CONFIRMAR] en lugar de inventarlo.';
  }
  function promptRevision(texto, entregables) {
    return 'Eres el capataz. Revisa lo que han entregado los especialistas y escribe el resumen para la persona que hizo la petición.\n\n' +
      '=== PETICIÓN ===\n' + texto + '\n\n=== ENTREGAS ===\n' +
      entregables.map(function (e) { return '## ' + e.agente + '\n' + e.contenido.slice(0, 3000); }).join('\n\n') + '\n\n' +
      'Devuelve SOLO un JSON: {"titulo":"título corto (máx. 80 caracteres)","resumen":"3 a 6 frases: qué se ha hecho y qué debe decidir la persona","pendiente":["dato que falta confirmar"]}\n' +
      'No inventes nada que no esté en las entregas. "pendiente" puede ser una lista vacía.';
  }

  function procesar(id) {
    var p = peticiones.find(function (x) { return x.id === id; });
    if (!p) return Promise.resolve();
    activos[id] = true;
    p.estado = 'procesando'; p.iniciado = ahora(); delete p.error; guardar('peticiones', p);
    Object.keys(estados).forEach(function (k) { estados[k] = { estado: 'libre', tarea: '' }; });
    reiniciarEstados(true);
    setEst('capataz', 'trabajando', 'Analizando la petición');
    var titulo = '', tareasOk = [];

    return Promise.resolve().then(function () {
      if (!sample) { var e = new Error('sin claude'); e.code = 'sin_claude'; throw e; }
      return pedirJSON(promptPlan(p.texto));
    }).then(function (plan) {
      titulo = String(plan.titulo || '').slice(0, 80);
      var validos = {}; config.agentes.forEach(function (a) { validos[a.slug] = a; });
      var tareas = (Array.isArray(plan.tareas) ? plan.tareas : []).filter(function (t) { return t && validos[t.agente] && t.tarea; }).slice(0, 4);
      if (!tareas.length) tareas = [{ agente: validos.administracion ? 'administracion' : config.agentes[0].slug, tarea: p.texto }];
      setEst('capataz', 'trabajando', 'Esperando a los especialistas');
      return Promise.all(tareas.map(function (t) {
        var a = validos[t.agente];
        setEst(a.slug, 'trabajando', String(t.tarea).slice(0, 90));
        return sample(promptEsp(a, p.texto, t.tarea), { cache: false }).then(function (r) {
          setEst(a.slug, 'terminado', 'Entregado');
          return { agente: a.slug, titulo: a.nombre + ': ' + String(t.tarea).slice(0, 70), tipo: a.slug === 'web' ? 'informe' : 'borrador', contenido: String(r.text || '').trim() + (r.truncated ? '\n\n(Respuesta recortada por longitud.)' : ''), ok: true };
        }).catch(function (e) {
          setEst(a.slug, 'libre', '');
          return { agente: a.slug, error: e, ok: false };
        });
      }));
    }).then(function (res) {
      tareasOk = res.filter(function (x) { return x.ok && x.contenido; });
      if (!tareasOk.length) throw (res[0] && res[0].error) || new Error('Ningún especialista entregó nada.');
      var fallos = res.filter(function (x) { return !x.ok; }).length;
      setEst('capataz', 'trabajando', 'Revisando y resumiendo');
      return pedirJSON(promptRevision(p.texto, tareasOk)).catch(function () { return {}; }).then(function (rev) {
        var r = {
          id: id, creado: ahora(),
          titulo: String(rev.titulo || titulo || 'Trabajo terminado').slice(0, 80),
          resumen: String(rev.resumen || 'Los especialistas han entregado su trabajo. Revísalo abajo.') + (fallos ? '\n\n(' + fallos + ' especialista(s) no pudieron terminar su parte.)' : ''),
          agentes: tareasOk.map(function (x) { return x.agente; }),
          entregables: tareasOk.map(function (x) { return { agente: x.agente, titulo: x.titulo, tipo: x.tipo, contenido: x.contenido }; }),
          requiere_aprobacion: true,
          pendiente: Array.isArray(rev.pendiente) ? rev.pendiente.map(String).filter(Boolean) : [],
          revision: { estado: 'pendiente' }, web_estado: ''
        };
        var web = tareasOk.filter(function (x) { return x.agente === 'web'; })[0];
        if (web) { r.web_estado = 'pendiente'; r.cambio_web = { estado: 'pendiente', orden: web.contenido, nota: '' }; }
        resultados = resultados.filter(function (x) { return x.id !== id; }); resultados.push(r);
        guardar('resultados', r);
        p.estado = 'terminada'; p.terminado = ahora(); guardar('peticiones', p);
        setEst('capataz', 'terminado', r.titulo);
      });
    }).catch(function (e) {
      p.estado = 'error'; p.error = errorLegible(e); p.terminado = ahora(); guardar('peticiones', p);
      Object.keys(estados).forEach(function (k) { if (estados[k].estado === 'trabajando') estados[k] = { estado: 'libre', tarea: '' }; });
    }).then(function () { delete activos[id]; });
  }
  function encolar(id) { if (cola.indexOf(id) < 0) cola.push(id); siguiente(); }
  function siguiente() {
    if (ocupado || !cola.length) return;
    ocupado = true;
    procesar(cola.shift()).then(function () { ocupado = false; siguiente(); });
  }
  function crear(texto, extra) {
    var p = Object.assign({ id: uid(), texto: texto, estado: 'nueva', creado: ahora(), origen: 'web' }, extra || {});
    peticiones.push(p); activos[p.id] = true; guardar('peticiones', p); encolar(p.id); return p;
  }

  /* ---------- vistas para la interfaz ---------- */
  function vistaResultado(r) {
    var cw = r.cambio_web;
    return {
      id: r.id, titulo: r.titulo, resumen: r.resumen, agentes: r.agentes || [], entregables: r.entregables || [],
      requiere_aprobacion: true, pendiente: r.pendiente || [], revision: r.revision || { estado: 'pendiente' }, creado: r.creado,
      cambio_web: cw ? { rama: '', archivos: [], resumen: '', estado: r.web_estado || cw.estado || 'pendiente', vista_previa: null, nota: cw.nota || '' } : null
    };
  }
  function vistaPeticion(p) {
    var r = p.estado === 'terminada' ? resultados.find(function (x) { return x.id === p.id; }) : null;
    return Object.assign({}, p, { resultado: r ? { titulo: r.titulo, resumen: r.resumen } : null });
  }

  window.fetch = function (url, opt) {
    opt = opt || {}; var m = (opt.method || 'GET').toUpperCase(); var body = {}, r;
    try { body = JSON.parse(opt.body || '{}'); } catch (e) {}
    if (m === 'GET' && url === '/api/agentes') return json(listaAgentes().map(function (a) { var s = estados[a.slug] || { estado: 'libre', tarea: '' }; return { slug: a.slug, nombre: a.nombre, funcion: a.funcion, estado: s.estado, tarea: s.tarea }; }));
    if (m === 'GET' && url === '/api/peticiones') return json(peticiones.slice().sort(function (a, b) { return String(a.creado).localeCompare(String(b.creado)); }).map(vistaPeticion));
    if (m === 'GET' && url === '/api/resultados') return json(resultados.slice().sort(function (a, b) { return String(b.creado).localeCompare(String(a.creado)); }).map(vistaResultado));
    if (m === 'POST' && url === '/api/peticiones') {
      var t = String(body.texto || '').trim();
      if (!t || t.length > 4000) return json({ error: 'Escribe una petición de hasta 4000 caracteres.' }, 400);
      return json(crear(t), 201);
    }
    if ((r = url.match(/^\/api\/peticiones\/([^/]+)\/reintentar$/)) && m === 'POST') {
      var pet = peticiones.find(function (x) { return x.id === r[1]; });
      if (!pet || pet.estado !== 'error') return json({ error: 'Solo se pueden reintentar las peticiones con error.' }, 400);
      pet.estado = 'nueva'; delete pet.error; activos[pet.id] = true; guardar('peticiones', pet); encolar(pet.id); return json(pet);
    }
    if ((r = url.match(/^\/api\/resultados\/([^/]+)\/(decision|aplicar)$/)) && m === 'POST') {
      var res = resultados.find(function (x) { return x.id === r[1]; });
      if (!res) return json({ error: 'No existe ese resultado.' }, 404);
      if (r[2] === 'aplicar') {
        if (!res.cambio_web || res.web_estado !== 'pendiente') return json({ error: 'Este cambio ya está aprobado.' }, 400);
        res.web_estado = 'aprobado'; res.cambio_web.estado = 'aprobado';
        res.revision = { estado: 'aprobado', comentario: '', fecha: ahora() };
      } else {
        if (['aprobado', 'cambios'].indexOf(body.decision) < 0) return json({ error: 'Decisión no válida.' }, 400);
        var com = String(body.comentario || '').trim().slice(0, 2000);
        if (body.decision === 'cambios' && !com) return json({ error: 'Cuéntame qué hay que cambiar.' }, 400);
        res.revision = { estado: body.decision, comentario: com, fecha: ahora() };
        if (body.decision === 'cambios') {
          crear('Corrige el resultado anterior "' + res.titulo + '".\nCambios pedidos: ' + com + '\n\nResultado anterior (resumen): ' + res.resumen.slice(0, 600) +
            (res.cambio_web ? '\n\nOrden de cambio web anterior:\n' + String(res.cambio_web.orden || '').slice(0, 2500) : ''), { origen: 'cambios', relacionada: res.id });
        }
      }
      guardar('resultados', res);
      return json(vistaResultado(res));
    }
    return json({ error: 'No encontrado.' }, 404);
  };

  /* ---------- ajustes (contexto y agentes) ---------- */
  var slugRe = /[^a-z0-9]+/g;
  window.FabricaEngine = {
    config: function () { return clonar(config); },
    onConfig: function (f) { escuchas.push(f); },
    guardarContexto: function (txt) { config.contexto = String(txt); return guardarConfig(); },
    guardarAgente: function (a) {
      var slug = a.slug || String(a.nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(slugRe, '-').replace(/^-+|-+$/g, '');
      if (!slug || slug === 'capataz') throw new Error('Ese nombre no es válido.');
      var nuevo = { slug: slug, nombre: String(a.nombre || slug).slice(0, 60), funcion: String(a.funcion || '').slice(0, 300), instrucciones: String(a.instrucciones || '') };
      var i = config.agentes.findIndex(function (x) { return x.slug === slug; });
      if (i < 0) config.agentes.push(nuevo); else config.agentes[i] = nuevo;
      return guardarConfig().then(function () { return slug; });
    },
    borrarAgente: function (slug) {
      if (slug === 'web') throw new Error('El agente Web no se puede quitar.');
      config.agentes = config.agentes.filter(function (x) { return x.slug !== slug; }); delete estados[slug]; return guardarConfig();
    },
    restaurar: function () { config = Object.assign(clonar({ contexto: DEF.contexto, agentes: DEF.agentes }), { v: config.v }); return guardarConfig(); }
  };

  if (window.claude && window.claude.use) { conectarDb(); conectarSample(); }
})();
