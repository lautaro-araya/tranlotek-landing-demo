# Tranlotek · landing

Sitio de tranlotek.com (versión elegida por el cliente, ex "V3": puerta de acero + grúa). Se publica solo en el hosting cPanel de HostingPlus; GitHub Pages está desactivado (02-11-2026) para no confundir al cliente con una copia.

- `index.html`, `assets/` (css, fuentes, imágenes, js) y `enviar.php` (endpoint del formulario).
- El RUT está oculto (comentado en el pie) hasta confirmar el dato real.

## Producción (cPanel · HostingPlus)

`python -I deploy/build.py` genera `../produccion-cpanel/public_html/` y `tranlotek-public_html.zip`: quita el `noindex`, agrega `canonical`, `robots.txt` abierto, `sitemap.xml` y el `.htaccess` (`deploy/htaccess`: HTTPS sin www, caché, compresión y cabeceras de seguridad). Antes de generar, reemplazar los datos marcados `REEMPLAZAR` en `index.html` y `enviar.php`.
