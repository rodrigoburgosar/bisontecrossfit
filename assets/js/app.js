/* Bisonte CrossFit - JS compartido por todas las paginas.
   1) Drawer del menu hamburguesa.
   2) Puntos de paginacion de los carruseles: solo actua si la pagina
      tiene .dots[data-for]; en el resto recorre una lista vacia y no
      hace nada, por eso el mismo archivo sirve para las 14 paginas.
   3) Chips de filtro de planes: solo actua si la pagina tiene
      .filter-chips (hoy solo planes.html).
   4) Eventos de GA4 sobre los CTA.
   5) Formulario de clase gratis: solo actua si la pagina tiene
      #freeClassForm (hoy solo clase-gratis.html).
   Se carga con defer, asi que corre con el DOM ya parseado. */
(function(){
  var menuIcon = document.getElementById('menuIcon');
  var drawer = document.getElementById('drawer');
  var overlay = document.getElementById('drawerOverlay');
  var closeBtn = document.getElementById('drawerClose');

  function openDrawer(){
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    menuIcon.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  }
  function closeDrawer(){
    if(!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    menuIcon.setAttribute('aria-expanded', 'false');
    menuIcon.focus();
  }

  menuIcon.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeDrawer();
  });
  drawer.addEventListener('keydown', function(e){
    if(e.key !== 'Tab') return;
    var focusables = drawer.querySelectorAll('button, a[href], summary');
    if(!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
  drawer.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeDrawer);
  });
})();

document.querySelectorAll('.dots[data-for]').forEach(function(dotsEl){
  var row = document.getElementById(dotsEl.dataset.for);
  if(!row) return;
  var cards = Array.from(row.children);
  if(!cards.length) return;

  cards.forEach(function(_, i){
    var dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Ir a tarjeta ' + (i + 1));
    dot.addEventListener('click', function(){
      cards[i].scrollIntoView({behavior:'smooth', inline:'start', block:'nearest'});
    });
    dotsEl.appendChild(dot);
  });

  var dotEls = Array.from(dotsEl.children);
  var ticking = false;
  row.addEventListener('scroll', function(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var rowRect = row.getBoundingClientRect();
      var center = rowRect.left + rowRect.width / 2;
      var closest = 0;
      var closestDist = Infinity;
      cards.forEach(function(card, i){
        var rect = card.getBoundingClientRect();
        var dist = Math.abs((rect.left + rect.width / 2) - center);
        if(dist < closestDist){ closestDist = dist; closest = i; }
      });
      dotEls.forEach(function(d, i){ d.classList.toggle('active', i === closest); });
      ticking = false;
    });
  }, {passive:true});
});

/* Chips de filtro de planes (planes.html). Cada chip togglea su categoria;
   con uno o mas activos solo se muestran esas secciones, sin ninguno se ven
   todas. En las paginas sin .filter-chips la lista queda vacia y no pasa nada. */
(function(){
  var chips = document.querySelectorAll('.filter-chips [data-filtro]');
  if(!chips.length) return;
  var secciones = document.querySelectorAll('.plan-section[data-categoria]');

  function aplicar(){
    var activos = [];
    chips.forEach(function(c){
      if(c.classList.contains('active')) activos.push(c.dataset.filtro);
    });
    secciones.forEach(function(sec){
      sec.hidden = activos.length > 0 && activos.indexOf(sec.dataset.categoria) === -1;
    });
  }

  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      chip.classList.toggle('active');
      aplicar();
    });
  });
})();

/* Botonera del centro de ayuda (preguntas-frecuentes + las 3 paginas legales).
   En movil las 4 pestañas no caben y la fila scrollea en horizontal, asi que
   al entrar a Cookies o Terminos (3a y 4a) la pestaña activa queda fuera de
   pantalla y parece que no estuviera. La traemos a la vista moviendo el
   scrollLeft de la fila; scrollIntoView tambien moveria la pagina en vertical. */
(function(){
  var tabs = document.querySelector('.help-tabs');
  if(!tabs) return;
  var activa = tabs.querySelector('.help-tab.active');
  if(!activa) return;
  tabs.scrollLeft = Math.max(0, activa.offsetLeft - (tabs.clientWidth - activa.offsetWidth) / 2);
})();

/* Eventos hacia GTM (dataLayer).
   Cada evento se empuja como {event:'<nombre>', ...params}; el contenedor GTM
   los recoge con un trigger de Custom Event y los reenvia a GA4.
   Un solo listener delegado en document cubre las 14 paginas sin tocar el
   HTML. La intencion se deduce del propio href, asi que no hay que marcar
   nada a mano ni recordar actualizarlo al agregar un CTA nuevo.
   Se escucha en fase de captura para que el evento salga aunque algun otro
   handler detenga la propagacion. */
(function(){
  var DISCIPLINAS = /^(crossfit|levantamiento-olimpico|hybrid|gymnastics|strongman|full-body|competidor|adulto-mayor)\.html$/;

  function enviar(nombre, params){
    // dataLayer existe siempre (lo crea el snippet de GTM del <head>), pero si
    // un bloqueador lo elimina, no queremos romper la navegacion.
    if(!window.dataLayer || typeof window.dataLayer.push !== 'function') return;
    params.event = nombre;
    params.pagina = location.pathname;
    window.dataLayer.push(params);
  }

  // De donde salio el clic, para saber que zona de la pagina convierte.
  function origen(a){
    if(a.closest('.tags-strip')) return 'marquee';
    if(a.closest('.quick-actions')) return 'barra_fija';
    if(a.closest('.cta-pills')) return 'cta_disciplina';
    if(a.closest('.cta-banner')) return 'cta_listado';
    if(a.closest('.hero')) return 'hero';
    if(a.closest('.drawer')) return 'menu';
    if(a.closest('footer')) return 'footer';
    return 'contenido';
  }

  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if(!a) return;
    var href = a.getAttribute('href') || '';

    // WhatsApp: es la unica via de contacto del sitio, o sea la conversion.
    if(href.indexOf('wa.me/') !== -1){
      var texto = '';
      var q = href.split('?text=')[1];
      if(q){ try { texto = decodeURIComponent(q); } catch(err){ texto = q; } }

      var intencion = 'general';   // boton suelto de WhatsApp (footer, menu, dudas)
      var detalle = '';
      if(/clase gratis/i.test(texto)){
        intencion = 'clase_gratis';
      } else if(/^Quiero reservar una clase de /i.test(texto)){
        intencion = 'reservar_clase';
        detalle = texto.replace(/^Quiero reservar una clase de /i, '');
      } else if(/^Quiero el /i.test(texto)){
        intencion = 'plan';
        detalle = texto.replace(/^Quiero el /i, '');
      }

      enviar('contacto_whatsapp', {intencion: intencion, detalle: detalle, origen: origen(a)});
      return;
    }

    /* Clase gratis: antes era un link a WhatsApp y caia en contacto_whatsapp.
       Ahora es la pagina del formulario, asi que se mide aparte. El embudo
       queda: ver_clase_gratis (clic) -> clase_gratis_enviada (formulario ok). */
    if(href.indexOf('clase-gratis.html') === 0){
      var slug = href.split('?clase=')[1] || '';
      enviar('ver_clase_gratis', {disciplina: slug, origen: origen(a)});
      return;
    }

    var d = href.match(DISCIPLINAS);
    if(d){ enviar('ver_disciplina', {disciplina: d[1], origen: origen(a)}); return; }

    if(href.indexOf('instagram.com') !== -1){ enviar('click_social', {red: 'instagram'}); return; }
    if(href.indexOf('facebook.com') !== -1){ enviar('click_social', {red: 'facebook'}); return; }
    if(href.indexOf('boxmagic') !== -1){ enviar('click_boxmagic', {}); return; }
  }, true);
})();

/* Formulario "Prueba tu clase gratis" (clase-gratis.html).
   Igual que el bloque de los dots: en las paginas que no tienen el
   formulario sale en la primera linea y no hace nada.
   La URL de la Web App de Apps Script se lee del atributo data-endpoint
   del <form>, para no tener que tocar este archivo si cambia. */
(function(){
  var form = document.getElementById('freeClassForm');
  if(!form) return;

  var statusEl = document.getElementById('freeClassStatus');
  var successEl = document.getElementById('freeClassSuccess');
  var submitBtn = document.getElementById('freeClassSubmit');
  var submitLabel = submitBtn.querySelector('span');
  var submitTexto = submitLabel.textContent;
  var claseSel = form.elements.clase;
  var horarioSel = form.elements.horario;
  var rutInput = form.elements.rut;
  var horarioOpts = Array.from(horarioSel.options);
  var whatsapp = form.dataset.whatsapp || 'https://wa.me/56967374096';

  /* --- RUT: formato y digito verificador (modulo 11) --- */
  function rutLimpio(v){ return String(v).replace(/[^0-9kK]/g, '').toUpperCase(); }

  function rutFormateado(v){
    var r = rutLimpio(v);
    if(r.length < 2) return r;
    var cuerpo = r.slice(0, -1);
    return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + r.slice(-1);
  }

  function rutValido(v){
    var r = rutLimpio(v);
    if(r.length < 7 || r.length > 9) return false;
    var cuerpo = r.slice(0, -1);
    if(!/^\d+$/.test(cuerpo)) return false;
    var suma = 0;
    var mult = 2;
    for(var i = cuerpo.length - 1; i >= 0; i--){
      suma += parseInt(cuerpo.charAt(i), 10) * mult;
      mult = mult === 7 ? 2 : mult + 1;
    }
    var resto = 11 - (suma % 11);
    var dv = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
    return r.slice(-1) === dv;
  }

  rutInput.addEventListener('blur', function(){
    if(rutInput.value.trim()) rutInput.value = rutFormateado(rutInput.value);
  });

  /* --- Los horarios dependen de la clase elegida ---
     Las opciones van agrupadas en <optgroup> por dia (Lunes a Viernes,
     Martes y Jueves...); ademas de filtrar las opciones hay que ocultar
     los optgroup que se quedan sin ninguna opcion visible. */
  function filtrarHorarios(){
    var clase = claseSel.value;
    horarioOpts.forEach(function(opt){
      if(!opt.value) return;                       // el placeholder siempre queda
      var soloDe = opt.dataset.clase;              // sin data-clase = sirve para todas
      var visible = !soloDe || soloDe === clase;
      opt.hidden = !visible;
      opt.disabled = !visible;
    });
    Array.from(horarioSel.querySelectorAll('optgroup')).forEach(function(grupo){
      grupo.hidden = !Array.from(grupo.children).some(function(opt){ return !opt.hidden; });
    });
    var actual = horarioSel.options[horarioSel.selectedIndex];
    if(actual && actual.disabled) horarioSel.value = '';
    horarioOpts[0].textContent = clase ? 'Selecciona un horario' : 'Primero elige una clase';
  }
  claseSel.addEventListener('change', function(){
    filtrarHorarios();
    marcarError(claseSel, false);
  });

  /* Preselecciona la disciplina si vienen por clase-gratis.html?clase=<slug>.
     Acepta el slug (crossfit, full-body...) o el nombre visible de la opcion. */
  var claseInicial = (new URLSearchParams(location.search).get('clase') || '').toLowerCase();
  if(claseInicial){
    Array.from(claseSel.options).forEach(function(opt){
      if(!opt.value) return;
      if(opt.value.toLowerCase() === claseInicial || opt.dataset.slug === claseInicial){
        claseSel.value = opt.value;
      }
    });
  }
  filtrarHorarios();

  /* --- Validacion --- */
  function marcarError(campo, hayError){
    var cont = campo.closest('.form-field');
    if(cont) cont.classList.toggle('has-error', hayError);
  }

  function validar(){
    var errores = [];
    var nombre = form.elements.nombre;
    var email = form.elements.email;
    var telefono = form.elements.telefono;

    var malNombre = nombre.value.trim().length < 3;
    var malRut = !rutValido(rutInput.value);
    var malEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    var malTelefono = telefono.value.trim() !== '' && telefono.value.replace(/\D/g, '').length < 8;
    var malClase = !claseSel.value;
    var malHorario = !horarioSel.value;

    marcarError(nombre, malNombre);
    marcarError(rutInput, malRut);
    marcarError(email, malEmail);
    marcarError(telefono, malTelefono);
    marcarError(claseSel, malClase);
    marcarError(horarioSel, malHorario);

    [[malNombre, nombre], [malRut, rutInput], [malEmail, email],
     [malTelefono, telefono], [malClase, claseSel], [malHorario, horarioSel]]
      .forEach(function(par){ if(par[0]) errores.push(par[1]); });

    if(errores.length) errores[0].focus();
    return errores.length === 0;
  }

  form.addEventListener('input', function(e){
    if(e.target.closest('.form-field.has-error')) marcarError(e.target, false);
  });

  /* --- Envio --- */
  function mostrarEstado(tipo, html){
    statusEl.className = 'form-status show ' + tipo;
    statusEl.innerHTML = html;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    statusEl.className = 'form-status';
    if(!validar()) return;

    var endpoint = (form.dataset.endpoint || '').trim();
    if(!endpoint){
      mostrarEstado('fail', 'Falta pegar la URL de la Web App en el atributo <b>data-endpoint</b> del formulario.');
      return;
    }

    var datos = {};
    new FormData(form).forEach(function(valor, campo){
      datos[campo] = typeof valor === 'string' ? valor.trim() : valor;
    });

    submitBtn.disabled = true;
    submitLabel.textContent = 'Enviando...';

    /* Los datos van dos veces a proposito: en la query string (Apps Script los
       expone en e.parameter) y en el body como JSON (e.postData.contents), asi
       el doPost funciona lea como lea. El Content-Type text/plain evita el
       preflight CORS, que Apps Script no responde. */
    var url = endpoint + (endpoint.indexOf('?') === -1 ? '?' : '&') + new URLSearchParams(datos).toString();

    fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify(datos)
    })
    .then(function(res){
      if(!res.ok) throw new Error('HTTP ' + res.status);
      form.style.display = 'none';
      statusEl.className = 'form-status';
      successEl.classList.add('show');
      successEl.scrollIntoView({behavior: 'smooth', block: 'center'});
      if(window.dataLayer && typeof window.dataLayer.push === 'function'){
        window.dataLayer.push({event: 'clase_gratis_enviada', clase: datos.clase, horario: datos.horario});
      }
    })
    .catch(function(){
      submitBtn.disabled = false;
      submitLabel.textContent = submitTexto;
      mostrarEstado('fail', 'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por <a href="' + whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>.');
    });
  });
})();
