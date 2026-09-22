# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Resumen del proyecto

Sitio de marketing estático para Bisonte CrossFit (un box de CrossFit en San Miguel, Chile). HTML/CSS/JS plano — sin framework, sin bundler, sin gestor de paquetes. Sin build ni scripts de generación: el repo se publica tal cual. Cada página lleva su `<style>` inline (y en `assets/css/` hay dos hojas compartidas, `disciplina.css` y `help.css`); el JS está centralizado en `assets/js/app.js`, que las páginas cargan con `<script defer src>` al final del `<body>`.

**Nada de terceros se carga sin consentimiento.** Google Tag Manager (`GTM-WVD4NKS4`) y Microsoft Clarity (`xx809mpyos`) ya no van en el `<head>`: los carga `assets/js/consent.js` y solo después de que la persona elige. Las fuentes son locales (`assets/fonts/`), así que en una carga sin consentir **el sitio no hace ni una petición a un tercero** — comprobado.

**GTM es la única vía de analítica**: no hay snippet de `gtag.js` en el HTML y GA4 se dispara desde dentro del contenedor. Los eventos personalizados de `app.js` se empujan a `window.dataLayer` como `{event:'<nombre>', ...params}` y necesitan un trigger de Custom Event en GTM para llegar a GA4 — ver "Eventos de conversión".

### Fuga de Clarity: el contenedor de GTM lo carga por su cuenta

El banner ofrece dos categorías separadas a propósito — **Estadísticas** (GTM/GA4) y **Grabación de sesión** (Clarity, que registra movimientos de ratón y clics). `consent.js` las respeta bien. **El contenedor de GTM, no**: tiene dentro una etiqueta de Clarity propia, así que aceptar solo "Estadísticas" carga Clarity igual.

Se comprueba mirando la URL cargada: `consent.js` pide `clarity.ms/tag/<id>` a secas, y la que aparece es `clarity.ms/tag/<id>?ref=gtm`. Ese `?ref=gtm` es la prueba de quién la inyectó.

| Elección en el banner | GTM / GA4 | Clarity | |
|---|---|---|---|
| Rechazar todo | no | no | ✅ |
| Solo Estadísticas | sí | **sí** | ❌ es la fuga |
| Aceptar todo | sí | sí | ✅ |

**No se arregla desde este repo**: hay que entrar al contenedor de GTM y o bien borrar esa etiqueta (`consent.js` ya carga Clarity por su cuenta cuando toca), o condicionarla al consentimiento de grabación. Mientras siga así, el banner promete una separación que no se cumple.

## Ejecutar / previsualizar

No hay comando de build ni dev-server definido en este repo. Para previsualizar, abre un archivo directamente o sirve el directorio con cualquier servidor estático, por ejemplo:

```
python -m http.server 8000
```

y visita `http://localhost:8000/index.html`. No hay lint ni tests configurados.

## Estructura del sitio

`index.html` es el home de una sola página: hero, carrusel de "historia", y filas de preview (los primeros N ítems) de disciplinas / planes / testimonios / FAQ. Cada una tenía un link "Ver todos" hacia su página dedicada, pero **los cuatro se quitaron**: hoy esas páginas se alcanzan solo desde el drawer y el footer (ambos las enlazan, así que ninguna quedó huérfana). Si agregas una página de listado nueva, enlázala desde el drawer y el footer, no desde el título de sección. Las páginas dedicadas con el listado completo son:

- `disciplinas.html` — todas las disciplinas/clases. **Se llamaba `entrenamientos.html` y se renombró**. La redirección real la hace **`_redirects`**, con un `301` de `/entrenamientos.html` y `/entrenamientos` hacia `/disciplinas`: Cloudflare Pages sí permite un 301 de verdad, al revés de lo que se supuso al principio. En esa ruta quedó además un **stub de redirección** (`<meta http-equiv="refresh">` a 0s + `canonical` + `location.replace`) que **en producción no se llega a servir** — es respaldo por si el sitio cambia de hosting y se pierde el 301. **Ese archivo no lleva `noindex` ni GTM/Clarity a propósito** (el `noindex` cortaría el traspaso de posicionamiento, y los tags contarían visitas fantasma), y no va en `sitemap.xml`. Sus tres destinos apuntan a `/disciplinas` **sin extensión**: si apuntaran a `disciplinas.html`, Cloudflare los volvería a redirigir con un 308 y Google vería un canonical que redirige. Se puede borrar cuando Search Console deje de reportar tráfico para la URL vieja. Con el rename también se renombraron el ancla `#entrenamientos` → `#disciplinas` en `index.html`, el `id`/clases del carrusel (`#row-disciplinas`, `.disciplinas-page`) y la entrada de `sitemap.xml` y `llms.txt`. En el drawer y el footer el link se llama **"Todas las disciplinas"** para no chocar con el grupo desplegable "Disciplinas"; en las migas de pan, en cambio, el nodo padre es solo "Disciplinas". La palabra "entrenamiento" sigue en uso en la prosa genérica ("entrenamiento funcional", "cada entrenamiento se puede escalar", "metodología de entrenamiento") y en los `<title>` de Adulto Mayor y Competidor — ahí significa *training*, no la sección, y no hay que reemplazarla.
- `planes.html` — todos los planes de precios
- `testimonios.html` — todos los testimonios
- `preguntas-frecuentes.html` — FAQ completo. Lleva un `<script type="application/ld+json">` con el `FAQPage` de schema.org en el `<head>`: es una **copia literal** de las 23 preguntas del `<body>`, así que al editar una pregunta o respuesta hay que actualizar las dos.
- `como-llegar.html` — ubicación (mapa embebido de Google + explicación de tokens)
- `clase-gratis.html` — formulario para agendar la primera clase de prueba (ver "Formulario de clase gratis")

Las páginas de disciplina se enlazan además desde un grupo `<details><summary>Disciplinas</summary>` presente **en el drawer y en el footer de las 18 páginas** (por SEO: sin él cada disciplina recibía enlaces internos solo desde `index.html` y `disciplinas.html`), y desde el bloque `.other-disciplines` que cierra el contenido de cada disciplina con links a las otras. Los tres listados están copiados a mano, así que **agregar o renombrar una disciplina implica tocar los 18 drawers, los 18 footers y los bloques de cierre** — conviene hacerlo con script. Los tres listados llevan **8 entradas**, no 9: ver la excepción de GAP abajo.

**`gap.html` es una disciplina deliberadamente no listada** (decisión del dueño, 2026-08-14). La página está publicada, indexable y completa —breadcrumb, `Service` JSON-LD, barra de CTA, `sitemap.xml`, `llms.txt`, FAQ y términos—, pero **no aparece en el drawer, ni en el footer, ni en las tarjetas de `index.html` / `disciplinas.html`, ni en los bloques `.other-disciplines`, ni en las clases de Sonia en `coaches.html`**. Se llega a ella desde el bloque "Sábados" de `horarios.html`, desde la opción del formulario de `clase-gratis.html` o por link directo. Si algún día se publica del todo, hay que sumarla en esos seis lugares (y `assets/icons/discipline-gap.svg` ya existe). Por eso `disciplinas.html` no dice un número de disciplinas en su `<meta name="description">` ni en el `.page-intro`: mostraba 8 tarjetas mientras el box dictaba 9 clases.

Cada página de disciplina tiene el mismo esqueleto de contenido: hero (`h1` + `.subtitle` + `.desc`), `.info-card` de **Horarios**, `.info-card` descriptiva (`¿Qué es…?` / `¿Cómo es la clase?`, con 3 `<p>` — es el bloque de texto largo que Google indexa y **es único por disciplina, no lo hagas plantilla**), `.info-card` de **¿Quiénes pueden entrenar?**, beneficios, coach y `.other-disciplines`. El `h1` incluye el nombre de la disciplina **más "en San Miguel"** (keyword local) y el `.subtitle` es la misma frase que aparece en la tarjeta de `disciplinas.html` y en la de preview de `index.html`: **cambiarlo implica los tres lugares**. Las 9 páginas ya no llevan `<meta name="keywords">`: el trabajo de posicionamiento está en el `<title>`, la `description` y ese texto visible.

### Migas de pan

Las 17 páginas internas (todas menos `index.html`) llevan un `<nav class="breadcrumb" aria-label="Migas de pan">` con un `<ol>` de links y el último ítem como `<span aria-current="page">`, más un `<script type="application/ld+json">` con el `BreadcrumbList` de schema.org al final del `<head>` (URLs absolutas a `https://bisontecrossfit.cl/`, las mismas del `<link rel="canonical">`). **El texto visible y el JSON-LD son copias del mismo trail: al renombrar una página hay que actualizar los dos**, y también el trail de las páginas hijas.

Jerarquías: `Inicio › <listado>` para `disciplinas` / `planes` / `testimonios` / `clase-gratis` / `como-llegar`; `Inicio › Disciplinas › <disciplina>` para las 9 disciplinas (los nombres son los mismos del drawer); `Inicio › Centro de ayuda › <pestaña>` para las 3 páginas legales, con `Centro de ayuda` apuntando a `preguntas-frecuentes.html` (que es el hub, y por eso ahí el trail termina en `Inicio › Centro de ayuda`).

Dónde va el markup según el tipo de página: primer hijo del `.container` de `.discipline-page` en las disciplinas (**ahí reemplazó al link `.back-row` "Atrás"**, que iba al mismo destino y quedaba duplicado — su CSS también se borró), primer hijo del `.container` de `<section class="page-title">` en las 5 páginas de listado, y dentro de `.help-title` antes del `<h1>` en las 4 del centro de ayuda (así hereda el ancho de 900px de escritorio sin reglas extra). El CSS de `.breadcrumb` está inline y duplicado en las 17 páginas, como el resto de los estilos: solo cambia el `padding` del `nav` (`10px 0 12px` en general, `0 0 12px` en el centro de ayuda).

Como el contenido de preview en `index.html` y el de la página de detalle correspondiente son copias independientes y hechas a mano de la misma data (tarjetas, precios, horarios, citas), **editar contenido normalmente implica actualizarlo en dos lugares** — la fila de preview en `index.html` y el listado completo en la página dedicada.

### Datos estructurados (JSON-LD) y la ficha de Google Business

Todo el schema.org va inline al final del `<head>`, en bloques `<script type="application/ld+json">`. Hay cuatro tipos y **todos son copias a mano del contenido visible**, así que se desincronizan solo:

- **`ExerciseGym`** (subtipo de `LocalBusiness`) — la ficha del negocio: nombre, dirección, teléfono, `geo`, `openingHoursSpecification`, `priceRange`, `hasMap` y `sameAs`. Está en `index.html` **y duplicada literal en `como-llegar.html`** (la página de ubicación es la que compite por las búsquedas locales). Las dos copias comparten `"@id": "https://bisontecrossfit.cl/#gimnasio"`, que es lo que hace que Google las lea como **una sola entidad** y no como dos negocios: si cambias el `@id` en una, aparecen duplicados. Un cambio de dirección, teléfono, horario o precio se toca en las dos.
- **La vinculación con Google Business Profile** no es un meta tag: son `hasMap` y el primer `sameAs`, ambos apuntando a `https://maps.google.com/?cid=13561209380920766207`. Ese `cid` es el mismo id de la ficha que usa el iframe del mapa en `como-llegar.html` y el botón "Ver todas" de `testimonios.html` — si alguna vez cambia, hay que cambiarlo en los cuatro lugares. Lo demás que conecta sitio y ficha es que el NAP (nombre, dirección, teléfono) coincida en las 18 páginas y en la ficha.
- **`Service`** — una por disciplina, en las 9 páginas. Cuelga del negocio con `"provider": {"@id": "…#gimnasio"}` en vez de repetir la ficha entera. La `description` es una copia del `<meta name="description">` de esa página, con el horario incluido.
- **`BreadcrumbList`** en las 17 internas y **`FAQPage`** en `preguntas-frecuentes.html` — ver las secciones correspondientes.

Antes de publicar cambios de schema, pásalos por el [validador de Schema.org](https://validator.schema.org/) o Search Console: un JSON mal formado hace que Google descarte el bloque entero en silencio.

El horario (lun-vie 07:00-21:15, sábado 10:00-12:00) y el `postalCode` están confirmados por el dueño. El sábado pasó por 10:30, luego 09:30 cuando se sumó GAP, y el 2026-08-14 quedó en 10:00 con una sola clase; desde **2026-09-22** son dos: GAP 10:00 y CrossFit Extendido 10:15. Ese mismo día **se eliminó el bloque de las 06:00 de lunes a viernes**, así que la apertura pasó de 06:00 a 07:00. Si cambia el horario de puertas hay que actualizarlo en el schema **y** en la ficha de Google Business: que se contradigan es peor que no declarar el horario.

**No agregues `aggregateRating` ni `Review` al negocio.** Google no acepta reseñas *self-serving* — valoraciones sobre el propio negocio, publicadas en su propio sitio — para `LocalBusiness` ni `Organization`: no generan estrellas en los resultados y son marcado sancionable. Las estrellas que aparecen en las búsquedas locales salen de la ficha de Google Business, no de acá. Las 3 reseñas de `testimonios.html` van sin marcar, solo como contenido.

### `sitemap.xml` y `llms.txt` — hay que mantenerlos a mano

Los dos viven en la raíz, se escriben a mano (no hay build que los genere) y **es fácil olvidarlos porque nada en el sitio los enlaza ni falla si quedan desactualizados**. Cada vez que agregues, renombres o borres una página, o que cambien precios / horarios / disciplinas / datos de contacto, revisa los dos antes de dar por terminado el cambio:

- **`sitemap.xml`** — lista plana de las 21 URLs indexables (`<loc>` y `<lastmod>`, sin `changefreq` ni `priority`). URLs absolutas a `https://bisontecrossfit.cl/` y **sin extensión `.html`**, las mismas del `<link rel="canonical">` de cada página, con el home como `https://bisontecrossfit.cl/`. Poner acá la forma `.html` es un error: Cloudflare Pages la redirige con un 308 y el sitemap termina apuntando a URLs que redirigen. **Los stubs de redirección tampoco van** (por eso `entrenamientos.html` está fuera). Página nueva = una línea nueva; página renombrada = editar la línea, no agregar otra.
- **`llms.txt`** — resumen del sitio en Markdown para modelos de lenguaje, con el formato de la convención llmstxt.org: `# Bisonte CrossFit`, un `>` de una línea con el resumen, prosa de contexto, y luego secciones de links (`## Páginas principales`, `## Disciplinas`, `## Planes y precios`, `## Contacto y ubicación`, `## Opcional` para las 3 legales). **No es solo un índice: duplica contenido real** — los precios y nombres de los 11 planes, los horarios y la descripción de las 9 disciplinas, la dirección, el WhatsApp y las redes. Todo eso es una copia más de lo que ya está en `planes.html` / `disciplinas.html` / los footers, así que un cambio de precio u horario se replica **también acá**, no solo en las dos páginas HTML.

**Si tocas un precio, actualiza `llms.txt` en el mismo cambio.** Es la regla que más se olvida: `llms.txt` no se ve en el navegador, nadie lo revisa, y ya quedó desfasado una vez (tenía el Plan 8 en $35.000 cuando valía $39.990, le faltaban Plan Full y Full Elite, y traía mal los tokens del Plan Estudiante). Los precios viven en cuatro lugares y **hay que recorrerlos todos**:

1. `planes.html` — las 11 tarjetas `.plan-card > .price` (6 mensuales, 3 especiales, 2 diarios). Es la fuente autoritativa.
2. `planes.html` — el `<meta name="description">` y el `<meta property="og:description">`, que dicen "Planes desde $39.990": si cambia el plan más barato, cambian los dos.
3. `index.html` — las 3 tarjetas de preview de la fila `#row-planes` (Plan 8, Plan 12, Plan Full).
4. `llms.txt` — la sección `## Planes y precios`, con nombre, bajada, precio, tokens y condiciones de los 11 planes.

Regla práctica: cambio estructural (página nueva/renombrada/borrada) → toca los dos archivos; cambio de contenido (precio, horario, teléfono, dirección) → toca `llms.txt`.

## Convenciones de estilos

- Cada página vuelve a declarar las mismas variables CSS en `:root` (`--bg`, `--bg-alt`, `--card`, `--magenta`, `--teal`, `--text`, `--text-muted`, `--gold`) — casi no hay stylesheet compartido, así que los cambios de paleta/tokens hay que aplicarlos archivo por archivo.
- **El cluster "Centro de ayuda".** `preguntas-frecuentes.html`, `politica-privacidad.html`, `politica-cookies.html` y `terminos-y-condiciones.html` comparten el mismo CSS (el acordeón está definido para `.faq-item` y `.legal-item` a la vez). Ese CSS se extrajo en su momento a `assets/css/help.css`, pero **se volvió a inline en las cuatro páginas**: el hosting nunca recibió la carpeta `assets/css/`, devolvía el `index.html` como fallback 404 para esa ruta, y el navegador rechazaba el `text/html` donde esperaba CSS — las cuatro páginas se veían sin estilos en producción. Eso ya se revirtió: **`assets/css/help.css` vuelve a estar enlazado**, con `<link rel="stylesheet">`, en las 4 páginas del cluster, y `assets/css/disciplina.css` en 11 (las 9 disciplinas + `coaches.html` + `horarios.html`). O sea que la carpeta `assets/css/` hoy sí llega al hosting. Ojo con sus `url()`, que son relativas a `assets/css/` (`../img/...`): si vuelves a meter ese CSS inline en el HTML hay que reescribirlas como `assets/img/...`. **Los dos bloquean el renderizado** — son el mismo problema que ya se resolvió para `site.css` y `consent.js`, pero en las páginas de disciplina, que son justo las que reciben las visitas de búsqueda. Está sin decidir si se inlinean también: pesan 15 KB y 13 KB y están compartidos entre varias páginas, así que a diferencia de `site.css` (2 KB) meterlos inline cuesta duplicación real.
- **Antes de mover CSS/JS a un archivo nuevo, confirma que el deploy suba carpetas nuevas.** El deploy parece ser manual y ya se comió una carpeta entera sin avisar; verifica la URL del asset en producción después de publicar.
- **Si tocas un archivo de `assets/js/` o `assets/css/`, sube el `?v=` de sus referencias en los 23 HTML.** `_headers` cachea `/assets/js/*` y `/assets/css/*` una semana (`max-age=604800`) y los nombres no llevan hash, así que sin cambiar la URL ni el edge de Cloudflare ni los navegadores que ya bajaron el archivo se enteran del cambio durante 7 días. Ya pasó: las pestañas de días de `horarios.html` estaban muertas en producción porque el edge servía un `app.js` anterior a que existieran (el origen sí tenía el nuevo — se comprueba pidiendo `app.js?bust=<algo>`, que es otra clave de caché). Purgar Cloudflare arregla el edge pero **no** los dispositivos que ya lo cachearon; lo único que los arregla es una URL nueva. Se hace de una pasada con un `re.sub` sobre `*.html` buscando `(src|href)="assets/(js|css)/…"`; la fecha del día sirve de versión. Ojo: el `?v=` no rompe las reglas de `_headers`, que hacen match por ruta e ignoran la query. Esto aplica hoy **solo a `app.js`**: es el único asset de `js/`/`css/` que sigue enlazado.
- **El CSS compartido va dentro del `<style>` de cada página. `assets/css/site.css` ya no existe.** Eran las `@font-face` de Poppins y los estilos del banner de cookies; enlazado con `<link>` bloqueaba el renderizado 180 ms (PageSpeed móvil, 2026-08-17) por un fichero de 2 KB, y no se puede diferir — sin esos estilos el banner sale sin maquetar y las fuentes llegan tarde. Hubo un momento en que un script lo inyectaba entre marcas `<!-- INLINE:site.css -->`; **eso se deshizo y los scripts se borraron**, porque el repo se publica tal cual y una copia generada que hay que regenerar a mano es una trampa más. Hoy ese bloque **está copiado en las 23 páginas y un cambio ahí va en las 23** — la misma convención que ya rige para todo el CSS de este repo. Está identificado con un comentario `Poppins autoalojada + componentes compartidos` en cada archivo. En las 14 páginas con `<style>` propio va dentro de él; en las 9 que no lo tienen (5 disciplinas + las 4 de ayuda, que sacan su CSS de `assets/css/`) va como un `<style>` suelto. `entrenamientos.html` queda fuera (es un stub y no lleva estilos).
- **El CSS de los `<style>` va sin comentarios.** Los bloques `<style>` de las 14 páginas que tienen uno propio llevaban ~24 KB de comentarios `/* */` en castellano explicando cada decisión. Se borraron el 2026-08-17: PageSpeed los contaba enteros en "Reduce el uso de CSS" (en `index.html` eran 5,8 KB de los 32 KB del bloque, o sea **2,6 KiB gzip de los 3 KiB que reportaba el aviso** — el 85 % del ahorro salía solo de ahí, sin tocar el whitespace ni renombrar nada). Como el HTML no se cachea (`max-age=0, must-revalidate` en `_headers`), esos comentarios viajaban en **cada visita a cada página**. La contrapartida es que **el porqué de esas reglas vive ahora en "Decisiones de CSS que no son obvias", más abajo**: si tocas una de ellas, lee esa sección primero, y si tomas una decisión nueva que no se explique sola, documéntala ahí y no en un comentario. Lo único que se conservó dentro del CSS es el marcador de una línea `/* Poppins autoalojada + componentes compartidos */`, porque es lo que permite ubicar el bloque compartido en cada archivo. Los comentarios `<!-- -->` del `<head>` **no se tocaron** (son otros ~42 KB repartidos en los 24 archivos, por si algún día se quiere el mismo ahorro).
- **`consent.js` va con `defer`, no inline.** Antes iba sin `defer` "para decidir antes de pintar" y bloqueaba 530 ms. Esa razón no se sostenía: lo único que corre de forma síncrona es `consentModePorDefecto()` —declarar el `dataLayer`—, y el banner, GTM y Clarity cuelgan todos de `DOMContentLoaded`. Como **GTM lo carga este mismo script**, el orden se respeta igual (verificado: en el `dataLayer` el `consent default` sigue llegando antes que el `update`). Con `defer` se recupera la caché entre páginas, la CSP no necesita hash para un script inline y se puede depurar como un fichero normal. Se queda arriba del `<head>` para que el preload scanner lo empiece a bajar de inmediato. **La regla no es "meter todo en el HTML": es meter solo lo que bloquea y no se puede diferir** — por eso `app.js` (21 KB) también sigue externo con `defer`.
- Mobile-first: los estilos base apuntan a un viewport angosto, el contenido va envuelto en un contenedor `.app` (`max-width:480px`, centrado). Se repiten dos breakpoints en todos los archivos:
  - `min-width:481px` — solo cosmético (sombra, `min-height:100vh` en `.app`).
  - `min-width:900px` — layout de escritorio real: `.app` pasa a ancho completo, los carruseles con scroll-snap horizontal (`.cards-row`) se convierten en grids CSS, y los puntos de paginación JS correspondientes se ocultan vía `[data-for="..."] { display:none; }`.
- Las decoraciones de tarjetas/secciones (subrayados, subrayados de precio, fondos de story-slide) reutilizan el mismo set reducido de assets bajo `assets/img/` y `assets/icons/` vía rutas relativas — revisa ahí antes de agregar un asset nuevo.
- **Poppins va autoalojada: ya no se pide nada a Google Fonts.** Pedirla costaba dos orígenes cruzados con su DNS y su TLS (`fonts.googleapis.com` para el CSS y `fonts.gstatic.com` para los `.woff2`) antes de pintar una letra. Los `.woff2` viven en `assets/fonts/` y las reglas `@font-face` están escritas a mano dentro del `<style>` de cada página, así que la fuente no cuesta ni una petición de CSS. Si algún día hay que regenerarlas, salen de pedir `https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap` con un User-Agent de Chrome (sin él Google devuelve `.ttf` en vez de `.woff2`), quedándote solo con los bloques `latin` y `latin-ext`. Las 23 páginas declaran `font-family:'Poppins', 'Segoe UI', Arial, sans-serif` (Segoe UI y Arial son solo fallbacks, y lo que se ve si los `.woff2` no cargan). Detalles que hay que respetar:
  - **Pesos: 400, 500, 600, 700 y 800.** No hay 900: lo pedía un único separador de un carácter en el marquee de `index.html`, que ahora va en 800. Si declaras un `font-weight` que no esté en esa lista, el navegador lo sintetiza y se ve peor — o lo agregas a `PESOS` en el script y lo vuelves a correr, o usas uno de los cinco.
  - **Subconjuntos: solo `latin` y `latin-ext`**, sin el devanagari que Google incluye. Con `unicode-range` el navegador baja solo el que necesita: en castellano nunca llega a pedir `latin-ext`, así que en la práctica son ~7,6 KB por peso.
  - Las `url()` de esos `@font-face` son **absolutas** (`/assets/fonts/…`) a propósito, porque el bloque se copia dentro del HTML y una ruta relativa se resolvería distinto según desde dónde se lea.
  - Los `<link rel="preload" as="font" … crossorigin>` del `<head>` adelantan **400, 600 y 800** (cuerpo, UI y títulos, los que pintan arriba del pliegue). Esos van a mano en el HTML: si cambias los pesos, acuérdate de ellos.
  - `Inter` **ya no se usa**. Solo la pedían `.testimonial p` y `.author` de `index.html`, o sea una familia entera para dos líneas bajo el pliegue — y encima `testimonios.html`, que muestra esas mismas citas, nunca la usó, así que la fila del home y su página dedicada se veían con tipografías distintas. Ahora las dos heredan Poppins.

### Decisiones de CSS que no son obvias

Cada una de estas reglas se ve arbitraria y **ya se rompió una vez** al "simplificarla". Vivían como comentarios dentro del CSS; se movieron acá al quitarlos (ver el bullet correspondiente arriba). Están agrupadas por archivo y por selector.

**`index.html`**

- `.hero .hero-price` — el margen horizontal va en `auto`, **no en `0`**. A partir de 900px, `.hero p` le pone `max-width:520px` con márgenes `auto` para centrarlo, y esa regla es más específica: un `margin:14px 0 0` los anulaba y dejaba el bloque de 520px pegado al borde izquierdo del contenedor de 600px. El texto quedaba 40px a la izquierda del resto del hero — `(600-520)/2` — y solo por encima de ese breakpoint.
- `.hero-rating` — es un `<div>` y **no un `<p>`** porque `.hero p` (0,1,1) le gana en especificidad a `.hero-rating` (0,1,0) y le devolvería `font-size:16px`. Y va `display:flex`, no `inline-flex`: con `inline-flex` se pegaba al elemento anterior en cuanto había ancho de sobra. Su cuerpo es 10px, el mismo de `.hero-meta`: la píldora cierra ese bloque de credenciales y con 12px se leía como otro nivel de jerarquía. El "5,0" destaca por peso y color, no por tamaño; los iconos van a 11-12px para no quedar más altos que la línea de texto.
- `.hero-rating-texto` — la atribución va **dentro** de la píldora, no como línea suelta en `.hero-meta`: separadas se leían como dos cosas distintas (una nota sin fuente arriba de un texto sin nota). El separador es un pseudo-elemento para que el "18 opiniones en Google" no herede su color ni se pueda borrar por accidente.
- `.tags-track` — el `gap` es 6px y no 10px porque los `·` **también son items** del flex: con 10px cada palabra quedaba a 20px de la siguiente y la marquesina se leía hueca.
- `.tags-track span.sep` — `font-weight:800`, antes 900. Era el único uso del peso 900 en todo el sitio, para un separador de un carácter; a simple vista es indistinguible y ahorra bajar una fuente entera (ver "Pesos" arriba).
- `#row-planes` — el carrusel de planes **centra** la tarjeta activa; el resto de las filas alinean al borde izquierdo. El `padding-inline` es lo que permite que la primera y la última tarjeta lleguen al centro: `(ancho de la fila - ancho de la tarjeta) / 2`. En `@media (min-width:900px)` la fila pasa a grid y ahí ese padding **se resetea a 0** — sobre 1100px el `calc()` metería ~435px y rompería la grilla.
- `.plan-card .plan-list` — en móvil la tarjeta mide 230px y la lista llena el ancho; en la grilla de escritorio queda mucho más ancha, así que el bloque se centra (`width:max-content` + `margin:auto`, el texto sigue alineado a la izquierda entre sí) y sube de tamaño para no quedar diminuto al lado del precio de 40px.
- `.plan-card .badge` — va fuera del flujo para que el título quede a la misma altura en todas las tarjetas; el `padding-top` de `.plan-card` le reserva el espacio. (Misma regla en `planes.html`.)
- `.testimonial p` / `.author` — **sin `font-family` propia**: heredan Poppins del `body`. Ver la nota de `Inter` arriba.
- `.testimonial .author` — `margin-top:auto` pega el nombre al fondo: en el carrusel y en la grilla de escritorio las tarjetas se estiran a la altura de la más larga, así que sin esto el autor queda flotando a distinta altura en cada una. (Misma regla en `testimonios.html`.)
- `.section-title` — hoy solo lleva el `h2`: se quitaron los enlaces "Ver todos", por eso ya no hace falta `justify-content:space-between`.
- `.faq-item summary::after` — el chevron va **inline**, no como flex item: con `display:flex` y un título de dos líneas quedaba centrado verticalmente y despegado del texto. El `&nbsp;` del `content` lo mantiene pegado a la última palabra sin que salte solo.
- `@media (min-width:900px)` — las `.cards-row` pasan a grid (sin scroll ni snap, todo visible) y ahí las tarjetas de una misma fila quedan todas de la altura de la más alta. Con el `align-items:center` del móvil los títulos arrancaban a distinta altura según cuántas líneas ocupara la descripción, así que en escritorio se alinea arriba y el horario se ancla abajo. El `margin-top:6px` de `.story` se conserva para no pegar el marquee al primer slide.

**`planes.html`**

- `.plan-card h3` y la bajada llevan **alto fijo de 2 líneas** para que el precio y la lista queden a la misma altura tenga el plan nombre corto ("Plan 8") o largo ("Plan Ahorro invierno"), y bajada de una línea ("Madrugadores") o dos ("Media o universidad").
- `.plan-list` — misma corrección que en `index.html`: en la grilla la tarjeta es mucho más ancha que los 230px del móvil, así que la lista se centra como bloque y sube de tamaño.

**`horarios.html`**

- La parrilla está pensada para el teléfono: **un día a la vez**, con las mismas pestañas que ya usa `como-llegar.html` (mismo `role=tab`/`tabpanel`, mismo bloque de `app.js`, mismos colores que los `.chip` de `planes.html`). Así el día completo cabe en una pantalla. Antes fue una tabla de 6 columnas con scroll horizontal, y después un acordeón de 6 tarjetas apiladas, que en 390px eran metros de scroll con la palabra "CrossFit" repetida treinta veces.
- Las filas son **planas**: hora fija a la izquierda, clases a la derecha. Sin chips ni cajas dentro de cajas — a 390px cada borde redondeado anidado se come ancho y no agrega información.
- En escritorio el `.container` se abre a 1100px, pero una lista de doce filas cortas estirada a ese ancho queda vacía: la parrilla **se queda en una columna centrada**. Las pestañas siguen funcionando igual.
- La regla de los enlaces de la parrilla gana por especificidad a la `.info-card a` de más abajo, que si no deja los nombres de clase en teal y subrayados.

**`testimonios.html`**

- `.reviews-source` es la atribución + el enlace a la ficha del negocio (el `?cid=` sale del mismo id que usa el iframe del mapa en `como-llegar.html` — ver la sección de datos estructurados).
- `.testimonial.review` es la variante de tarjeta para una reseña real: alineada a la izquierda y con la ficha del autor arriba. **El avatar es la inicial del nombre, no la foto de Google**: esas URLs caducan y además cargarlas desde `googleusercontent` filtraría la visita a Google.
- En `index.html` la fila de reseñas usa el mismo patrón que `#row-historia` (una reseña por pantalla, con snap y puntos). Antes eran tarjetas de 260px, pero las reseñas de Google son de largo muy distinto y a ese ancho la más larga obligaba a recortar el texto o a meterle scroll propio.

**`como-llegar.html`**

- `.transport-tabs` — mismos colores que los `.chip` de `planes.html`: teal translúcido en reposo, teal sólido con texto oscuro en la activa. Antes eran azul `#003df6`, que no está en la paleta del sitio.

**Páginas de disciplina**

- `levantamiento-olimpico.html` — Benjamín tiene 9 credenciales de competencia (los otros coaches tienen 3) y no caben en `.coach-info`, que en móvil mide ~175px: con `white-space:nowrap` el texto se salía de la píldora. Por eso ahí la lista es el **tercer hijo de `.coach-row`** (no va dentro de `.coach-info`) y las píldoras pueden partirse en dos líneas. **El salto de línea está acotado a `max-width:899px`**: ahí `.coach-row` va `flex-wrap:wrap` y la lista ocupa el ancho completo, debajo del nombre. De 900px para arriba no hay wrap y la lista es un tercer item del flex (`flex:1 1 0`), o sea foto + nombre + credenciales **en una sola línea** — sin eso la fila de ancho completo dejaba ~700px muertos a la derecha del nombre y la tarjeta medía 249px de alto en vez de 192px.
- `full-body.html` — es la única disciplina con **dos coaches** (Sonia y Jonathan), así que lleva un `<style>` propio con `.coach-row + .coach-row{margin-top:10px}`: `.coach-row` no trae margen y sin esa regla las dos tarjetas se tocan y se leen como una sola. Va inline en la página, no en `disciplina.css`, para no tener que subir el `?v=` de la hoja compartida en las 11 páginas que la enlazan.
- `adulto-mayor.html`, `gymnastics.html`, `hybrid.html` — Karen tiene credenciales más largas que las de la base y con `white-space:nowrap` la píldora se salía de la tarjeta en móvil.
- `coaches.html` — reutiliza `disciplina.css` para el chrome y solo añade lo propio de la página. Su `.coach-photo` recorta con `object-fit:cover` y `object-position:center 22%`, un valor calibrado para las fotos de Sonia y Karen; **la de Benjamín lleva `object-position:center top` en un `style=` propio** porque su foto tiene la cabeza mucho más arriba y con el 22 % compartido le cortaba la coronilla en los dos breakpoints.

**Compartido**

- `.quick-actions` — los `.pill` van scopeados a `.quick-actions` para que la barra se vea igual en todo el sitio aunque la página defina su propio `.pill` con otro tamaño (pasa en las disciplinas). `pointer-events:none` en el contenedor + `auto` en el `-inner` deja pasar el scroll y los clics al contenido que queda a los costados de la píldora. Ver "Barra flotante de CTA" más abajo para el resto de las restricciones.
- **Portal de alumnos BoxMagic: está oculto a propósito** con una regla CSS en `index.html`, `planes.html`, `disciplinas.html`, `testimonios.html`, `como-llegar.html` y `clase-gratis.html`. Para volver a mostrarlo hay que borrar esa regla en las seis. Antes lo decía un comentario en cada archivo; ahora solo está acá, así que **si no encuentras por qué el enlace a BoxMagic no se ve, es esto**.
- `clase-gratis.html` — la casilla de consentimiento va envuelta por el `<label>` junto con el texto, así que se puede pulsar en cualquier parte de la frase. El espaciado entre campos sale del `gap` del form; nada de márgenes entre campos.

## Patrones de interacción recurrentes

Todo el JS de interacción vive en `assets/js/app.js` — un solo archivo para las 15 páginas. Si tocas el drawer o los carruseles, se edita ahí y una vez.

- **Drawer del menú hamburguesa**: `#menuIcon` togglea `#drawer` / `#drawerOverlay`, se cierra con `#drawerClose`, click en el overlay, `Escape`, o al hacer click en un link del drawer. Las 15 páginas deben mantener esos cuatro `id` — el IIFE los busca sin comprobar si existen, así que si falta uno la página lanza y el resto del archivo no corre.
- **Acordeones**: los ítems de FAQ y los grupos de nav del footer/drawer usan `<details>/<summary>` nativos — no necesitan JS.
- **Barra flotante de CTA** (`.quick-actions`): los dos botones "Ver clases" / "Clase gratis" van fijos abajo en **17 de las 18 páginas**, con el mismo markup y el mismo aspecto que en `index.html`. La excepción es `clase-gratis.html`: ahí la página entera *es* el CTA, así que se quitaron la barra, su CSS y el `padding-bottom` extra del footer — no se la vuelvas a agregar. Es CSS puro, sin JS. Cuatro cosas que hay que respetar al tocarla:
  - **Flota, no es una barra pegada al borde.** Antes era una barra a `bottom:0` con fondo `var(--bg)` sólido de lado a lado; ahora el contenedor es transparente a `bottom:14px` y el fondo vive solo en `.quick-actions-inner` (`rgba(30,30,30,.88)` + `backdrop-filter:blur(14px)` + borde y sombra). No le devuelvas `background` al contenedor exterior: reaparece el marco negro.
  - El contenedor lleva `pointer-events:none` y el `-inner` `pointer-events:auto`, a propósito: sin eso la franja transparente a los costados de la pastilla capturaría el scroll y los clics del contenido que queda debajo.
  - Los `.pill` de la barra están scopeados como `.quick-actions .pill` a propósito, y solo sobreescriben tamaños: heredan colores de las reglas base `.pill-teal` / `.pill-dark`. Esas reglas base siguen en las páginas de disciplina aunque el bloque `.cta-pills` que las usaba ya no exista — si las borras, la barra pierde los colores.
  - La barra tapa el final de la página, así que el `footer` lleva `padding-bottom:120px` (móvil) y `130px` (≥900px). Si agregas la barra a una página nueva, agrega también ese espacio.

  El primer botón es **igual en las 17 páginas**: dice "Ver clases" y apunta a `disciplinas.html` (en `disciplinas.html` mismo apunta al ancla `#disciplinas` para no recargar la página). Antes decía "Reserva tu clase" y el `href` cambiaba por página — en las 9 disciplinas era un WhatsApp con el mensaje de esa disciplina, así que **ese click ya no dispara `contacto_whatsapp`**; el CTA de WhatsApp por disciplina vive ahora solo en el cuerpo de la página. El segundo botón sigue siendo `clase-gratis.html`, con `?clase=<slug>` en las 9 disciplinas. Ojo: los `.reserve-btn` de las tarjetas de plan (`index.html`, `planes.html`) también dicen "Reserva tu clase" y esos **sí** siguen yendo a WhatsApp — son otro componente. **Las 9 disciplinas tenían además un bloque `.cta-pills` al final del contenido con esos mismos dos botones; se eliminó por duplicado con la barra** — si necesitas un CTA en el cuerpo de una disciplina, no repitas los mismos dos botones.
- **Botonera del centro de ayuda** (`.help-tabs`): las mismas 4 pestañas en `preguntas-frecuentes.html` y las 3 páginas legales, cada una con `.active` en la suya. Son links normales (una pestaña = una carga de página, sin JS). Como en móvil no caben y la fila scrollea en horizontal, `app.js` ajusta el `scrollLeft` para centrar la pestaña activa al entrar — sin eso, en Cookies y Términos la activa queda fuera de pantalla.
- **Pestañas de transporte** (`.transport-tabs`, solo `como-llegar.html`): Metro / Micro / Bici / Auto. Son `<button role="tab">` con `aria-controls` apuntando al `id` de su `<div class="transport-info" role="tabpanel">`; el bloque de `app.js` los empareja por ese atributo, así que para agregar un modo de transporte basta con sumar el botón y su panel (con `hidden`) en el HTML. Colores: teal translúcido en reposo y `var(--teal)` con texto oscuro en la activa, los mismos que los `.chip` de `planes.html`.
- **Carruseles**: las filas con scroll-snap horizontal (`.cards-row`) se usan para los story slides, las tarjetas de disciplinas, las tarjetas de planes y los testimonios. Solo `index.html` genera puntos de paginación para estos (el JS escanea `.dots[data-for="<id de la fila>"]`, crea un botón por cada hijo de la fila referenciada, y resalta el más cercano al hacer scroll calculando posiciones). Ese bloque va en el mismo `app.js` compartido: en las páginas sin `.dots[data-for]` recorre una lista vacía y no hace nada, por eso no hace falta un archivo por página. Las páginas de listado dedicadas (`disciplinas.html`, `planes.html`, `testimonios.html`) renderizan la lista completa directamente en vez de un carrusel paginado.
  - **`#row-planes` es la excepción**: usa snap centrado (`scroll-snap-align:center` en las cards + `padding-inline:calc((100% - 230px) / 2)` en la fila) para que la card activa quede al medio del viewport móvil, mientras las otras filas siguen con `scroll-snap-align:start`. Ese `padding-inline` **debe anularse** en el `@media (min-width:900px)` (`padding-inline:0;scroll-snap-type:none;`), donde la fila pasa a ser grid: sobre 1100px el `calc()` metería ~435px de padding y rompería la grilla.

## Formulario de clase gratis

`clase-gratis.html` es la única página con formulario. Escribe una fila en una Google Sheet vía una Web App de Google Apps Script (columnas `Fecha`, `Nombre`, `RUT`, `Email`, `Telefono`, `Horario`, `Clase`, `Mensaje`; `Fecha` la pone el script).

- La URL `/exec` de la Web App vive en el atributo `data-endpoint` del `<form id="freeClassForm">` — no está en el JS, así que se cambia sin tocar `app.js`.
- El envío manda los datos **dos veces a propósito**: en la query string (Apps Script los expone en `e.parameter`) y en el body como JSON (`e.postData.contents`), para que el `doPost` funcione sin importar cómo parsee. El `Content-Type: text/plain` evita el preflight CORS, que Apps Script no responde.
- Las opciones del `<select name="horario">` llevan `data-clase` y el JS las filtra según la clase elegida. **Esos horarios son una copia de los de `disciplinas.html`** — si cambian los horarios reales hay que actualizarlos en ambos sitios (y en la página de la disciplina correspondiente).
- El RUT se valida en el cliente con módulo 11 y se formatea al salir del campo. Un RUT con dígito verificador incorrecto bloquea el envío.
- Acepta `?clase=CrossFit` en la URL para preseleccionar la disciplina al enlazar desde una página de disciplina.

### Anotaciones WebMCP

El `<form>` lleva `toolname` + `tooldescription`, y **los 8 campos con `name` llevan `toolparamdescription`**. Es [WebMCP declarativo](https://developer.chrome.com/docs/lighthouse/agentic-browsing/forms-missing-declarative-webmcp): describe el formulario para los agentes de IA en vez de dejar que lo adivinen leyendo el DOM. Son **solo metadatos** — ningún navegador actual cambia de comportamiento por ellos, no hay JS involucrado y el envío a Apps Script es exactamente el mismo. Como no toca `assets/`, tampoco hay que subir ningún `?v=`.

**Si agregas un campo al formulario, ponle su `toolparamdescription`.** Dejar la anotación a medias es lo único que rompe algo: de los tres audits de la categoría *Agentic Browsing* de Lighthouse, los de cobertura e inventario de herramientas son informativos ("Sin puntuación"), pero [el de esquema válido](https://developer.chrome.com/docs/lighthouse/agentic-browsing/webmcp-schema-validity) **sí falla** con `toolname` sin `tooldescription`, con un campo `required` sin `name`, o con un campo sin `toolparamdescription`. Este es el único `<form>` del sitio, así que la cobertura es 1/1.

Dos cosas que las descripciones dicen a propósito, porque un agente no las puede deducir del HTML: que **la clase se elige antes que el horario** (el JS filtra las opciones, y un horario de otra disciplina no existe en la realidad), y que dos `value` no coinciden con su texto visible (`Hyrox / Hybrid`, `Competidor`). Si cambia cualquiera de las dos cosas, la descripción queda mintiendo.

**No se usó la API imperativa** (`registerTool` en JS), y conviene que siga así: está en origin trial desde Chrome 149 y la spec ya movió el objeto de `navigator.modelContext` a `document`, con el primero deprecado en Chrome 150. Sería código que hay que perseguir cada versión de Chrome a cambio de una línea en un reporte informativo. La vía declarativa no tiene ese problema.

## Eventos de conversión

El bloque de tracking de `app.js` es un solo listener delegado en `document` (fase de captura) que deduce la intención del `href` del `<a>` clickeado — no hay que marcar nada a mano en el HTML al agregar un CTA nuevo. Todo pasa por el helper `enviar(nombre, params)`, que agrega `pagina` (el pathname) y hace `window.dataLayer.push({event: nombre, ...params})`.

Nombres de evento que el contenedor GTM debe tener registrados como trigger de **Custom Event** (si falta el trigger, el push ocurre pero no llega nada a GA4):

| Evento | Se dispara al | Params |
|---|---|---|
| `contacto_whatsapp` | click en cualquier link `wa.me/` | `intencion` (`general` / `clase_gratis` / `reservar_clase` / `plan`), `detalle`, `origen` |
| `ver_clase_gratis` | click hacia `clase-gratis.html` | `disciplina`, `origen` |
| `ver_disciplina` | click hacia una de las 9 páginas de disciplina | `disciplina`, `origen` |
| `click_social` | click a Instagram o Facebook | `red` |
| `click_boxmagic` | click a un link de BoxMagic | — |
| `clase_gratis_enviada` | respuesta OK del form de `clase-gratis.html` | `clase`, `horario` |

`origen` sale de la función `origen(a)`, que mira el ancestro del link (`marquee`, `barra_fija`, `cta_disciplina`, `cta_listado`, `hero`, `menu`, `footer`, `contenido`) para saber qué zona de la página convierte.

## Notas de contenido

- La info de contacto (número de WhatsApp vía links `wa.me/<numero>`, dirección del gym "Calle Uno 1050, San Miguel") está hardcodeada inline y repetida en las 15 páginas — hay que actualizar cada ocurrencia si cambia, **incluida la copia de `llms.txt`**.
- `.mcp.json` configura el servidor MCP de Figma; este HTML se construyó/mantiene sincronizado contra un diseño de Figma (frame mobile, ~390px de ancho) — al aplicar cambios nuevos de Figma, usa el orden de secciones de `index.html` (hero → marquee de tags → quick actions → historia → disciplinas → planes → testimonios → FAQ → footer) como referencia.
