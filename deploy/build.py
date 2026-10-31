"""Arma la versión de producción para cPanel (tranlotek.com).

Uso, desde la carpeta sitio/:  python -I deploy/build.py
Genera ../produccion-cpanel/public_html/ y ../produccion-cpanel/tranlotek-public_html.zip
"""
import io, os, shutil, zipfile
from datetime import date

SITIO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(os.path.dirname(SITIO), 'produccion-cpanel')
WEB = os.path.join(SALIDA, 'public_html')
DOMINIO = 'https://tranlotek.com/'

# Solo lo que usa la página; nada de archivos de trabajo
ARCHIVOS = ['index.html', 'enviar.php']
CARPETAS = ['assets/css', 'assets/js', 'assets/fonts', 'assets/img']
EXCLUIR = ('.json', '.md')
EXCLUIR_PREFIJO = ('central-antigua',)

leer = lambda p: io.open(p, encoding='utf-8').read()
def escribir(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

shutil.rmtree(SALIDA, ignore_errors=True)
for d in CARPETAS:
    for f in sorted(os.listdir(os.path.join(SITIO, d))):
        if f.endswith(EXCLUIR) or f.startswith(EXCLUIR_PREFIJO):
            continue
        os.makedirs(os.path.join(WEB, d), exist_ok=True)
        shutil.copy2(os.path.join(SITIO, d, f), os.path.join(WEB, d, f))
shutil.copy2(os.path.join(SITIO, 'enviar.php'), os.path.join(WEB, 'enviar.php'))

# index.html: indexable y con URL canónica
html = leer(os.path.join(SITIO, 'index.html'))
noindex = '  <meta name="robots" content="noindex, nofollow">\n'
assert noindex in html, 'no se encontró el meta noindex'
html = html.replace(noindex, f'  <link rel="canonical" href="{DOMINIO}">\n')
escribir(os.path.join(WEB, 'index.html'), html)

escribir(os.path.join(WEB, 'robots.txt'), f'User-agent: *\nAllow: /\n\nSitemap: {DOMINIO}sitemap.xml\n')
escribir(os.path.join(WEB, 'sitemap.xml'),
         '<?xml version="1.0" encoding="UTF-8"?>\n'
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
         f'  <url><loc>{DOMINIO}</loc><lastmod>{date.today().isoformat()}</lastmod></url>\n'
         '</urlset>\n')
shutil.copy2(os.path.join(SITIO, 'deploy', 'htaccess'), os.path.join(WEB, '.htaccess'))

# Zip con el contenido de public_html en la raíz (se extrae dentro de public_html)
zpath = os.path.join(SALIDA, 'tranlotek-public_html.zip')
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
    for raiz, _, files in os.walk(WEB):
        for f in sorted(files):
            p = os.path.join(raiz, f)
            z.write(p, os.path.relpath(p, WEB).replace(os.sep, '/'))

# Aviso de datos provisionales que siguen en el HTML
pend = [l.strip() for l in leer(os.path.join(WEB, 'index.html')).splitlines() if 'REEMPLAZAR' in l]
pend += [l.strip() for l in leer(os.path.join(WEB, 'enviar.php')).splitlines() if 'REEMPLAZAR' in l]
print('Listo:', zpath)
print(f'Marcas REEMPLAZAR pendientes: {len(pend)}')
