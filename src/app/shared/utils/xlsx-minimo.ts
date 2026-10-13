/**
 * Generador mínimo de `.xlsx` sin dependencias (una hoja, solo texto). Alcanza para plantillas
 * de carga; para formatos, fórmulas o lectura de archivos usar una librería (p. ej. `xlsx`).
 */

const codificador = new TextEncoder();

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(datos: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of datos) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function escaparXml(texto: string): string {
  return (
    texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      // Caracteres de control no permitidos en XML 1.0.
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  );
}

/** 0 → A, 25 → Z, 26 → AA. */
function letraColumna(indice: number): string {
  let letra = '';
  for (let n = indice + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letra = String.fromCharCode(65 + ((n - 1) % 26)) + letra;
  }
  return letra;
}

function hoja(filas: string[][]): string {
  const xmlFilas = filas
    .map((fila, i) => {
      const celdas = fila
        .map(
          (valor, j) =>
            `<c r="${letraColumna(j)}${i + 1}" t="inlineStr"><is><t xml:space="preserve">${escaparXml(valor)}</t></is></c>`,
        )
        .join('');
      return `<row r="${i + 1}">${celdas}</row>`;
    })
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${xmlFilas}</sheetData></worksheet>`
  );
}

/** Zip "stored" (sin compresión): suficiente para archivos diminutos. */
function empaquetar(archivos: { nombre: string; contenido: string }[]): Uint8Array {
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let desplazamiento = 0;

  for (const { nombre, contenido } of archivos) {
    const nombreBytes = codificador.encode(nombre);
    const datos = codificador.encode(contenido);
    const crc = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // versión mínima
    local.setUint16(6, 0x0800, true); // nombres en UTF-8
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombreBytes.length, true);

    const entrada = new DataView(new ArrayBuffer(46));
    entrada.setUint32(0, 0x02014b50, true);
    entrada.setUint16(4, 20, true);
    entrada.setUint16(6, 20, true);
    entrada.setUint16(8, 0x0800, true);
    entrada.setUint32(16, crc, true);
    entrada.setUint32(20, datos.length, true);
    entrada.setUint32(24, datos.length, true);
    entrada.setUint16(28, nombreBytes.length, true);
    entrada.setUint32(42, desplazamiento, true);

    partes.push(new Uint8Array(local.buffer), nombreBytes, datos);
    central.push(new Uint8Array(entrada.buffer), nombreBytes);
    desplazamiento += 30 + nombreBytes.length + datos.length;
  }

  const tamanoCentral = central.reduce((suma, p) => suma + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamanoCentral, true);
  fin.setUint32(16, desplazamiento, true);

  const todo = [...partes, ...central, new Uint8Array(fin.buffer)];
  const resultado = new Uint8Array(todo.reduce((suma, p) => suma + p.length, 0));
  let posicion = 0;
  for (const p of todo) {
    resultado.set(p, posicion);
    posicion += p.length;
  }
  return resultado;
}

/** Crea un libro `.xlsx` con una hoja cuyas celdas son todas texto. */
export function crearXlsx(filas: string[][], nombreHoja = 'Plantilla'): Uint8Array {
  const ns = 'http://schemas.openxmlformats.org';
  const cabecera = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return empaquetar([
    {
      nombre: '[Content_Types].xml',
      contenido:
        `${cabecera}<Types xmlns="${ns}/package/2006/content-types">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>',
    },
    {
      nombre: '_rels/.rels',
      contenido:
        `${cabecera}<Relationships xmlns="${ns}/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        '</Relationships>',
    },
    {
      nombre: 'xl/workbook.xml',
      contenido:
        `${cabecera}<workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${ns}/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${escaparXml(nombreHoja)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      nombre: 'xl/_rels/workbook.xml.rels',
      contenido:
        `${cabecera}<Relationships xmlns="${ns}/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        '</Relationships>',
    },
    { nombre: 'xl/worksheets/sheet1.xml', contenido: hoja(filas) },
  ]);
}
