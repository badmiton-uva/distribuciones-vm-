# Subpágina Café Mocay — recursos y estado

## Integración

- Página: `cafe-mocay.html`.
- Estilos: `cafe-mocay.css`.
- Movimiento: `cafe-mocay.js`.
- Entrada desde la sección Café de `index.html`; el botón final enlaza al contacto ya existente.

## Imágenes que usa la subpágina

| Recurso | Archivo | Estado |
| --- | --- | --- |
| Logotipo Distribuciones Valentín | `assets/logo.png` | Existente en el proyecto. |
| Logotipo Mocay | `assets/marcas/mocay-logo.svg` | Archivo oficial existente; autorización de publicación pendiente según `RECURSOS-PENDIENTES.md`. |
| Maestro Colombia | `assets/marcas/mocay-cafe-arabica.jpg` | Imagen existente procedente de Pascual Profesional; se muestra sin alterar el etiquetado, mediante un recorte CSS de la bolsa. Autorización de publicación pendiente. |
| Fotografía Mocay Academy | `assets/cliente/web-5.jpg` | Procedente de la web actual del cliente; confirmar derecho de reutilización. |
| Maestro, Barista, descafeinados, cápsulas e infusiones | `assets/mocay/*.png` | Recortes deterministas de las dos capturas del catálogo aportadas por el usuario el 26 de octubre de 2026. Son reproducciones fieles de los píxeles capturados, sin redibujar envases ni etiquetas. La resolución de los envases es limitada; sustituirlos por archivos oficiales originales antes de publicar. |
| Tazas de infusión Mocay | `assets/mocay/tazas-infusion.png` | Recorte de la captura aportada. Ilustra la vajilla; no representa azúcar, galletas ni los demás complementos. |

## Fotografías oficiales pendientes

La web muestra las fotografías que ya existen y deja el resto descrito en texto, sin simular un envase ni alterar un logotipo.

- Fotografías originales en alta resolución de Maestro Ecológico y Natural; Barista B1, B2, B3 y Tueste Italiano; descafeinados; cápsulas; e infusiones para sustituir los recortes de pantalla.
- Azúcar, edulcorantes, leche condensada, galletas y vasos para llevar. Las tazas disponibles proceden de la sección de complementos para infusiones del catálogo.
- Fotografía de cafeteras, molinos y personal de asistencia técnica de la empresa, si se desea ilustrar cada servicio.

El usuario ha aportado capturas del catálogo. Solicitar originales o autorización para usar estas imágenes antes de publicar.

## Referencias de contenido

- Capturas aportadas por el usuario en la conversación, 26 de octubre de 2026; dos de ellas se han usado como fuentes de los recortes en `assets/mocay/`.
- Catálogo oficial de producto Mocay 2024: <https://www.pascualprofesional.com/pdf/catalogo_mocay_producto_2024.pdf>.
- Catálogo oficial Mocay: <https://www.mocay.com/pdf/Catalogo_Producto_InfusionesTes_2024.pdf>.
- Pascual Profesional, Mocay Academy: <https://www.pascualprofesional.com/mocay-academy/>.

Los nombres de productos y servicios de la página se limitan a esas capturas y al encargo del usuario. No se muestran intensidades, notas de cata, precios ni condiciones comerciales sin verificación.

## Técnica

El recorrido de cinco familias mantiene una escena visual común y calcula continuamente su estado a partir de la posición vertical. Avanzar y retroceder reproduce las mismas transiciones en sentido inverso. Los envases se distribuyen en varios planos y se desplazan levemente según su profundidad; no se simula una rotación tridimensional del envase. El encabezado, los enlaces y el contacto siguen el sitio principal. GSAP se usa para la entrada y el paralaje cuando carga; si la CDN no está disponible, la progresión de las gamas funciona con JavaScript local y la entrada inicial con CSS. `prefers-reduced-motion` elimina los desplazamientos animados de la escena.

La cadena de vídeo generado de la skill `scroll-world` requeriría proveedores de pago y podría deformar envases o etiquetas. No se ha usado. La solución aplica la coordinación de escenas y el control por desplazamiento a fotografías auténticas, conforme a la prioridad de realismo y a la prohibición de añadir servicios externos de pago sin consulta.

## Catálogo de infusiones (`#infusiones`)

Sección con 19 infusiones pirámide (lata de 20 unidades) y 6 clásicas (caja de 100 bolsitas, 25x4), con los nombres y textos de las capturas aportadas por el cliente. Las imágenes son recortes de esas capturas (`assets/mocay/pir-*.webp` y `clasica-*.webp`), sin redibujar, y se muestran con `mix-blend-mode:multiply` sobre el fondo. **Infusiones a granel: el cliente no las trabaja y no se muestran.** Sustituir por fotos originales cuando estén disponibles.
