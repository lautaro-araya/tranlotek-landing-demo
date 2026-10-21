# Tranlotek · versiones de la landing

Demos estáticas de la nueva landing de tranlotek.com, publicadas con GitHub Pages solo para revisión.
La raíz es un hub con todas las versiones: https://lautaro-araya.github.io/tranlotek-landing-demo/

| Carpeta | Versión | Estado |
|---|---|---|
| `v1/` | Landing original (portada a sangre con barra flotante, respaldo, cobertura GPS) | Publicada |
| `v2/` | Portada clara y curva (formato bairesdev.com), cifras animadas, sectores, mapa | Publicada |
| `v3/` | Puerta de acero + grúa (formulario en portada, flota, Gran Concepción, 4 etapas del traslado). Se edita directo en esta carpeta | Publicada |
| `v4/` | Página "Coming soon". Fuente: carpeta `ver3` del PC (vacía) | Coming soon |

- `index.html` + `hub/`: el hub, solo con las tarjetas de las versiones, en negro, blanco y rojo (estilo logo AMD, reglas `.hub` en `hub.css`; la página `v4/` conserva la paleta azul). `hub/v*.webp` son las vistas previas.
  Para publicar una versión nueva: reemplazar su carpeta (`v4/`), copiar la tarjeta de V2 en `index.html`
  cambiando ruta, textos y vista previa.
- Teléfono, WhatsApp, RUT y correo son **datos provisionales**.
- Los formularios no envían datos: V1 y V2 están en modo demo; V3 apunta a `enviar.php`, que Pages no ejecuta (muestra su aviso de error).
- No indexable (`noindex` + `robots.txt`).

La versión de producción, con el endpoint PHP del formulario, se despliega en el hosting cPanel.
