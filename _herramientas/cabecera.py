"""Regenera la cabecera común en todas las páginas del sitio.

Uso (desde la raíz del repositorio):  python3 -I _herramientas/cabecera.py

Para añadir una sección al menú, edita MENU y vuelve a ejecutar el script.
El diseño de la cabecera está en site-header.css.
"""
import os
import re
import urllib.parse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# (texto, página o ancla en index.html)
MENU = [
    ('Inicio', 'index.html#inicio'),
    ('Catálogo', 'index.html#catalogo'),
    ('Café Mocay', 'cafe-mocay.html'),
    ('Pascual', 'pascual.html'),
    ('Vinos', 'vinos.html'),
    ('Aguas', 'agua.html'),
    ('Despensa', 'despensa.html'),
    ('Refrigerados', 'refrigerados.html'),
    ('Congelados', 'congelados.html'),
]
# Botón flotante de WhatsApp (se escribe igual en todas las páginas)
WA_NUMBER = '34635098044'
WA_TEXT = 'Hola, soy [negocio] de [localidad] y quiero información para hacer pedidos'
WA_ICON = ('<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.18 1.6 6L4 29l8.15-1.57a12 12 0 0 0 3.89.65C22.67 28.08 28 22.68 28 16.05 28 9.4 22.68 3 16.04 3zm0 22.04c-1.2 0-2.38-.32-3.4-.93l-.5-.3-4.84.93.97-4.72-.32-.52a9.9 9.9 0 0 1-1.52-5.27c0-5.5 4.47-9.97 9.98-9.97 5.5 0 9.97 4.47 9.97 9.97 0 5.5-4.47 9.8-9.97 9.8zm5.47-7.46c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.48 1.7.62.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/></svg>')
WA_HTML = ('<!-- wa-float -->\n'
           f'<a class="wa-float" href="https://wa.me/{WA_NUMBER}?text={urllib.parse.quote(WA_TEXT)}" target="_blank" rel="noopener" aria-label="Habla con nosotros por WhatsApp al 635 09 80 44">'
           f'{WA_ICON}<span>Habla con nosotros</span></a>\n'
           '<!-- /wa-float -->')
WA_RE = re.compile(r'<!-- wa-float -->.*?<!-- /wa-float -->', re.S)

# página -> (texto del elemento activo, ¿cabecera fija sobre la portada?)
PAGES = {
    'index.html': ('Inicio', True),
    'cafe-mocay.html': ('Café Mocay', True),
    'pascual.html': ('Pascual', False),
    'vinos.html': ('Vinos', False),
    'agua.html': ('Aguas', False),
    'despensa.html': ('Despensa', False),
    'refrigerados.html': ('Refrigerados', False),
    'congelados.html': ('Congelados', False),
}


def header(page):
    active, fixed = PAGES[page]
    home = page == 'index.html'
    links = []
    for text, href in MENU:
        if home and href.startswith('index.html#'):
            href = href.split('index.html', 1)[1]          # en la portada, anclas internas
        cur = ' aria-current="page"' if text == active else ''
        if text == active and not home:
            href = '#contenido'
        links.append(f'<a href="{href}"{cur}>{text}</a>')
    brand = '#inicio' if home else 'index.html#inicio'
    contact = '#contacto' if home else 'index.html#contacto'
    cls = 'site-header is-fixed' if fixed else 'site-header'
    return (f'<header class="{cls}" id="top">\n'
            f'  <a class="sh-brand" href="{brand}" aria-label="Distribuciones Valentín, inicio"><img src="assets/logo.png" width="400" height="400" alt=""><span>Distribuciones Valentín</span></a>\n'
            f'  <nav aria-label="Principal">{"".join(links)}</nav>\n'
            f'  <a class="sh-contact" href="{contact}">Contactar <span aria-hidden="true">↗</span></a>\n'
            f'</header>')


HEADER_RE = re.compile(r'<header class="(?:top|m-top|pw-header|site-header)[^"]*"[^>]*>.*?</header>', re.S)

for page in PAGES:
    p = os.path.join(ROOT, page)
    h = open(p, encoding='utf-8').read()
    new = header(page)
    if not HEADER_RE.search(h):
        raise SystemExit(f'{page}: no se encontró la cabecera')
    h = HEADER_RE.sub(lambda m: new, h, count=1)
    if WA_RE.search(h):
        h = WA_RE.sub(lambda m: WA_HTML, h, count=1)
    else:
        h = h.replace('</body>', WA_HTML + '\n</body>', 1)
    if 'site-header.css' not in h:
        h = h.replace('</head>', '<link rel="stylesheet" href="site-header.css?v=1">\n</head>', 1)
    if 'site-header.js' not in h:
        h = h.replace('</body>', '<script src="site-header.js?v=1" defer></script>\n</body>', 1)
    open(p, 'w', encoding='utf-8').write(h)
    print('ok', page)
