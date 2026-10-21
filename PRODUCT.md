# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Responsables de operaciones o compras en empresas privadas del Biobío que mueven vehículos: transporte y logística, aseguradoras, flotas de empresa, concesionarias y talleres. Llegan evaluando un proveedor de traslado y deciden si vale la pena una reunión.

## Product Purpose

Landing institucional (no de venta) de Tranlotek SpA: retiro y traslado de vehículos con grúa en la Región del Biobío. Su único objetivo es que la empresa visitante pida una reunión comercial; el cierre ocurre después, en persona.

## Positioning

No es un servicio nuevo: es un modelo de traslado que ya opera, validado en 12.000 traslados y 2 años con activos críticos del sector público, que ahora se abre al sector privado. El mismo modelo para todos los sectores; no hay soluciones "a medida".

## Operating Context

- Central telefónica 24 h en Concepción con seguimiento GPS de la flota.
- Cada servicio deja acta (retiro y entrega con hora y firma), set fotográfico y reporte diario.
- Zona de retiro: las 10 comunas del Gran Concepción.

## Capabilities and Constraints

- Solo retiro y traslado: nunca custodia, bodegaje, recinto propio ni "activos bajo responsabilidad".
- Sector público sin nombres (ni Fiscalía, ni policías, ni comunas con contrato). Excepción: el mapa del Gran Concepción nombra sus 10 comunas.
- Solo las 6 cifras oficiales, escritas igual en toda la web y fijas en el HTML: 12.000 · 2 años · 25 · 24 h · 100 % · Diario.
- Sin precios, "cotizar" ni promesas a medida. Botón principal: "Solicitar reunión comercial"; en el formulario, "Solicitar reunión". La sección de contacto se titula "Conversemos.".
- Maquetas de acta, fotos, reportes o pantallas GPS van rotuladas "Ejemplo ilustrativo", sin patentes ni datos reales.
- Sitio estático (HTML/CSS/JS sin framework); producción en cPanel con PHP para el formulario; demo en GitHub Pages con `noindex`.
- Pendiente con el cliente: dirección exacta, opciones del campo "Sector", datos de contacto definitivos (los actuales son provisionales).

## Brand Commitments

- Nombre y logo Tranlotek (PNG; falta SVG). Azul de la marca `#044F86`, elegido por el cliente.
- Voz: corta, visual, centrada en cifras. Poco texto: lo demás se conversa en la reunión.

## Evidence on Hand

- Las 6 cifras oficiales (entregadas el 12-10-2026).
- Fotos del cliente en `v1/assets/img/`: equipo frente a la flota (`hero-*`), central de monitoreo (`central-*`), grúa trasladando un auto (`log-seguridad-*`).
- `log-gps-*`: captura GPS generada con datos ficticios; mostrar solo como ejemplo ilustrativo hasta tener una real.
- No hay testimonios, clientes nombrables, casos ni tiempos de respuesta confirmados: no inventarlos.

## Product Principles

1. Las cifras y las imágenes hablan; el texto es mínimo.
2. Mostrar el control (GPS, central, actas) en vez de prometerlo.
3. Un solo modelo probado, una sola acción: pedir la reunión.
4. Nada que la empresa no pueda respaldar.

## Accessibility & Inclusion

Funciona desde 360 px de ancho y respeta `prefers-reduced-motion`.
