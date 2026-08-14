/**
 * Apps Script del formulario "Prueba tu clase gratis" (clase-gratis.html).
 *
 * Como instalarlo:
 * 1. Crea una Google Sheet nueva (o usa una existente) con esta fila de
 *    encabezado exacta en la primera hoja:
 *    Fecha | Nombre | RUT | Email | Telefono | Horario | Clase | Mensaje
 * 2. En la Sheet: Extensiones > Apps Script.
 * 3. Borra el contenido de Code.gs y pega este archivo completo.
 * 4. Cambia AVISAR_A por el correo donde quieres recibir los leads.
 * 5. Deploy > Nueva implementacion > tipo "Aplicacion web".
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quien tiene acceso: Cualquier usuario
 * 6. Autoriza los permisos que pida Google. Ojo: al anadir el envio de correo,
 *    Google vuelve a pedir autorizacion aunque ya la hubieras dado antes.
 * 7. Copia la URL que termina en /exec y pegala en el atributo
 *    data-endpoint del <form id="freeClassForm"> en clase-gratis.html.
 *
 * IMPORTANTE: cada vez que edites este archivo hay que volver a desplegar
 * (Deploy > Gestionar implementaciones > editar > Nueva version). Si solo
 * guardas, la web sigue llamando a la version antigua.
 */

/* ------------------------------------------------------------------ */
/* Configuracion                                                       */
/* ------------------------------------------------------------------ */

// Correo(s) que reciben el aviso de cada lead. Para varios, separalos con coma.
var AVISAR_A = 'contacto@bisontecrossfit.cl';

// Nombre que aparece como remitente en los correos.
var REMITENTE = 'Bisonte CrossFit';

// Poner en false si no quieres que al alumno le llegue un correo de confirmacion.
var ENVIAR_AUTORESPUESTA = true;

var WHATSAPP = 'https://wa.me/56967374096';
var DIRECCION = 'Calle Uno 1050, San Miguel — a pasos del Metro Departamental';

/* ------------------------------------------------------------------ */

function doPost(e) {
  var datos = {};

  try {
    if (e.postData && e.postData.contents) {
      datos = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    // si el body no es JSON valido, seguimos con e.parameter
  }

  if (!datos.nombre && e.parameter) {
    datos = e.parameter;
  }

  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  hoja.appendRow([
    new Date(),
    datos.nombre || '',
    datos.rut || '',
    datos.email || '',
    datos.telefono || '',
    datos.horario || '',
    datos.clase || '',
    datos.mensaje || ''
  ]);

  /* El envio de correo va DESPUES del appendRow y dentro de su propio
     try/catch a proposito: si Google rechaza el correo (cuota diaria agotada,
     permisos revocados), el lead ya esta guardado en la hoja y el formulario
     le responde ok al alumno igual. Perder el aviso es molesto; perder el
     lead, no. */
  try {
    avisarAlBox(datos);
  } catch (err) {
    console.error('No se pudo enviar el aviso al box: ' + err);
  }

  if (ENVIAR_AUTORESPUESTA) {
    try {
      responderAlAlumno(datos);
    } catch (err) {
      console.error('No se pudo enviar la autorespuesta: ' + err);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Aviso interno. El asunto lleva el nombre y la clase para poder triar desde
 * la bandeja sin abrir el correo, y replyTo apunta al alumno para poder
 * contestarle directamente con responder.
 */
function avisarAlBox(datos) {
  var nombre = datos.nombre || 'Sin nombre';
  var clase = datos.clase || 'Sin clase';
  var horario = datos.horario || 'Sin horario';

  var asunto = 'Clase gratis: ' + nombre + ' — ' + clase + ' (' + horario + ')';

  var filas = [
    ['Nombre', nombre],
    ['RUT', datos.rut || '—'],
    ['Email', datos.email || '—'],
    ['Telefono', datos.telefono || '—'],
    ['Clase', clase],
    ['Horario', horario],
    ['Mensaje', datos.mensaje || '—']
  ];

  var texto = 'Nueva solicitud de clase gratis\n\n';
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">'
    + '<h2 style="margin:0 0 16px;font-size:18px">Nueva solicitud de clase gratis</h2>'
    + '<table cellpadding="7" cellspacing="0" border="0" style="border-collapse:collapse">';

  filas.forEach(function (fila) {
    texto += fila[0] + ': ' + fila[1] + '\n';
    html += '<tr>'
      + '<td style="border-bottom:1px solid #eee;color:#666;white-space:nowrap">' + fila[0] + '</td>'
      + '<td style="border-bottom:1px solid #eee"><b>' + escaparHtml(String(fila[1])) + '</b></td>'
      + '</tr>';
  });

  html += '</table>';

  if (datos.telefono) {
    var soloDigitos = String(datos.telefono).replace(/\D/g, '');
    html += '<p style="margin:18px 0 0">'
      + '<a href="https://wa.me/56' + soloDigitos.replace(/^56/, '')
      + '" style="background:#25D366;color:#fff;padding:10px 18px;border-radius:70px;text-decoration:none;display:inline-block">'
      + 'Escribirle por WhatsApp</a></p>';
  }

  html += '</div>';

  var opciones = { name: REMITENTE, htmlBody: html };
  if (datos.email) opciones.replyTo = datos.email;

  MailApp.sendEmail(AVISAR_A, asunto, texto, opciones);
}

/**
 * Confirmacion para el alumno. Solo se envia si dejo un email con pinta de
 * valido: un email mal escrito genera un rebote que ensucia la reputacion de
 * la cuenta que envia.
 */
function responderAlAlumno(datos) {
  var email = (datos.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;

  var nombre = (datos.nombre || '').split(' ')[0] || 'Hola';
  var clase = datos.clase || 'tu clase';
  var horario = datos.horario || '';

  var asunto = 'Tu clase gratis en Bisonte CrossFit está agendada';

  var texto = nombre + ', ¡gracias por agendar!\n\n'
    + 'Recibimos tu solicitud para ' + clase + (horario ? ' (' + horario + ')' : '') + '.\n'
    + 'Te confirmamos el cupo por WhatsApp dentro de las próximas horas.\n\n'
    + 'Dónde: ' + DIRECCION + '\n'
    + 'Qué llevar: ropa cómoda, zapatillas y una botella de agua.\n'
    + 'Llega 10 minutos antes para que el coach te explique la clase.\n\n'
    + '¿Alguna duda? Escríbenos: ' + WHATSAPP + '\n\n'
    + 'Nos vemos en el box.\nEquipo Bisonte CrossFit';

  var html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.55;max-width:520px">'
    + '<p style="margin:0 0 14px"><b>' + escaparHtml(nombre) + '</b>, ¡gracias por agendar!</p>'
    + '<p style="margin:0 0 14px">Recibimos tu solicitud para <b>' + escaparHtml(clase) + '</b>'
    + (horario ? ' (' + escaparHtml(horario) + ')' : '')
    + '. Te confirmamos el cupo por WhatsApp dentro de las próximas horas.</p>'
    + '<table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;background:#f6f6f6;border-radius:8px;margin:0 0 16px">'
    + '<tr><td style="color:#666;white-space:nowrap">Dónde</td><td><b>' + escaparHtml(DIRECCION) + '</b></td></tr>'
    + '<tr><td style="color:#666;white-space:nowrap">Qué llevar</td><td>Ropa cómoda, zapatillas y una botella de agua</td></tr>'
    + '<tr><td style="color:#666;white-space:nowrap">Ojo</td><td>Llega 10 minutos antes para que el coach te explique la clase</td></tr>'
    + '</table>'
    + '<p style="margin:0 0 18px">¿Alguna duda antes de venir?</p>'
    + '<p style="margin:0 0 20px"><a href="' + WHATSAPP + '" style="background:#25D366;color:#fff;padding:11px 20px;border-radius:70px;text-decoration:none;display:inline-block">Escríbenos por WhatsApp</a></p>'
    + '<p style="margin:0;color:#666">Nos vemos en el box.<br>Equipo Bisonte CrossFit</p>'
    + '</div>';

  MailApp.sendEmail(email, asunto, texto, { name: REMITENTE, htmlBody: html });
}

function escaparHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
