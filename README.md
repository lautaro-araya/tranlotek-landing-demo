# Tranlotek · landing

Demo estática de la nueva landing de tranlotek.com (versión elegida por el cliente, ex "V3": puerta de acero + grúa), publicada con GitHub Pages solo para revisión:
https://lautaro-araya.github.io/tranlotek-landing-demo/

- `index.html`, `assets/` (css, fuentes, imágenes, js) y `enviar.php` (endpoint del formulario).
- Teléfono, WhatsApp, RUT y correo son **datos provisionales**.
- El formulario apunta a `enviar.php`, que Pages no ejecuta (muestra su aviso de error).
- No indexable (`noindex` + `robots.txt`).

La versión de producción, con el endpoint PHP del formulario, se despliega en el hosting cPanel.

## Producción (cPanel · HostingPlus)

`python -I deploy/build.py` genera `../produccion-cpanel/public_html/` y `tranlotek-public_html.zip`: quita el `noindex`, agrega `canonical`, `robots.txt` abierto, `sitemap.xml` y el `.htaccess` (`deploy/htaccess`: HTTPS sin www, caché, compresión y cabeceras de seguridad). Antes de generar, reemplazar los datos marcados `REEMPLAZAR` en `index.html` y `enviar.php`.
