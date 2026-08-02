/**
 * Apps Script del formulario "Prueba tu clase gratis" (clase-gratis.html).
 *
 * Como instalarlo:
 * 1. Crea una Google Sheet nueva (o usa una existente) con esta fila de
 *    encabezado exacta en la primera hoja:
 *    Fecha | Nombre | RUT | Email | Telefono | Horario | Clase | Mensaje
 * 2. En la Sheet: Extensiones > Apps Script.
 * 3. Borra el contenido de Code.gs y pega este archivo completo.
 * 4. Deploy > Nueva implementacion > tipo "Aplicacion web".
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quien tiene acceso: Cualquier usuario
 * 5. Autoriza los permisos que pida Google.
 * 6. Copia la URL que termina en /exec y pegala en el atributo
 *    data-endpoint del <form id="freeClassForm"> en clase-gratis.html.
 */
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

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
