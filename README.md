# Tranlotek · versiones de la landing

Demos estáticas de la nueva landing de tranlotek.com, publicadas con GitHub Pages solo para revisión.
La raíz es un hub con todas las versiones: https://lautaro-araya.github.io/tranlotek-landing-demo/

| Carpeta | Versión | Estado |
|---|---|---|
| `v1/` | Landing original (portada oscura, respaldo, cobertura GPS) | Publicada |
| `v2/` | Portada clara y curva (formato bairesdev.com), cifras animadas, sectores, mapa | Publicada |
| `v3/` | — | Coming soon |
| `v4/` | — | Coming soon |

- `index.html` + `hub/`: el hub (estilo oscuro tech). `hub/v1.webp` y `hub/v2.webp` son las vistas previas.
  Para publicar una versión nueva: crear su carpeta (`v3/`), copiar la tarjeta de V2 en `index.html`
  cambiando ruta, textos y vista previa, y actualizar las cifras del bloque `stats`.
- Teléfono, WhatsApp, RUT y correo son **datos provisionales**.
- Los formularios funcionan en **modo demo**: no envían datos.
- No indexable (`noindex` + `robots.txt`).

La versión de producción, con el endpoint PHP del formulario, se despliega en el hosting cPanel.
