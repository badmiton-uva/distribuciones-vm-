# Sistema de secciones de producto

`pascual.html` y `vinos.html` comparten `product-world.css` y `product-world.js`. Cada página define sus datos en `pascual-products.js` o `vinos-products.js`. Para añadir otra marca, duplica una de las páginas y crea un archivo de datos con `window.ProductWorld.init({ mount: '#familias', sections: [...] })`.

## Plantillas disponibles

- `hero`: un envase protagonista, con entrada, escala y profundidad vinculadas al scroll.
- `range`: varias referencias en un recorrido horizontal controlado por el scroll vertical.
- `editorial`: productos e información en una composición asimétrica.
- `story`: secuencia de productos con cambio de fondo y transición reversible.

Cada sección acepta `family`, `color`, `ink`, `eyebrow`, `title` y sus datos de producto. Cada producto utiliza `name`, `description`, `image`, `width`, `height` y `alt`. La plantilla `story` acepta `frames`, cada uno con un `color` opcional. Las imágenes se sustituyen cambiando únicamente la ruta y sus dimensiones en el archivo de datos.

El motor usa GSAP ScrollTrigger ya presente en el proyecto. Si no carga, muestra una versión estática. En móvil las escenas se apilan y se evita el desplazamiento horizontal fijado. Con `prefers-reduced-motion` se muestran todas las referencias sin animación.

## Imágenes y publicación

Las botellas de Bornos de `assets/marcas/` ya estaban en el proyecto. Las imágenes nuevas de `assets/pascual/` y `assets/vinos/` son recortes fieles de las capturas aportadas por el usuario. El recorte de Leche Pascual Intense tiene el fondo retirado mediante selección de píxeles; el envase y la etiqueta no se han redibujado. Algunas capturas tienen resolución limitada, especialmente Pinna Fidelis, Vivesoy y los envases de Bifrutas. Conviene sustituirlas por fotografías originales antes de una publicación definitiva.

Las condiciones de uso de imágenes y marcas siguen pendientes en `RECURSOS-PENDIENTES.md`. Estas páginas quedan preparadas y probadas **en local**; no publicar los nuevos recursos en un repositorio público o en producción sin confirmar sus derechos de uso.
