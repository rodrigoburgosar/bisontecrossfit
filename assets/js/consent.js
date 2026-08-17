/* Consentimiento de cookies.
   ---------------------------------------------------------------------------
   Hasta ahora Google Tag Manager y Microsoft Clarity se cargaban en las
   primeras 20 lineas del <head> de todas las paginas, incluidas las propias
   politicas, sin pedir permiso. Clarity ademas graba la sesion completa con
   movimientos de raton y pulsaciones: no es analitica agregada.

   Este archivo invierte el orden: no se carga nada de terceros hasta que la
   persona elige.

   Se carga CON defer, arriba del <head>. Antes iba sin defer, "para decidir
   antes de que se pinte nada", y eso bloqueaba el renderizado 530 ms en movil.
   La razon no se sostenia: lo unico que corre de forma sincrona es
   consentModePorDefecto() —declarar el dataLayer—, y el banner, GTM y Clarity
   cuelgan todos de DOMContentLoaded (ver el arranque, al final del fichero).
   Como GTM lo carga este mismo script, el orden se respeta igual con defer.

   Dos categorias separadas a proposito:
     analitica -> Google Tag Manager / GA4 (estadisticas agregadas)
     grabacion -> Microsoft Clarity (graba la sesion, mucho mas invasivo)

   Rechazar es tan facil como aceptar: son dos botones del mismo peso en el
   mismo sitio. Un banner donde rechazar cuesta mas que aceptar no vale como
   consentimiento libre.
   =========================================================================== */
(function(){
  'use strict';

  var CLAVE   = 'bisonte_consent';
  var VERSION = 1;                 // subir esto invalida el consentimiento guardado
  var GTM_ID     = 'GTM-WVD4NKS4';
  var CLARITY_ID = 'xx809mpyos';

  /* ---------------------------------------------------------------
     Estado guardado
     --------------------------------------------------------------- */

  function leer(){
    try {
      var crudo = localStorage.getItem(CLAVE);
      if(!crudo) return null;
      var d = JSON.parse(crudo);
      // Si cambia la version, se vuelve a preguntar.
      return (d && d.v === VERSION) ? d : null;
    } catch(e){
      // Modo privado con almacenamiento bloqueado: se pregunta cada vez,
      // que es el lado seguro.
      return null;
    }
  }

  function guardar(analitica, grabacion){
    try {
      localStorage.setItem(CLAVE, JSON.stringify({
        v: VERSION,
        analitica: !!analitica,
        grabacion: !!grabacion,
        ts: new Date().toISOString()
      }));
    } catch(e){ /* si no se puede guardar, se preguntara de nuevo */ }
  }

  /* ---------------------------------------------------------------
     Carga de los scripts de terceros
     --------------------------------------------------------------- */

  var cargado = {analitica: false, grabacion: false};

  function consentModePorDefecto(){
    /* Consent Mode v2. Se declara denegado antes de cargar GTM para que las
       etiquetas que dependan del consentimiento sepan a que atenerse desde el
       primer momento, aunque aqui GTM ni siquiera se cargue sin permiso. */
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: 500
    });
  }

  function cargarGTM(){
    if(cargado.analitica) return;
    cargado.analitica = true;

    window.dataLayer = window.dataLayer || [];
    if(window.gtag){
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted'
      });
    }
    window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }

  function cargarClarity(){
    if(cargado.grabacion) return;
    cargado.grabacion = true;

    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function aplicar(d){
    if(!d) return;
    if(d.analitica) cargarGTM();
    if(d.grabacion) cargarClarity();
  }

  /* ---------------------------------------------------------------
     Banner
     --------------------------------------------------------------- */

  function construirBanner(){
    var caja = document.createElement('div');
    caja.className = 'consent';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'false');
    caja.setAttribute('aria-labelledby', 'consentTitulo');
    caja.innerHTML = [
      '<div class="consent-inner">',
        '<div class="consent-texto">',
          '<h2 id="consentTitulo">Cookies</h2>',
          '<p>Usamos cookies propias y de terceros para entender cómo se usa la web y mejorarla. ',
          'Puedes aceptarlas, rechazarlas o elegir cuáles. Consulta nuestra ',
          '<a href="/politica-cookies">política de cookies</a>.</p>',
        '</div>',
        '<div class="consent-acciones">',
          '<button type="button" class="consent-btn consent-rechazar" data-consent="rechazar">Rechazar</button>',
          '<button type="button" class="consent-btn consent-preferencias" data-consent="abrir-preferencias">Preferencias</button>',
          '<button type="button" class="consent-btn consent-aceptar" data-consent="aceptar">Aceptar</button>',
        '</div>',
        '<div class="consent-detalle" hidden>',
          '<label class="consent-opcion consent-fija">',
            '<input type="checkbox" checked disabled>',
            '<span><b>Necesarias</b><br>Hacen funcionar la web. No se pueden desactivar y no te identifican.</span>',
          '</label>',
          '<label class="consent-opcion">',
            '<input type="checkbox" id="consentAnalitica">',
            '<span><b>Estadísticas</b><br>Google Analytics, vía Tag Manager. Nos dicen qué páginas se visitan y desde dónde.</span>',
          '</label>',
          '<label class="consent-opcion">',
            '<input type="checkbox" id="consentGrabacion">',
            '<span><b>Grabación de sesión</b><br>Microsoft Clarity. Registra movimientos del ratón y clics para ver dónde se atasca la gente.</span>',
          '</label>',
          '<button type="button" class="consent-btn consent-guardar" data-consent="guardar">Guardar mi elección</button>',
        '</div>',
      '</div>'
    ].join('');
    return caja;
  }

  function mostrarBanner(){
    var banner = construirBanner();
    document.body.appendChild(banner);

    // Se anade en el siguiente frame para que la transicion de entrada corra.
    requestAnimationFrame(function(){ banner.classList.add('visible'); });

    var detalle = banner.querySelector('.consent-detalle');

    banner.addEventListener('click', function(e){
      var btn = e.target.closest('[data-consent]');
      if(!btn) return;
      var accion = btn.getAttribute('data-consent');

      if(accion === 'abrir-preferencias'){
        var abierto = !detalle.hidden;
        detalle.hidden = abierto;
        btn.setAttribute('aria-expanded', String(!abierto));
        if(!abierto) banner.querySelector('#consentAnalitica').focus();
        return;
      }

      var analitica = false, grabacion = false;
      if(accion === 'aceptar'){
        analitica = grabacion = true;
      } else if(accion === 'guardar'){
        analitica = banner.querySelector('#consentAnalitica').checked;
        grabacion = banner.querySelector('#consentGrabacion').checked;
      }
      // 'rechazar' deja las dos en false.

      guardar(analitica, grabacion);
      aplicar({analitica: analitica, grabacion: grabacion});
      cerrar(banner);
    });
  }

  function cerrar(banner){
    banner.classList.remove('visible');
    setTimeout(function(){ banner.remove(); }, 220);
  }

  /* ---------------------------------------------------------------
     Reapertura desde la politica de cookies

     Sin una forma de cambiar de idea, el consentimiento no es revocable y
     no vale. Cualquier enlace con data-abrir-consentimiento lo reabre.
     --------------------------------------------------------------- */

  function engancharReapertura(){
    document.addEventListener('click', function(e){
      var t = e.target.closest('[data-abrir-consentimiento]');
      if(!t) return;
      e.preventDefault();
      try { localStorage.removeItem(CLAVE); } catch(err){}
      if(!document.querySelector('.consent')) mostrarBanner();
    });
  }

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */

  consentModePorDefecto();

  var decidido = leer();

  function iniciar(){
    engancharReapertura();
    if(decidido) aplicar(decidido);
    else mostrarBanner();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
