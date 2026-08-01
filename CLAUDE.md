# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Resumen del proyecto

Sitio de marketing estático para Bisonte CrossFit (un box de CrossFit en San Miguel, Chile). HTML/CSS/JS plano — sin framework, sin bundler, sin gestor de paquetes, sin build. Cada página lleva su `<style>` inline (no hay stylesheet compartido), pero el JS **sí** está centralizado en `assets/js/app.js`, que las 14 páginas cargan con `<script defer src>` al final del `<body>`. Recursos externos: la hoja de Google Fonts enlazada desde `index.html` y el tag de Google Analytics (GA4 `G-0TLJMCT3TZ`), presente en el `<head>` de las 14 páginas justo después del `<meta name="viewport">`.

## Ejecutar / previsualizar

No hay comando de build ni dev-server definido en este repo. Para previsualizar, abre un archivo directamente o sirve el directorio con cualquier servidor estático, por ejemplo:

```
python -m http.server 8000
```

y visita `http://localhost:8000/index.html`. No hay lint ni tests configurados.

## Estructura del sitio

`index.html` es el home de una sola página: hero, carrusel de "historia", y filas de preview (los primeros N ítems) de entrenamientos / planes / testimonios / FAQ, cada una con un link "Ver todos" hacia una página dedicada con el listado completo:

- `entrenamientos.html` — todas las disciplinas/clases
- `planes.html` — todos los planes de precios
- `testimonios.html` — todos los testimonios
- `preguntas-frecuentes.html` — FAQ completo
- `como-llegar.html` — ubicación (mapa embebido de Google + explicación de tokens)

Como el contenido de preview en `index.html` y el de la página de detalle correspondiente son copias independientes y hechas a mano de la misma data (tarjetas, precios, horarios, citas), **editar contenido normalmente implica actualizarlo en dos lugares** — la fila de preview en `index.html` y el listado completo en la página dedicada.

## Convenciones de estilos

- Cada página vuelve a declarar las mismas variables CSS en `:root` (`--bg`, `--bg-alt`, `--card`, `--magenta`, `--teal`, `--text`, `--text-muted`, `--gold`) — no hay stylesheet compartido, así que los cambios de paleta/tokens hay que aplicarlos archivo por archivo.
- Mobile-first: los estilos base apuntan a un viewport angosto, el contenido va envuelto en un contenedor `.app` (`max-width:480px`, centrado). Se repiten dos breakpoints en todos los archivos:
  - `min-width:481px` — solo cosmético (sombra, `min-height:100vh` en `.app`).
  - `min-width:900px` — layout de escritorio real: `.app` pasa a ancho completo, los carruseles con scroll-snap horizontal (`.cards-row`) se convierten en grids CSS, y los puntos de paginación JS correspondientes se ocultan vía `[data-for="..."] { display:none; }`.
- Las decoraciones de tarjetas/secciones (subrayados, subrayados de precio, fondos de story-slide) reutilizan el mismo set reducido de assets bajo `assets/img/` y `assets/icons/` vía rutas relativas — revisa ahí antes de agregar un asset nuevo.
- Las 14 páginas enlazan Google Fonts y declaran `font-family:'Poppins', 'Segoe UI', Arial, sans-serif` (Segoe UI y Arial son solo fallbacks). `Inter` se usa puntualmente y solo en `index.html`.

## Patrones de interacción recurrentes

Todo el JS de interacción vive en `assets/js/app.js` — un solo archivo para las 14 páginas. Si tocas el drawer o los carruseles, se edita ahí y una vez.

- **Drawer del menú hamburguesa**: `#menuIcon` togglea `#drawer` / `#drawerOverlay`, se cierra con `#drawerClose`, click en el overlay, `Escape`, o al hacer click en un link del drawer. Las 14 páginas deben mantener esos cuatro `id` — el IIFE los busca sin comprobar si existen, así que si falta uno la página lanza y el resto del archivo no corre.
- **Acordeones**: los ítems de FAQ y los grupos de nav del footer/drawer usan `<details>/<summary>` nativos — no necesitan JS.
- **Carruseles**: las filas con scroll-snap horizontal (`.cards-row`) se usan para los story slides, las tarjetas de disciplinas, las tarjetas de planes y los testimonios. Solo `index.html` genera puntos de paginación para estos (el JS escanea `.dots[data-for="<id de la fila>"]`, crea un botón por cada hijo de la fila referenciada, y resalta el más cercano al hacer scroll calculando posiciones). Ese bloque va en el mismo `app.js` compartido: en las páginas sin `.dots[data-for]` recorre una lista vacía y no hace nada, por eso no hace falta un archivo por página. Las páginas de listado dedicadas (`entrenamientos.html`, `planes.html`, `testimonios.html`) renderizan la lista completa directamente en vez de un carrusel paginado.

## Notas de contenido

- La info de contacto (número de WhatsApp vía links `wa.me/<numero>`, dirección del gym "Calle Uno 1050, San Miguel") está hardcodeada inline y repetida en las 14 páginas — hay que actualizar cada ocurrencia si cambia.
- `.mcp.json` configura el servidor MCP de Figma; este HTML se construyó/mantiene sincronizado contra un diseño de Figma (frame mobile, ~390px de ancho) — al aplicar cambios nuevos de Figma, usa el orden de secciones de `index.html` (hero → marquee de tags → quick actions → historia → entrenamientos → planes → testimonios → FAQ → footer) como referencia.
