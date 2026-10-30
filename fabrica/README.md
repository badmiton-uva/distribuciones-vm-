# Fábrica de Agentes · Distribuciones Valentín

Un equipo de agentes de IA que trabaja con tu **suscripción de Claude**. No usa la API de pago ni ningún servicio con coste extra.

**Cómo funciona en una frase:** escribes una petición en la web → se guarda en `inbox/` → el **capataz** (Claude Code) la reparte entre los especialistas → deja el resultado en `results/` → lo ves en la web y decides: aprobar o pedir cambios.

> Los agentes **nunca envían** correos ni mensajes a clientes. Todo lo que saldría al exterior queda como borrador para que lo revises.

---

## 1. Ponerlo en marcha (una vez)

Necesitas un ordenador de la empresa con:

1. **Node.js 18 o superior** → https://nodejs.org (descarga "LTS").
2. **Claude Code** con la sesión iniciada con tu suscripción:
   ```
   npm install -g @anthropic-ai/claude-code
   claude
   ```
   La primera vez te pide iniciar sesión: elige **tu cuenta de Claude** (suscripción), no una clave de API.

Comprueba que funciona escribiendo `claude -p "di hola"` en una terminal. Si responde, está listo.

## 2. Arrancar la fábrica

En una terminal, dentro de la carpeta `fabrica`:

```
node server.js
```

Abre **http://localhost:3737** en el navegador. Verás el chat, el equipo y los resultados.
Para pararlo: `Ctrl + C` en la terminal. Si el servidor está apagado, no se procesan peticiones ni tareas programadas.

Opciones (variables de entorno, todas opcionales):

| Variable | Para qué | Por defecto |
|---|---|---|
| `PORT` | Cambiar el puerto (la vista previa usa el siguiente) | `3737` |
| `CLAUDE_BIN` | Ruta de Claude Code si no está en el PATH | `claude` |
| `FABRICA_TIMEOUT_MIN` | Minutos máximos por petición | `15` |

Ejemplo: `PORT=3800 node server.js` (en Windows PowerShell: `$env:PORT=3800; node server.js`).

## 3. Cómo se conectan la web y los agentes

```
 Navegador  ──►  server.js  ──►  inbox/<id>.json      (la petición)
    ▲               │
    │               └──►  claude -p  (capataz)  ──►  subagentes (ventas, presupuestos…)
    │                                   │
    └──────────  results/<id>.json  ◄───┘             (el resultado)
```

- `server.js` es un servidor pequeño que **solo escucha en tu ordenador** (127.0.0.1). No es accesible desde internet.
- Procesa **una petición cada vez**, en orden, para no agotar tu suscripción.
- Antes de lanzar a Claude se retiran del entorno las claves `ANTHROPIC_API_KEY` y similares, para que **solo** use tu sesión de suscripción.
- Los estados de los agentes (libre / trabajando / terminado) los actualiza el capataz con `tools/estado.js`.

## 4. Las carpetas

| Carpeta / archivo | Qué es |
|---|---|
| `agents/capataz.md` | Instrucciones del coordinador |
| `agents/*.md` | Un archivo por especialista (incluido `web.md`, que cambia la web) |
| `context/empresa.md` | Todo lo que saben los agentes de la empresa |
| `inbox/` | Peticiones nuevas (las crea la web) |
| `results/` | Resultados terminados (los crea el capataz) |
| `schedules.md` | Tareas que se hacen solas |
| `web/` | La página (HTML, CSS y JS) |
| `tools/` | Pequeños programas que usan los agentes (estado y cambios de web) |
| `state/` | Estados, registros y copias de trabajo. No tocar |

---

## 5. Guías paso a paso (sin código)

### Cambiar cómo trabaja un agente
1. Abre `agents/ventas.md` (o el que quieras) con el Bloc de notas.
2. Cambia el texto: qué hace, qué tono usa, qué formato entrega.
3. Guarda. **Se aplica en la siguiente petición**, sin reiniciar nada.

La parte de arriba del archivo (entre las líneas `---`) es lo que se muestra en la web: `nombre`, `funcion` y `tono`.

### Añadir un agente nuevo
1. Copia un archivo de `agents/`, por ejemplo `ventas.md`, y llámalo `compras.md` (minúsculas, sin espacios ni tildes; usa guiones).
2. Cambia el `nombre`, la `funcion`, el `tono` y las instrucciones.
3. Guarda. Aparece solo en el panel "Equipo" y el capataz lo tendrá en cuenta.

### Quitar un agente
Mueve su archivo fuera de `agents/` (por ejemplo a una carpeta `archivo`). No borres `capataz.md`.

### Editar la información de la empresa
1. Abre `context/empresa.md`.
2. Busca las líneas con `[RELLENAR]` y escribe los datos reales: precios, pedido mínimo, horarios, clientes, preguntas frecuentes.
3. Guarda. **Cuanto más completo esté, mejores serán los resultados.** Lo que no esté aquí, los agentes lo marcarán como "pendiente de confirmar" en vez de inventarlo.

### Programar tareas
1. Abre `schedules.md`.
2. Añade una línea debajo de "Tareas activas":
   ```
   - cada martes a las 08:30: Revisa los pedidos pendientes y prepara un resumen.
   ```
3. Guarda. El servidor la lee solo (cada medio minuto).
4. Para pausar una tarea, cambia el `- ` del principio por `# `.

Importante: las tareas solo se ejecutan **con el servidor encendido**. Si lo enciendes después de la hora, esa tarea se lanza una vez ese mismo día.
Cada ejecución consume parte de tu suscripción, así que programa solo lo que de verdad te sirva.

### Pedir cambios en la web
Escribe en el chat lo que quieras, por ejemplo: *"Cambia el texto de la portada por…"* o *"Añade una sección de novedades a la página de café"*. El capataz se lo pasa al agente **Web**, que usa Claude Code para editar los archivos de la web.

Para que no pase nada raro, funciona así:
1. El agente trabaja en una **copia aparte** (una rama de Git, `fabrica/<id>`, dentro de `state/worktrees/`). Tu web real **no se toca**.
2. En "Resultados" aparece la lista de archivos cambiados y un enlace **"Ver vista previa"** (`http://localhost:3738/...`) para ver la web con los cambios.
3. **Aprobar y aplicar a la web:** une el cambio a tu rama actual de la web (en tu ordenador).
4. **Publicar en internet:** hace `git push` de esa rama. Pide confirmación con un segundo clic. La web se actualiza cuando tu sistema de publicación (GitHub Pages) la despliegue.
5. **Pedir cambios:** el agente rehace el cambio a partir de la misma copia.

Reglas de seguridad: el agente solo puede ejecutar `node tools/web-cambio.js`; no toca las carpetas `fabrica/` ni `.github/` (si lo intenta, se revierte); no publica nada por su cuenta. Necesitas **Git** instalado y que la carpeta `fabrica` esté dentro del repositorio de la web, con la web sin cambios sin guardar al aplicar.
Importante: `Publicar` sube la rama en la que estás. Mira en `.github/workflows/pages.yml` qué ramas despliegan la web.

### Aprobar o pedir cambios
En la sección "Resultados" de la web, cada tarjeta tiene dos botones:
- **Aprobar:** marca el trabajo como revisado. Copia el borrador con el botón "Copiar" y envíalo tú.
- **Pedir cambios:** escribe qué falta o qué sobra. Se crea una petición nueva y el capataz rehace el trabajo.

### Si algo falla
| Mensaje | Qué hacer |
|---|---|
| "No se puede conectar con la fábrica" | El servidor está apagado. Ejecuta `node server.js` |
| "No se encuentra Claude Code" | Instálalo (paso 1) o indica `CLAUDE_BIN` |
| "Claude Code no tiene la sesión iniciada" | Escribe `claude` en una terminal e inicia sesión |
| "Has llegado al límite de uso" | Espera a que se renueve tu límite y pulsa "Reintentar" |
| Otro error | Mira `state/logs/<id>.log` |

---

## 6. Integrarlo en la web de la empresa

La web pública (`distribucionesvm.es`) está en alojamiento estático (GitHub Pages / IONOS) y **no puede ejecutar Node ni Claude Code**. Por eso la fábrica es una herramienta interna y se queda **fuera del despliegue público** (la carpeta `fabrica` está excluida en `.github/workflows/pages.yml`).

Opciones:

1. **Uso interno (recomendado, ya funciona):** abre http://localhost:3737 en el ordenador donde corre la fábrica. Puedes ponerle un acceso directo.
2. **Enlace desde tu web:** un botón con `href="http://localhost:3737"` solo funcionará en ese ordenador. No lo pongas en la web pública; solo te sirve a ti. Si lo quieres, ponlo en una página privada.
3. **Reutilizar el diseño:** `web/styles.css` usa variables (`--accent`, `--bg`…) en `:root`. Puedes copiar esas secciones a otra página tuya.
4. **En otro ordenador o en el móvil:** necesitaría un servidor siempre encendido con acceso protegido. Está en la lista de la segunda fase.

**Seguridad:** no abras el puerto a internet ni cambies `HOST` en `server.js` sin añadir antes un inicio de sesión. Quien llegara a la página podría gastar tu suscripción y ver tus datos.

Si subes la web a IONOS por FTP, **no subas la carpeta `fabrica`**.

Si no quieres subir `inbox/` y `results/` a GitHub (pueden contener datos de clientes), ya están ignorados en `fabrica/.gitignore`.

---

## 7. Mejoras para una segunda fase

1. Acceso seguro desde fuera (túnel con contraseña) para usarlo desde el móvil.
2. Subir archivos en el chat: un albarán, un Excel de pedido, una foto de producto.
3. Conectar el correo en modo **borrador**: los agentes dejan el borrador en tu bandeja, tú envías.
4. Memoria de clientes: ficha por cliente que se actualiza sola con cada petición.
5. Cola con prioridades y botón "cancelar".
6. Informe semanal automático de actividad y consumo de la suscripción.
7. Generación de presupuestos en PDF o Excel con la imagen de la empresa.
8. Revisión automática del catálogo de la web: productos sin imagen, errores de datos.
9. Notificaciones al terminar un trabajo (escritorio o móvil).
10. Más agentes: compras a proveedores, rutas de reparto, cobros.
