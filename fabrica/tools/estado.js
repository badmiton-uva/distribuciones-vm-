#!/usr/bin/env node
// Uso: node tools/estado.js <agente> <libre|trabajando|terminado> "<tarea>"
// Lo usa el capataz para que la web muestre qué hace cada agente.
const fs = require('fs');
const path = require('path');

const [, , agente, estado, ...resto] = process.argv;
const tarea = resto.join(' ').slice(0, 200);
const VALIDOS = ['libre', 'trabajando', 'terminado'];

if (!agente || !/^[a-z0-9-]+$/.test(agente) || !VALIDOS.includes(estado)) {
  console.error('Uso: node tools/estado.js <agente> <libre|trabajando|terminado> "<tarea>"');
  process.exit(1);
}

const dir = path.join(__dirname, '..', 'state');
const file = path.join(dir, 'agentes.json');
fs.mkdirSync(dir, { recursive: true });

let data = {};
try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { /* primera vez */ }

data[agente] = { estado, tarea, actualizado: new Date().toISOString() };
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log(`${agente}: ${estado}`);
