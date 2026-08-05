# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Resumen del proyecto

Sitio de marketing estático para Bisonte CrossFit (un box de CrossFit en San Miguel, Chile). HTML/CSS/JS plano — sin framework, sin bundler, sin gestor de paquetes, sin build. Cada página lleva su `<style>` inline (no hay stylesheet compartido), pero el JS **sí** está centralizado en `assets/js/app.js`, que las 15 páginas cargan con `<script defer src>` al final del `<body>`. Recursos externos: la hoja de Google Fonts enlazada desde `index.html`, el contenedor de Google Tag Manager (`GTM-WVD4NKS4`), presente en el `<head>` de las 18 páginas justo después del `<meta name="viewport">` (más su `<noscript>` al inicio del `<body>`), y el tag de Microsoft Clarity (`xx809mpyos`), inline en el `<head>` de las 18 páginas justo después del bloque de GTM. **GTM es la única vía de analítica**: no hay snippet de `gtag.js` en el HTML, y GA4 se dispara desde dentro del contenedor (Clarity es aparte — session replay/heatmaps, no pasa por el dataLayer). Los eventos personalizados de `app.js` se empujan a `window.dataLayer` como `{event:'<nombre>', ...params}` y necesitan un trigger de Custom Event en GTM para llegar a GA4 — ver "Eventos de conversión".

## Ejecutar / previsualizar

No hay comando de build ni dev-server definido en este repo. Para previsualizar, abre un archivo directamente o sirve el directorio con cualquier servidor estático, por ejemplo:

```
python -m http.server 8000
```

y visita `http://localhost:8000/index.html`. No hay lint ni tests configurados.

## Estructura del sitio

`index.html` es el home de una sola página: hero, carrusel de "historia", y filas de preview (los primeros N ítems) de entrenamientos / planes / testimonios / FAQ. Cada una tenía un link "Ver todos" hacia su página dedicada, pero **los cuatro se quitaron**: hoy esas páginas se alcanzan solo desde el drawer y el footer (ambos las enlazan, así que ninguna quedó huérfana). Si agregas una página de listado nueva, enlázala desde el drawer y el footer, no desde el título de sección. Las páginas dedicadas con el listado completo son:

- `entrenamientos.html` — todas las disciplinas/clases
- `planes.html` — todos los planes de precios
- `testimonios.html` — todos los testimonios
- `preguntas-frecuentes.html` — FAQ completo. Lleva un `<script type="application/ld+json">` con el `FAQPage` de schema.org en el `<head>`: es una **copia literal** de las 23 preguntas del `<body>`, así que al editar una pregunta o respuesta hay que actualizar las dos.
- `como-llegar.html` — ubicación (mapa embebido de Google + explicación de tokens)
- `clase-gratis.html` — formulario para agendar la primera clase de prueba (ver "Formulario de clase gratis")

Las 8 páginas de disciplina se enlazan además desde un grupo `<details><summary>Disciplinas</summary>` presente **en el drawer y en el footer de las 18 páginas** (por SEO: sin él cada disciplina recibía enlaces internos solo desde `index.html` y `entrenamientos.html`), y desde el bloque `.other-disciplines` que cierra el contenido de cada disciplina con links a las otras 7. Los tres listados están copiados a mano, así que **agregar o renombrar una disciplina implica tocar los 18 drawers, los 18 footers y los 8 bloques de cierre** — conviene hacerlo con script.

Como el contenido de preview en `index.html` y el de la página de detalle correspondiente son copias independientes y hechas a mano de la misma data (tarjetas, precios, horarios, citas), **editar contenido normalmente implica actualizarlo en dos lugares** — la fila de preview en `index.html` y el listado completo en la página dedicada.

## Convenciones de estilos

- Cada página vuelve a declarar las mismas variables CSS en `:root` (`--bg`, `--bg-alt`, `--card`, `--magenta`, `--teal`, `--text`, `--text-muted`, `--gold`) — casi no hay stylesheet compartido, así que los cambios de paleta/tokens hay que aplicarlos archivo por archivo.
- **El cluster "Centro de ayuda".** `preguntas-frecuentes.html`, `politica-privacidad.html`, `politica-cookies.html` y `terminos-y-condiciones.html` comparten el mismo CSS (el acordeón está definido para `.faq-item` y `.legal-item` a la vez). Ese CSS se extrajo en su momento a `assets/css/help.css`, pero **se volvió a inline en las cuatro páginas**: el hosting nunca recibió la carpeta `assets/css/`, devolvía el `index.html` como fallback 404 para esa ruta, y el navegador rechazaba el `text/html` donde esperaba CSS — las cuatro páginas se veían sin estilos en producción. Hoy las 18 páginas llevan su `<style>` inline y **el CSS de ayuda está duplicado cuatro veces: un cambio ahí va en los cuatro archivos**. `assets/css/help.css` sigue en el repo como copia de referencia pero **ninguna página lo enlaza**; si algún día vuelve a usarse, ojo con que sus `url()` son relativas a `assets/css/` (`../img/...`) y en el HTML inline deben ser `assets/img/...`.
- **Antes de mover CSS/JS a un archivo nuevo, confirma que el deploy suba carpetas nuevas.** El deploy parece ser manual y ya se comió una carpeta entera sin avisar; verifica la URL del asset en producción después de publicar.
- Mobile-first: los estilos base apuntan a un viewport angosto, el contenido va envuelto en un contenedor `.app` (`max-width:480px`, centrado). Se repiten dos breakpoints en todos los archivos:
  - `min-width:481px` — solo cosmético (sombra, `min-height:100vh` en `.app`).
  - `min-width:900px` — layout de escritorio real: `.app` pasa a ancho completo, los carruseles con scroll-snap horizontal (`.cards-row`) se convierten en grids CSS, y los puntos de paginación JS correspondientes se ocultan vía `[data-for="..."] { display:none; }`.
- Las decoraciones de tarjetas/secciones (subrayados, subrayados de precio, fondos de story-slide) reutilizan el mismo set reducido de assets bajo `assets/img/` y `assets/icons/` vía rutas relativas — revisa ahí antes de agregar un asset nuevo.
- Las 15 páginas enlazan Google Fonts y declaran `font-family:'Poppins', 'Segoe UI', Arial, sans-serif` (Segoe UI y Arial son solo fallbacks). `Inter` se usa puntualmente y solo en `index.html`.

## Patrones de interacción recurrentes

Todo el JS de interacción vive en `assets/js/app.js` — un solo archivo para las 15 páginas. Si tocas el drawer o los carruseles, se edita ahí y una vez.

- **Drawer del menú hamburguesa**: `#menuIcon` togglea `#drawer` / `#drawerOverlay`, se cierra con `#drawerClose`, click en el overlay, `Escape`, o al hacer click en un link del drawer. Las 15 páginas deben mantener esos cuatro `id` — el IIFE los busca sin comprobar si existen, así que si falta uno la página lanza y el resto del archivo no corre.
- **Acordeones**: los ítems de FAQ y los grupos de nav del footer/drawer usan `<details>/<summary>` nativos — no necesitan JS.
- **Barra flotante de CTA** (`.quick-actions`): los dos botones "Reserva tu clase" / "Clase gratis" van fijos abajo en **las 18 páginas**, con el mismo markup y el mismo aspecto que en `index.html`. Es CSS puro, sin JS. Cuatro cosas que hay que respetar al tocarla:
  - **Flota, no es una barra pegada al borde.** Antes era una barra a `bottom:0` con fondo `var(--bg)` sólido de lado a lado; ahora el contenedor es transparente a `bottom:14px` y el fondo vive solo en `.quick-actions-inner` (`rgba(30,30,30,.88)` + `backdrop-filter:blur(14px)` + borde y sombra). No le devuelvas `background` al contenedor exterior: reaparece el marco negro.
  - El contenedor lleva `pointer-events:none` y el `-inner` `pointer-events:auto`, a propósito: sin eso la franja transparente a los costados de la pastilla capturaría el scroll y los clics del contenido que queda debajo.
  - Los `.pill` de la barra están scopeados como `.quick-actions .pill` a propósito, y solo sobreescriben tamaños: heredan colores de las reglas base `.pill-teal` / `.pill-dark`. Esas reglas base siguen en las páginas de disciplina aunque el bloque `.cta-pills` que las usaba ya no exista — si las borras, la barra pierde los colores.
  - La barra tapa el final de la página, así que el `footer` lleva `padding-bottom:120px` (móvil) y `130px` (≥900px). Si agregas la barra a una página nueva, agrega también ese espacio.

  Los `href` cambian según la página: en `index.html` y `entrenamientos.html` "Reserva tu clase" es el ancla `#entrenamientos`; en las 8 disciplinas son WhatsApp con el mensaje de esa disciplina + `clase-gratis.html?clase=<slug>`; en el resto son `entrenamientos.html` + `clase-gratis.html`. En `clase-gratis.html` el segundo botón baja al formulario (`#freeClassForm`) en vez de recargar la propia página. **Las 8 disciplinas tenían además un bloque `.cta-pills` al final del contenido con esos mismos dos botones; se eliminó por duplicado con la barra** — si necesitas un CTA en el cuerpo de una disciplina, no repitas los mismos dos botones.
- **Botonera del centro de ayuda** (`.help-tabs`): las mismas 4 pestañas en `preguntas-frecuentes.html` y las 3 páginas legales, cada una con `.active` en la suya. Son links normales (una pestaña = una carga de página, sin JS). Como en móvil no caben y la fila scrollea en horizontal, `app.js` ajusta el `scrollLeft` para centrar la pestaña activa al entrar — sin eso, en Cookies y Términos la activa queda fuera de pantalla.
- **Pestañas de transporte** (`.transport-tabs`, solo `como-llegar.html`): Metro / Micro / Bici / Auto. Son `<button role="tab">` con `aria-controls` apuntando al `id` de su `<div class="transport-info" role="tabpanel">`; el bloque de `app.js` los empareja por ese atributo, así que para agregar un modo de transporte basta con sumar el botón y su panel (con `hidden`) en el HTML. Colores: teal translúcido en reposo y `var(--teal)` con texto oscuro en la activa, los mismos que los `.chip` de `planes.html`.
- **Carruseles**: las filas con scroll-snap horizontal (`.cards-row`) se usan para los story slides, las tarjetas de disciplinas, las tarjetas de planes y los testimonios. Solo `index.html` genera puntos de paginación para estos (el JS escanea `.dots[data-for="<id de la fila>"]`, crea un botón por cada hijo de la fila referenciada, y resalta el más cercano al hacer scroll calculando posiciones). Ese bloque va en el mismo `app.js` compartido: en las páginas sin `.dots[data-for]` recorre una lista vacía y no hace nada, por eso no hace falta un archivo por página. Las páginas de listado dedicadas (`entrenamientos.html`, `planes.html`, `testimonios.html`) renderizan la lista completa directamente en vez de un carrusel paginado.
  - **`#row-planes` es la excepción**: usa snap centrado (`scroll-snap-align:center` en las cards + `padding-inline:calc((100% - 230px) / 2)` en la fila) para que la card activa quede al medio del viewport móvil, mientras las otras filas siguen con `scroll-snap-align:start`. Ese `padding-inline` **debe anularse** en el `@media (min-width:900px)` (`padding-inline:0;scroll-snap-type:none;`), donde la fila pasa a ser grid: sobre 1100px el `calc()` metería ~435px de padding y rompería la grilla.

## Formulario de clase gratis

`clase-gratis.html` es la única página con formulario. Escribe una fila en una Google Sheet vía una Web App de Google Apps Script (columnas `Fecha`, `Nombre`, `RUT`, `Email`, `Telefono`, `Horario`, `Clase`, `Mensaje`; `Fecha` la pone el script).

- La URL `/exec` de la Web App vive en el atributo `data-endpoint` del `<form id="freeClassForm">` — no está en el JS, así que se cambia sin tocar `app.js`.
- El envío manda los datos **dos veces a propósito**: en la query string (Apps Script los expone en `e.parameter`) y en el body como JSON (`e.postData.contents`), para que el `doPost` funcione sin importar cómo parsee. El `Content-Type: text/plain` evita el preflight CORS, que Apps Script no responde.
- Las opciones del `<select name="horario">` llevan `data-clase` y el JS las filtra según la clase elegida. **Esos horarios son una copia de los de `entrenamientos.html`** — si cambian los horarios reales hay que actualizarlos en ambos sitios (y en la página de la disciplina correspondiente).
- El RUT se valida en el cliente con módulo 11 y se formatea al salir del campo. Un RUT con dígito verificador incorrecto bloquea el envío.
- Acepta `?clase=CrossFit` en la URL para preseleccionar la disciplina al enlazar desde una página de disciplina.

## Eventos de conversión

El bloque de tracking de `app.js` es un solo listener delegado en `document` (fase de captura) que deduce la intención del `href` del `<a>` clickeado — no hay que marcar nada a mano en el HTML al agregar un CTA nuevo. Todo pasa por el helper `enviar(nombre, params)`, que agrega `pagina` (el pathname) y hace `window.dataLayer.push({event: nombre, ...params})`.

Nombres de evento que el contenedor GTM debe tener registrados como trigger de **Custom Event** (si falta el trigger, el push ocurre pero no llega nada a GA4):

| Evento | Se dispara al | Params |
|---|---|---|
| `contacto_whatsapp` | click en cualquier link `wa.me/` | `intencion` (`general` / `clase_gratis` / `reservar_clase` / `plan`), `detalle`, `origen` |
| `ver_clase_gratis` | click hacia `clase-gratis.html` | `disciplina`, `origen` |
| `ver_disciplina` | click hacia una de las 8 páginas de disciplina | `disciplina`, `origen` |
| `click_social` | click a Instagram o Facebook | `red` |
| `click_boxmagic` | click a un link de BoxMagic | — |
| `clase_gratis_enviada` | respuesta OK del form de `clase-gratis.html` | `clase`, `horario` |

`origen` sale de la función `origen(a)`, que mira el ancestro del link (`marquee`, `barra_fija`, `cta_disciplina`, `cta_listado`, `hero`, `menu`, `footer`, `contenido`) para saber qué zona de la página convierte.

## Notas de contenido

- La info de contacto (número de WhatsApp vía links `wa.me/<numero>`, dirección del gym "Calle Uno 1050, San Miguel") está hardcodeada inline y repetida en las 15 páginas — hay que actualizar cada ocurrencia si cambia.
- `.mcp.json` configura el servidor MCP de Figma; este HTML se construyó/mantiene sincronizado contra un diseño de Figma (frame mobile, ~390px de ancho) — al aplicar cambios nuevos de Figma, usa el orden de secciones de `index.html` (hero → marquee de tags → quick actions → historia → entrenamientos → planes → testimonios → FAQ → footer) como referencia.
