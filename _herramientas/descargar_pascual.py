"""Descarga las fotos de yogures, Yogikids y natillas de la tienda de Pascual Profesional.

Uso (en tu ordenador, con internet):  python3 _herramientas/descargar_pascual.py [carpeta_destino]

Sin dependencias externas. NO se ha podido probar desde el entorno de desarrollo (la red lo bloquea):
si la tienda cambió su estructura y no encuentra nada, descarga las fotos a mano desde
https://clientes.pascualprofesional.com/ y envíalas con el nombre del sabor.
"""
import os, re, sys, html, urllib.request, urllib.parse

BASE = 'https://clientes.pascualprofesional.com/'
# Páginas de categoría donde buscar fichas de producto (se rastrean enlaces a /p/<código>)
START = [BASE + 'calidadpascual/es/', BASE + 'calidadpascual/es/L%C3%A1cteos-y-Bebidas-Vegetales/Yogures/c/yogures']
WANT = re.compile(r'yogur|yogikids|natilla', re.I)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'fotos_pascual'
UA = {'User-Agent': 'Mozilla/5.0'}


def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        d = r.read()
    return d if binary else d.decode('utf-8', 'replace')


os.makedirs(OUT, exist_ok=True)
seen, queue, found = set(), list(START), {}
while queue and len(seen) < 80:
    u = queue.pop(0)
    if u in seen:
        continue
    seen.add(u)
    try:
        page = get(u)
    except Exception as e:
        print('no se pudo abrir', u, e)
        continue
    for href in re.findall(r'href="([^"]+)"', page):
        full = urllib.parse.urljoin(u, html.unescape(href))
        if not full.startswith(BASE):
            continue
        if '/p/' in full and WANT.search(urllib.parse.unquote(full)):
            found[full] = None
        elif '/c/' in full and WANT.search(urllib.parse.unquote(full)) and full not in seen:
            queue.append(full)

print(len(found), 'fichas encontradas')
for url in found:
    try:
        page = get(url)
    except Exception as e:
        print('error', url, e)
        continue
    title = re.search(r'<title>([^<]+)', page)
    name = re.sub(r'[^a-z0-9]+', '-', html.unescape(title.group(1) if title else url).lower()).strip('-')[:70]
    img = re.search(r'<meta property="og:image" content="([^"]+)"', page)
    if not img:
        print('sin imagen', url)
        continue
    src = urllib.parse.urljoin(url, html.unescape(img.group(1)))
    ext = os.path.splitext(urllib.parse.urlparse(src).path)[1] or '.png'
    with open(os.path.join(OUT, name + ext), 'wb') as f:
        f.write(get(src, True))
    print('ok', name + ext)
