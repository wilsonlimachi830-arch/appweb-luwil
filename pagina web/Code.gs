/**
 * API de solo lectura para la tienda.
 * AppSheet y la tienda usan la misma hoja de cálculo.
 * Ejecuta setupCatalog() una vez y despliega como Aplicación web.
 */
const SHEET_NAME = "Productos";
const HEADERS = ["ID", "NOMBRE", "PRECIO", "FOTO", "DESCRIPCION", "DISPONIBLE", "CANTIDAD"];

function setupCatalog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#dbeafe");
  sheet.setColumnWidths(1, HEADERS.length, 150);
  sheet.setColumnWidth(2, 260);
  sheet.setColumnWidth(4, 360);

  // Carga ejemplos solamente si la hoja está vacía (además de los encabezados).
  if (sheet.getLastRow() < 2) {
    const rows = [
      ["ORG-001","Organizador acrílico con cajones",0,"https://m.media-amazon.com/images/I/815HJksuF0L._AC_SL1500_.jpg","Cajones transparentes apilables para cosméticos, baño y artículos cotidianos. Facilitan ver y acceder al contenido.","Sí",10],
      ["ORG-002","Organizador transparente multiuso",0,"https://m.media-amazon.com/images/I/71QVFOcs0EL._AC_SL1500_.jpg","Solución de almacenamiento para armarios, estantes y encimeras.","Sí",10],
      ["ORG-003","Caja organizadora para el hogar",0,"https://m.media-amazon.com/images/I/71jJzm+pjoL._AC_SL1500_.jpg","Contenedor versátil para ordenar objetos de uso diario.","Sí",10],
      ["ORG-004","Organizador compacto",0,"https://m.media-amazon.com/images/I/71me4nDrYcL._AC_SL1500_.jpg","Accesorio funcional para ordenar productos pequeños.","Sí",10],
      ["ORG-005","Caja de almacenamiento",0,"https://m.media-amazon.com/images/I/61o81vPHbiL._AC_SL1500_.jpg","Contenedor multiuso para agrupar artículos cotidianos.","Sí",10],
      ["ORG-006","Organizador de espacios",0,"https://m.media-amazon.com/images/I/713zAnmGd6L._AC_SL1500_.jpg","Alternativa para clasificar accesorios y mantener el orden.","Sí",10],
      ["ORG-007","Organizador apilable",0,"https://m.media-amazon.com/images/I/71VACwDk0HL._AC_SL1500_.jpg","Aprovecha el espacio vertical en el hogar.","Sí",10],
      ["ORG-008","Contenedor organizador",0,"https://m.media-amazon.com/images/I/71M8viXXxoL._AC_SL1500_.jpg","Contenedor multiuso para mantener objetos accesibles.","Sí",10],
      ["ORG-009","Accesorio de almacenamiento",0,"https://m.media-amazon.com/images/I/71y83QdHV5L._AC_SL1500_.jpg","Complemento práctico para ordenar espacios.","Sí",10],
      ["ORG-010","Organizador para el hogar",0,"https://m.media-amazon.com/images/I/71W7vcgfKdL._AC_SL1500_.jpg","Opción funcional para organizar productos de uso frecuente.","Sí",10]
    ];
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    sheet.getRange(2, 3, rows.length, 1).setNumberFormat('"Bs " #,##0.00');
  }
  return "Hoja Productos preparada.";
}

/** La tienda consulta este endpoint para leer los productos publicados. */
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
  }
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  const result = values.filter(row => row.some(cell => cell !== "")).map(row => {
    const item = {};
    headers.forEach((header, index) => {
      let value = row[index];
      if (value instanceof Date) value = value.toISOString();
      item[header] = value;
    });
    return item;
  });
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}