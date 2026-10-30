const fs=require('fs'),path=require('path');
const F='/home/claude/distribuciones-vm-/fabrica/';
const rd=p=>fs.readFileSync(F+p,'utf8');
const front=t=>{const m=t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);return {fm:m?m[1]:'',body:m?t.slice(m[0].length):t}};
const campo=(fm,k)=>((fm.match(new RegExp('^'+k+':\\s*(.+)$','m'))||[])[1]||'').trim();
const limpiar=t=>t
 .replace(/`context\/empresa\.md`/g,'el contexto de la empresa')
 .replace(/\(lee la carpeta `inbox\/` y `results\/`\)/g,'(según lo que se te indique)')
 .split('\n').filter(l=>!/state\/catalogo|catálogos de la web|Los catálogos están/.test(l)).join('\n')
 .replace(/- Revisión de los listados del catálogo de la web: productos sin imagen o sin datos\.\n?/g,'')
 .replace(/\n{3,}/g,'\n\n').trim();
const agentes=[];
for(const f of fs.readdirSync(F+'agents').sort()){
  const slug=f.replace(/\.md$/,''); if(slug==='capataz'||slug==='web')continue;
  const {fm,body}=front(rd('agents/'+f));
  agentes.push({slug,nombre:campo(fm,'nombre')||slug,funcion:campo(fm,'funcion'),instrucciones:limpiar(body)});
}
agentes.push({slug:'web',nombre:'Web',funcion:'Prepara órdenes de cambio para la web de la empresa. Claude Code las aplica cuando tú las apruebas.',instrucciones:
`# Web

Eres el especialista web de Distribuciones Valentín. No puedes editar archivos: tu trabajo es redactar una ORDEN DE CAMBIO muy precisa que Claude Code aplicará después sobre el repositorio de la web, solo cuando la persona la apruebe.

## La web
Es una web estática en HTML, CSS y JavaScript plano (sin framework). Archivos principales:
- index.html (portada), styles.css, main.js, site-header.css y site-header.js
- cafe-mocay.html, cafe-mocay.css, cafe-mocay.js
- pascual.html, vinos.html, agua.html, despensa.html, refrigerados.html, congelados.html (con su .css)
- Catálogos de producto: pascual-products.js, vinos-products.js, agua-products.js, despensa-products.js, refrigerados-products.js, congelados-products.js, helios-products.js, villacampo-products.js
- Imágenes en assets/

## Convenciones
- Al cambiar un CSS o JS hay que subir el ?v=N en todos los HTML que lo enlazan.
- No inventes rutas de imágenes: si falta una, anótalo como dato pendiente.
- No cambies teléfono, correo ni dirección salvo petición expresa.
- Textos en español y en el tono de marca. No prometas precios, plazos ni descuentos que no estén en el contexto.

## Formato de salida
## Objetivo
(una frase)

## Cambios exactos
(por archivo: qué se cambia, con el texto antes y después cuando se conozca)

## Datos que faltan
(si algo no está claro, pregúntalo aquí en vez de inventarlo)

## Qué no tocar

## Qué mirar al revisar`});
const defaults={contexto:rd('context/empresa.md').replace(/\n{3,}/g,'\n\n').trim(),agentes};
for(const a of agentes) if(/inbox|results\/|state\/|agents\/|tools\//.test(a.instrucciones)) console.log('AVISO restos en',a.slug,a.instrucciones.match(/.*(inbox|results\/|state\/|agents\/|tools\/).*/)[0]);
const esc=s=>s.replace(/</g,'\\u003c');
let html=rd('web/index.html');
const css=rd('web/styles.css'), app=rd('web/app.js');
const eng=fs.readFileSync('/home/claude/art/engine.js','utf8'), aj=fs.readFileSync('/home/claude/art/ajustes.js','utf8'), ajh=fs.readFileSync('/home/claude/art/ajustes.html','utf8');
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>\n'+css+'\n</style>')
 .replace('<meta name="robots" content="noindex, nofollow">\n','')
 .replace('<a href="#como">Cómo funciona</a>','<a href="#ajustes">Ajustes</a>\n    <a href="#como">Cómo funciona</a>')
 .replace('  <section id="como"',ajh+'  <section id="como"')
 .replace('Funciona en local con tu suscripción de Claude.','Funciona dentro de Claude con tu cuenta.')
 .replace('<script src="app.js"></script>','<script>window.__FABRICA_DEFAULTS='+esc(JSON.stringify(defaults))+';</script>\n<script>\n'+eng+'\n</script>\n<script>\n'+app+'\n</script>\n<script>\n'+aj+'\n</script>');
fs.writeFileSync('/home/claude/art/index.html',html);
console.log('ok',html.length,'agentes',agentes.map(a=>a.slug).join(','));
