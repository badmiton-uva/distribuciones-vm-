#!/usr/bin/env node
'use strict';
/**
 * Cambios en la web con Git, de forma segura.
 *
 * Cada cambio se hace en una COPIA aparte (una rama "fabrica/<id>" dentro de fabrica/state/worktrees/<id>).
 * Tu web real no se toca hasta que apruebas el cambio en la página; entonces se une a tu rama actual.
 * Publicar en internet (git push) es un paso aparte, también con tu botón.
 *
 * Uso por el capataz / agente web:
 *   node tools/web-cambio.js crear <id> [rama-base]   → prepara la copia de trabajo
 *   node tools/web-cambio.js guardar <id> "mensaje"    → guarda (commit) lo que has cambiado
 * El servidor usa además: info, aplicar, publicar, descartar.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const WT = path.join(__dirname, '..', 'state', 'worktrees');
const IDENT = ['-c', 'user.name=Fábrica de Agentes', '-c', 'user.email=fabrica@distribucionesvm.es'];
const ID_RE = /^[a-z0-9-]+$/;
const RAMA_RE = /^[A-Za-z0-9._\/-]+$/;
// Lo que un cambio de web nunca puede tocar
const PROTEGIDO = ['fabrica', '.github'];

function git(args, cwd) {
  const r = spawnSync('git', [...IDENT, ...args], { cwd: cwd || REPO, encoding: 'utf8' });
  if (r.error) throw new Error('No se encuentra Git en este ordenador.');
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'Git ha fallado').trim());
  return (r.stdout || '').trim();
}
function intentar(args, cwd) { try { return git(args, cwd); } catch (_) { return null; } }
function validarId(id) { if (!ID_RE.test(id || '')) throw new Error('Id no válido.'); return id; }
const dirDe = (id) => path.join(WT, validarId(id));
const ramaDe = (id) => `fabrica/${validarId(id)}`;

function esRepo() { return intentar(['rev-parse', '--is-inside-work-tree']) === 'true'; }

function crear(id, base) {
  if (!esRepo()) throw new Error('Esta carpeta no está dentro de un repositorio Git: no se pueden preparar cambios de web.');
  const dir = dirDe(id);
  const rama = ramaDe(id);
  if (base && !RAMA_RE.test(base)) throw new Error('Rama base no válida.');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(WT, { recursive: true });
    if (intentar(['rev-parse', '--verify', '--quiet', rama])) git(['worktree', 'add', dir, rama]);
    else git(['worktree', 'add', '-b', rama, dir, base || 'HEAD']);
  }
  return { dir, rama, relativo: path.relative(path.join(__dirname, '..'), dir).split(path.sep).join('/') };
}

function guardar(id, mensaje) {
  const dir = dirDe(id);
  if (!fs.existsSync(dir)) throw new Error('Primero ejecuta: node tools/web-cambio.js crear <id>');
  // Fuera lo que no se puede tocar
  for (const p of PROTEGIDO) {
    intentar(['checkout', 'HEAD', '--', p], dir);
    intentar(['clean', '-fdq', '--', p], dir);
  }
  git(['add', '-A'], dir);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: dir }).status === 0) return { cambios: false, archivos: [] };
  const archivos = git(['diff', '--cached', '--name-only'], dir).split('\n').filter(Boolean);
  git(['commit', '-q', '-m', String(mensaje || 'Cambio de la Fábrica de Agentes').slice(0, 200)], dir);
  return { cambios: true, archivos };
}

function info(id) {
  if (!esRepo()) return null;
  const rama = ramaDe(id);
  if (!intentar(['rev-parse', '--verify', '--quiet', rama])) return null;
  const salida = intentar(['diff', '--name-status', `HEAD...${rama}`]);
  if (!salida) return null;
  const archivos = salida.split('\n').filter(Boolean).map((l) => {
    const [estado, ...r] = l.split('\t');
    return { estado: { A: 'nuevo', M: 'modificado', D: 'borrado' }[estado[0]] || estado, ruta: r.join('\t') };
  });
  const stat = (intentar(['diff', '--shortstat', `HEAD...${rama}`]) || '').trim();
  return { rama, archivos, resumen: stat, hayCopia: fs.existsSync(dirDe(id)) };
}

function aplicar(id, titulo) {
  const rama = ramaDe(id);
  if (!intentar(['rev-parse', '--verify', '--quiet', rama])) throw new Error('Ese cambio ya no existe.');
  if (intentar(['status', '--porcelain', '--untracked-files=no'])) {
    throw new Error('Tienes cambios sin guardar en tu web. Guárdalos o descártalos y vuelve a intentarlo.');
  }
  try {
    git(['merge', '--no-ff', '-m', `Fábrica de Agentes: ${String(titulo || id).slice(0, 120)}`, rama]);
  } catch (e) {
    intentar(['merge', '--abort']);
    throw new Error('El cambio choca con la versión actual de la web. Pide cambios para que se rehaga sobre la versión nueva.');
  }
  descartar(id, true);
  return { rama: intentar(['branch', '--show-current']) };
}

function publicar() {
  const rama = intentar(['branch', '--show-current']);
  if (!rama) throw new Error('No hay una rama activa para publicar.');
  const r = spawnSync('git', ['push', 'origin', rama], { cwd: REPO, encoding: 'utf8' });
  if (r.status !== 0) {
    const lineas = (r.stderr || r.stdout || '').split('\n').map((l) => l.trim()).filter((l) => l && !/failed to push|^hint:/i.test(l));
    throw new Error(`No se pudo publicar: ${lineas.slice(-2).join(' · ') || 'error desconocido'}`);
  }
  return { rama };
}

function descartar(id, tambienRama) {
  const dir = dirDe(id);
  if (fs.existsSync(dir)) intentar(['worktree', 'remove', '--force', dir]);
  intentar(['worktree', 'prune']);
  if (tambienRama) intentar(['branch', '-D', ramaDe(id)]);
}

module.exports = { crear, guardar, info, aplicar, publicar, descartar, WT };

if (require.main === module) {
  const [, , cmd, id, ...resto] = process.argv;
  try {
    if (cmd === 'crear') {
      const r = crear(id, resto[0]);
      console.log(`Copia de la web lista en: ${r.relativo}\nRama: ${r.rama}\nEdita ahí los archivos de la web (rutas como ${r.relativo}/index.html). No toques fabrica/ ni .github/.`);
    } else if (cmd === 'guardar') {
      const r = guardar(id, resto.join(' '));
      console.log(r.cambios ? `Guardado. Archivos: ${r.archivos.join(', ')}` : 'No hay cambios que guardar.');
    } else {
      console.error('Uso: node tools/web-cambio.js crear <id> [rama-base] | guardar <id> "mensaje"');
      process.exit(1);
    }
  } catch (e) { console.error(e.message); process.exit(1); }
}
