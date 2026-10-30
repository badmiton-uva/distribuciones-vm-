#!/usr/bin/env node
'use strict';
/**
 * Fábrica de Agentes · Distribuciones Valentín
 * Servidor local (solo módulos de Node, sin dependencias).
 *
 *  - Sirve la web de /web en http://localhost:3737
 *  - Guarda las peticiones en /inbox y lee los resultados de /results
 *  - Lanza a Claude Code (`claude -p`) con las instrucciones del capataz.
 *    Usa tu suscripción: se retiran las claves de API del entorno del proceso hijo.
 *  - Ejecuta las tareas programadas de schedules.md
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3737;
const HOST = '127.0.0.1'; // solo accesible desde este ordenador
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const TIMEOUT_MS = (Number(process.env.FABRICA_TIMEOUT_MIN) || 15) * 60 * 1000;

const P = {
  agents: path.join(ROOT, 'agents'),
  inbox: path.join(ROOT, 'inbox'),
  results: path.join(ROOT, 'results'),
  state: path.join(ROOT, 'state'),
  logs: path.join(ROOT, 'state', 'logs'),
  catalogo: path.join(ROOT, 'state', 'catalogo'),
  web: path.join(ROOT, 'web'),
  schedules: path.join(ROOT, 'schedules.md'),
  agentState: path.join(ROOT, 'state', 'agentes.json'),
  schedState: path.join(ROOT, 'state', 'schedules.json'),
};
for (const d of [P.inbox, P.results, P.state, P.logs]) fs.mkdirSync(d, { recursive: true });

/* ---------- utilidades ---------- */
const ID_RE = /^[a-z0-9-]+$/;
const readJSON = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return fallback; } };
const writeJSON = (f, data) => {
  const tmp = `${f}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, f);
};
const nuevoId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const ahora = () => new Date().toISOString();
const log = (...a) => console.log(new Date().toLocaleTimeString('es-ES'), ...a);

/* ---------- agentes ---------- */
function leerAgentes() {
  const estados = readJSON(P.agentState, {});
  let ficheros = [];
  try { ficheros = fs.readdirSync(P.agents).filter((f) => f.endsWith('.md')); } catch (_) { /* vacío */ }
  const lista = ficheros.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const txt = fs.readFileSync(path.join(P.agents, f), 'utf8');
    const fm = (txt.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ''])[1];
    const campo = (k) => ((fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')) || [])[1] || '').trim();
    const st = estados[slug] || {};
    return {
      slug,
      nombre: campo('nombre') || slug,
      funcion: campo('funcion'),
      tono: campo('tono'),
      estado: st.estado || 'libre',
      tarea: st.tarea || '',
      actualizado: st.actualizado || null,
    };
  });
  // el capataz siempre primero
  return lista.sort((a, b) => (a.slug === 'capataz' ? -1 : b.slug === 'capataz' ? 1 : a.nombre.localeCompare(b.nombre, 'es')));
}

function ponerEstado(slug, estado, tarea) {
  const data = readJSON(P.agentState, {});
  data[slug] = { estado, tarea: tarea || '', actualizado: ahora() };
  writeJSON(P.agentState, data);
}

function reiniciarEstados() {
  const data = {};
  for (const a of leerAgentes()) data[a.slug] = { estado: 'libre', tarea: '', actualizado: ahora() };
  writeJSON(P.agentState, data);
}

/* ---------- peticiones (inbox) ---------- */
const fPet = (id) => path.join(P.inbox, `${id}.json`);
const fRes = (id) => path.join(P.results, `${id}.json`);

function crearPeticion(texto, extra = {}) {
  const id = nuevoId();
  const pet = { id, texto, estado: 'nueva', creado: ahora(), origen: 'web', ...extra };
  writeJSON(fPet(id), pet);
  encolar(id);
  return pet;
}

function listarPeticiones() {
  let ficheros = [];
  try { ficheros = fs.readdirSync(P.inbox).filter((f) => f.endsWith('.json')); } catch (_) { /* vacío */ }
  return ficheros
    .map((f) => readJSON(path.join(P.inbox, f), null))
    .filter(Boolean)
    .sort((a, b) => String(a.creado).localeCompare(String(b.creado)))
    .map((p) => {
      const res = p.estado === 'terminada' ? leerResultado(p.id) : null;
      return { ...p, resultado: res ? { titulo: res.titulo, resumen: res.resumen } : null };
    });
}

/* ---------- resultados ---------- */
function leerResultado(id) {
  if (!ID_RE.test(id)) return null;
  const f = fRes(id);
  const r = readJSON(f, null);
  if (!r || typeof r !== 'object') return null;
  let creado = ahora();
  try { creado = fs.statSync(f).mtime.toISOString(); } catch (_) { /* ignorar */ }
  return {
    id,
    titulo: String(r.titulo || 'Resultado sin título'),
    resumen: String(r.resumen || ''),
    agentes: Array.isArray(r.agentes) ? r.agentes.map(String) : [],
    entregables: (Array.isArray(r.entregables) ? r.entregables : []).map((e) => ({
      agente: String((e && e.agente) || ''),
      titulo: String((e && e.titulo) || ''),
      tipo: String((e && e.tipo) || 'informe'),
      contenido: String((e && e.contenido) || ''),
    })),
    requiere_aprobacion: r.requiere_aprobacion !== false,
    pendiente: Array.isArray(r.pendiente) ? r.pendiente.map(String) : [],
    revision: r.revision || { estado: 'pendiente' },
    creado,
  };
}

function listarResultados() {
  let ficheros = [];
  try { ficheros = fs.readdirSync(P.results).filter((f) => f.endsWith('.json')); } catch (_) { /* vacío */ }
  return ficheros
    .map((f) => leerResultado(f.replace(/\.json$/, '')))
    .filter(Boolean)
    .sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
}

function decidir(id, decision, comentario) {
  const raw = readJSON(fRes(id), null);
  if (!raw) return null;
  raw.revision = { estado: decision, comentario: comentario || '', fecha: ahora() };
  writeJSON(fRes(id), raw);
  if (decision === 'cambios') {
    const titulo = raw.titulo || id;
    crearPeticion(
      `Corrige el resultado anterior "${titulo}" (id ${id}; está en results/${id}.json).\n` +
        `Cambios pedidos: ${comentario || '(sin detalle: mejora el resultado)'}\n` +
        `Genera una versión nueva con tu id de petición actual.`,
      { origen: 'cambios', relacionada: id }
    );
  }
  return leerResultado(id);
}

/* ---------- cola y ejecución con Claude Code ---------- */
const cola = [];
let ocupado = false;

function encolar(id) {
  if (!cola.includes(id)) cola.push(id);
  siguiente();
}

function siguiente() {
  if (ocupado || cola.length === 0) return;
  ocupado = true;
  const id = cola.shift();
  procesar(id).catch((e) => log('Error inesperado', e)).finally(() => { ocupado = false; siguiente(); });
}

function copiarCatalogo() {
  // Copia de solo lectura del catálogo de la web, para que los agentes lo consulten sin poder tocar la web.
  const raiz = path.join(ROOT, '..');
  try {
    fs.mkdirSync(P.catalogo, { recursive: true });
    for (const f of fs.readdirSync(raiz)) {
      if (/-products\.js$/.test(f) || f === 'PRODUCTOS-SIN-IMAGEN.md') {
        fs.copyFileSync(path.join(raiz, f), path.join(P.catalogo, f));
      }
    }
  } catch (_) { /* si la carpeta se usa fuera de la web, no pasa nada */ }
}

function entornoSinClaves() {
  const env = { ...process.env };
  // Para usar solo la suscripción: fuera cualquier clave o proveedor de pago.
  for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_FOUNDRY']) delete env[k];
  return env;
}

function procesar(id) {
  return new Promise((resolve) => {
    const pet = readJSON(fPet(id), null);
    if (!pet) return resolve();
    pet.estado = 'procesando';
    pet.iniciado = ahora();
    delete pet.error;
    writeJSON(fPet(id), pet);

    reiniciarEstados();
    copiarCatalogo();
    ponerEstado('capataz', 'trabajando', 'Analizando la petición');
    log(`▶ ${id}: ${pet.texto.slice(0, 60).replace(/\s+/g, ' ')}…`);

    const prompt = [
      'Eres el capataz de la Fábrica de Agentes. Lo primero: lee agents/capataz.md y sigue ese documento al pie de la letra.',
      `Id de la petición: ${id}`,
      `Archivo de la petición: inbox/${id}.json`,
      `Escribe el resultado en results/${id}.json con el formato indicado.`,
      `Fecha y hora actual: ${new Date().toLocaleString('es-ES')}.`,
      'Los catálogos de la web (solo lectura) están copiados en state/catalogo/.',
    ].join('\n');

    const args = [
      '-p', prompt,
      '--allowedTools', 'Read,Write,Edit,Glob,Grep,Agent,Task,WebSearch,WebFetch,Bash(node tools/estado.js:*)',
      '--disallowedTools', 'Edit(context/**),Write(context/**),Edit(agents/**),Write(agents/**),Edit(server.js),Write(server.js)',
    ];

    const logFile = path.join(P.logs, `${id}.log`);
    const out = fs.createWriteStream(logFile);
    let cola_texto = '';
    let terminado = false;
    let hijo;

    const cerrar = (error) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timer);
      out.end();
      const p2 = readJSON(fPet(id), pet);
      const res = leerResultado(id);
      if (!error && res) {
        p2.estado = 'terminada';
        delete p2.error;
        log(`✔ ${id} terminada`);
      } else {
        p2.estado = 'error';
        p2.error = error || 'El capataz terminó pero no dejó ningún resultado. Pulsa "Reintentar".';
        log(`✖ ${id}: ${p2.error}`);
      }
      p2.terminado = ahora();
      writeJSON(fPet(id), p2);
      // Deja los estados coherentes: nadie queda "trabajando"
      const st = readJSON(P.agentState, {});
      for (const k of Object.keys(st)) if (st[k].estado === 'trabajando') st[k] = { ...st[k], estado: 'terminado', actualizado: ahora() };
      st.capataz = { estado: error ? 'libre' : 'terminado', tarea: error ? '' : (res ? res.titulo : ''), actualizado: ahora() };
      writeJSON(P.agentState, st);
      resolve();
    };

    try {
      hijo = spawn(CLAUDE_BIN, args, { cwd: ROOT, env: entornoSinClaves(), stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    } catch (e) {
      return cerrar(`No se pudo lanzar "${CLAUDE_BIN}": ${e.message}`);
    }

    const timer = setTimeout(() => {
      try { hijo.kill('SIGTERM'); } catch (_) { /* ignorar */ }
      cerrar(`Se agotó el tiempo (${Math.round(TIMEOUT_MS / 60000)} min). Prueba con una petición más pequeña.`);
    }, TIMEOUT_MS);

    const recoger = (b) => { out.write(b); cola_texto = (cola_texto + b.toString()).slice(-600); };
    hijo.stdout.on('data', recoger);
    hijo.stderr.on('data', recoger);
    hijo.on('error', (e) => {
      cerrar(e.code === 'ENOENT'
        ? 'No se encuentra Claude Code. Instálalo (npm i -g @anthropic-ai/claude-code) e inicia sesión con tu suscripción.'
        : `Error al lanzar Claude Code: ${e.message}`);
    });
    hijo.on('close', (code) => {
      if (code === 0) return cerrar(null);
      const limite = /limit|usage|quota|rate/i.test(cola_texto);
      const sesion = /log ?in|auth|credential/i.test(cola_texto);
      cerrar(limite
        ? 'Has llegado al límite de uso de tu suscripción. Vuelve a intentarlo más tarde.'
        : sesion
          ? 'Claude Code no tiene la sesión iniciada. Ejecuta "claude" en una terminal e inicia sesión.'
          : `Claude Code terminó con error (código ${code}). Detalle en state/logs/${id}.log`);
    });
  });
}

function recuperarCola() {
  // Si el servidor se apagó a mitad de una tarea, se reintenta.
  for (const p of listarPeticiones()) {
    if (p.estado === 'procesando' || p.estado === 'nueva') {
      const real = readJSON(fPet(p.id), null);
      if (real) { real.estado = 'nueva'; writeJSON(fPet(p.id), real); }
      cola.push(p.id);
    }
  }
  siguiente();
}

/* ---------- tareas programadas ---------- */
const DIAS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
const quitarTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function leerProgramadas() {
  let txt = '';
  try { txt = fs.readFileSync(P.schedules, 'utf8'); } catch (_) { return []; }
  const i = txt.search(/^##\s+Tareas activas/im);
  if (i < 0) return [];
  const re = /^-\s+cada\s+(d[ií]a|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)(?:\s+a\s+las\s+(\d{1,2}):(\d{2}))?\s*:\s*(.+)$/i;
  return txt.slice(i).split(/\r?\n/).map((l) => l.trim().match(re)).filter(Boolean).map((m) => ({
    dia: quitarTildes(m[1]),
    h: m[2] === undefined ? 9 : Math.min(23, Number(m[2])),
    min: m[3] === undefined ? 0 : Math.min(59, Number(m[3])),
    texto: m[4].trim(),
    clave: m[0],
  }));
}

function revisarProgramadas() {
  const ahoraD = new Date();
  const hoy = `${ahoraD.getFullYear()}-${String(ahoraD.getMonth() + 1).padStart(2, '0')}-${String(ahoraD.getDate()).padStart(2, '0')}`;
  const minutos = ahoraD.getHours() * 60 + ahoraD.getMinutes();
  const hechas = readJSON(P.schedState, {});
  let cambio = false;
  for (const t of leerProgramadas()) {
    const tocaHoy = t.dia === 'dia' || DIAS[t.dia] === ahoraD.getDay();
    if (!tocaHoy || minutos < t.h * 60 + t.min || hechas[t.clave] === hoy) continue;
    hechas[t.clave] = hoy;
    cambio = true;
    log(`⏰ Tarea programada: ${t.texto.slice(0, 60)}…`);
    crearPeticion(t.texto, { origen: 'programada', programada: t.clave });
  }
  if (cambio) writeJSON(P.schedState, hechas);
}

/* ---------- servidor HTTP ---------- */
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const CABECERAS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'",
};
const HOSTS_OK = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);

function enviar(res, code, body, tipo = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': tipo, ...CABECERAS });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const trozos = [];
    req.on('data', (c) => { n += c.length; if (n > 20000) { reject(new Error('grande')); req.destroy(); } else trozos.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(trozos).toString('utf8') || '{}')); } catch (_) { reject(new Error('json')); } });
    req.on('error', reject);
  });
}

async function api(req, res, url) {
  const ruta = url.pathname;
  const m = req.method;
  let r;

  if (m === 'GET' && ruta === '/api/agentes') return enviar(res, 200, leerAgentes());
  if (m === 'GET' && ruta === '/api/peticiones') return enviar(res, 200, listarPeticiones());
  if (m === 'GET' && ruta === '/api/resultados') return enviar(res, 200, listarResultados());

  if (m === 'POST' && ruta === '/api/peticiones') {
    const body = await leerCuerpo(req);
    const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
    if (!texto || texto.length > 4000) return enviar(res, 400, { error: 'Escribe una petición de hasta 4000 caracteres.' });
    return enviar(res, 201, crearPeticion(texto));
  }

  if ((r = ruta.match(/^\/api\/peticiones\/([a-z0-9-]+)\/reintentar$/)) && m === 'POST') {
    const pet = readJSON(fPet(r[1]), null);
    if (!pet) return enviar(res, 404, { error: 'No existe esa petición.' });
    if (pet.estado !== 'error') return enviar(res, 400, { error: 'Solo se pueden reintentar las peticiones con error.' });
    pet.estado = 'nueva'; delete pet.error;
    writeJSON(fPet(pet.id), pet);
    encolar(pet.id);
    return enviar(res, 200, pet);
  }

  if ((r = ruta.match(/^\/api\/resultados\/([a-z0-9-]+)\/decision$/)) && m === 'POST') {
    const body = await leerCuerpo(req);
    if (!['aprobado', 'cambios'].includes(body.decision)) return enviar(res, 400, { error: 'Decisión no válida.' });
    const comentario = typeof body.comentario === 'string' ? body.comentario.trim().slice(0, 2000) : '';
    if (body.decision === 'cambios' && !comentario) return enviar(res, 400, { error: 'Cuéntame qué hay que cambiar.' });
    const out = decidir(r[1], body.decision, comentario);
    return out ? enviar(res, 200, out) : enviar(res, 404, { error: 'No existe ese resultado.' });
  }

  return enviar(res, 404, { error: 'No encontrado.' });
}

function estatico(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(P.web, rel));
  if (!file.startsWith(P.web + path.sep)) return enviar(res, 403, 'Prohibido', 'text/plain; charset=utf-8');
  fs.readFile(file, (err, data) => {
    if (err) return enviar(res, 404, 'No encontrado', 'text/plain; charset=utf-8');
    enviar(res, 200, data, TIPOS[path.extname(file).toLowerCase()] || 'application/octet-stream');
  });
}

const servidor = http.createServer(async (req, res) => {
  try {
    // Protección: solo se atiende a peticiones que vienen de este mismo ordenador y de esta misma web.
    if (!HOSTS_OK.has(req.headers.host || '')) return enviar(res, 403, { error: 'Host no permitido.' });
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'POST') {
        const origen = req.headers.origin;
        if (origen && !HOSTS_OK.has(origen.replace(/^https?:\/\//, ''))) return enviar(res, 403, { error: 'Origen no permitido.' });
        if (!/^application\/json/i.test(req.headers['content-type'] || '')) return enviar(res, 415, { error: 'Se esperaba JSON.' });
      }
      return await api(req, res, url);
    }
    if (req.method !== 'GET') return enviar(res, 405, 'Método no permitido', 'text/plain; charset=utf-8');
    return estatico(req, res, url);
  } catch (e) {
    if (!res.headersSent) enviar(res, 400, { error: 'Petición no válida.' });
  }
});

servidor.listen(PORT, HOST, () => {
  log(`Fábrica de Agentes lista en http://localhost:${PORT}`);
  log(`Claude Code: "${CLAUDE_BIN}" (sin claves de API; se usa tu suscripción)`);
  reiniciarEstados();
  recuperarCola();
  revisarProgramadas();
  setInterval(revisarProgramadas, 30 * 1000);
});

servidor.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `El puerto ${PORT} está ocupado. Usa: PORT=3800 node server.js` : e.message);
  process.exit(1);
});
