// C4-22 · Dueño: G4 · Reservas
// Zona reutilizable para seleccionar o arrastrar archivos de Excel o CSV y convertirlos en filas.
// Si se indican las columnas obligatorias, explica cómo debe estar el archivo, ofrece una plantilla y las valida.
import { Component, computed, input, output, signal } from '@angular/core';
import * as XLSX from 'xlsx';

export type FilaArchivo = Record<string, unknown>;

let siguienteId = 0;

export function extensionDe(nombre: string): string {
  const punto = nombre.lastIndexOf('.');
  return punto < 0 ? '' : nombre.slice(punto).toLowerCase();
}

const NOMBRES_FORMATO: Record<string, string> = {
  '.xlsx': 'Excel',
  '.xls': 'Excel',
  '.csv': 'CSV',
};

/** `['.xlsx', '.xls', '.csv']` → `Excel o CSV`: nombres que entiende cualquiera, Excel primero. */
export function describirFormatos(extensiones: readonly string[]): string {
  const nombres = [
    ...new Set(
      extensiones
        .map((e) => (e.startsWith('.') ? e : `.${e}`).toLowerCase())
        .sort((a, b) => Number(b.startsWith('.xls')) - Number(a.startsWith('.xls')))
        .map((e) => NOMBRES_FORMATO[e] ?? e.slice(1).toUpperCase()),
    ),
  ];
  return nombres.length > 1
    ? `${nombres.slice(0, -1).join(', ')} o ${nombres.at(-1)}`
    : (nombres[0] ?? '');
}

export function validarArchivo(
  archivo: Pick<File, 'name' | 'size'>,
  extensiones: readonly string[],
  tamanoMaxMB: number,
): string | null {
  const permitidas = extensiones.map((extension) =>
    extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`,
  );

  if (!permitidas.includes(extensionDe(archivo.name))) {
    return `Ese tipo de archivo no se admite. Usa ${describirFormatos(permitidas)}.`;
  }
  if (archivo.size === 0) return 'El archivo está vacío.';
  if (archivo.size > tamanoMaxMB * 1024 * 1024) {
    return `El archivo supera el máximo de ${tamanoMaxMB} MB.`;
  }
  return null;
}

/** Compara encabezados sin importar mayúsculas, tildes, espacios ni guiones: `" Año_Inicio"` = `"ano inicio"`. */
export function normalizarColumna(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Convierte las filas de la hoja (la primera son los encabezados) en objetos. Si hay columnas obligatorias,
 * comprueba que estén y usa su nombre exacto como clave; las columnas extra se conservan tal cual.
 * Lanza un error con un mensaje para el usuario si el archivo no tiene la forma esperada.
 */
export function filasConEncabezados(
  tabla: readonly (readonly unknown[])[],
  columnas: readonly string[] = [],
): FilaArchivo[] {
  const [primera = [], ...resto] = tabla;
  const encabezados = primera.map((celda) => String(celda ?? '').trim());
  if (!encabezados.length || encabezados.some((e) => !e)) {
    throw new Error(
      'El archivo debe tener en la primera fila el nombre de cada columna, sin celdas vacías.',
    );
  }
  const porNombre = new Map(columnas.map((c) => [normalizarColumna(c), c]));
  const claves = encabezados.map((e) => porNombre.get(normalizarColumna(e)) ?? e);
  const faltan = columnas.filter((c) => !claves.includes(c));
  if (faltan.length) {
    throw new Error(
      `El archivo no tiene ${faltan.length === 1 ? 'la columna' : 'las columnas'} ${faltan.join(', ')}. ` +
        `La primera fila debe tener: ${columnas.join(', ')}.`,
    );
  }
  const filas = resto
    .filter((fila) => fila.some((celda) => String(celda ?? '').trim()))
    .map((fila) =>
      Object.fromEntries(claves.map((clave, i) => [clave, String(fila[i] ?? '').trim()])),
    );
  if (!filas.length) throw new Error('El archivo no contiene filas de datos.');
  return filas;
}

/** Libro de la plantilla: hoja «Datos» con los encabezados y, debajo, las filas de ejemplo. */
export function libroPlantilla(
  columnas: readonly string[],
  ejemplos: readonly Readonly<Record<string, string | number>>[] = [],
): XLSX.WorkBook {
  const filas = ejemplos.map((ejemplo) => columnas.map((c) => ejemplo[c] ?? ''));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet([[...columnas], ...filas]), 'Datos');
  return libro;
}

/**
 * Texto de un CSV: UTF-8 (con o sin BOM, el "CSV UTF-8" de Excel o Google Sheets) o, si no lo es,
 * Windows-1252 (el "CSV delimitado por comas" que guarda Excel en Windows). Así se conservan tildes y eñes.
 */
export function decodificarCsv(contenido: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(contenido);
  } catch {
    return new TextDecoder('windows-1252').decode(contenido);
  }
}

@Component({
  selector: 'app-subir-archivo',
  templateUrl: './subir-archivo.html',
})
export class SubirArchivoComponent {
  /** Extensiones permitidas. Se normalizan con punto y en minúsculas. Se muestran como "Excel o CSV". */
  readonly extensiones = input<readonly string[]>(['.xlsx', '.xls', '.csv']);
  /**
   * Opcional (añadida al contrato del Excel): columnas obligatorias de la primera fila, por ejemplo
   * `['nombre', 'cantidad', 'estado']`. Se muestran al usuario, se validan y dan nombre a las claves de cada fila.
   */
  readonly columnas = input<readonly string[]>([]);
  /** Opcional: nombre del archivo de plantilla que se descarga (sin extensión). */
  readonly nombrePlantilla = input('plantilla');
  /**
   * Opcional: filas de ejemplo que lleva la plantilla debajo de los encabezados, para que se vea cómo llenarla.
   * Las define quien usa el componente (cada carga masiva tiene sus datos).
   */
  readonly ejemplos = input<readonly Readonly<Record<string, string | number>>[]>([]);
  /** Tamaño máximo permitido expresado en megabytes. */
  readonly tamanoMaxMB = input(5);

  /** Filas de la primera hoja, usando la primera fila como encabezados. */
  readonly filasLeidas = output<FilaArchivo[]>();
  /** Mensaje emitido cuando la validación o lectura falla. */
  readonly error = output<string>();

  protected readonly id = `subir-archivo-${siguienteId++}`;
  protected readonly arrastrando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly nombreArchivo = signal('');
  protected readonly mensajeError = signal('');
  /** Filas del último archivo leído correctamente. */
  protected readonly filas = signal(0);
  protected readonly formatos = computed(() => describirFormatos(this.extensiones()));
  protected readonly accept = computed(() =>
    this.extensiones()
      .map((extension) => (extension.startsWith('.') ? extension : `.${extension}`))
      .join(','),
  );

  protected seleccionar(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.item(0);
    if (archivo) void this.procesarArchivo(archivo);
    entrada.value = '';
  }

  protected permitirArrastre(evento: DragEvent): void {
    evento.preventDefault();
    if (!this.procesando()) this.arrastrando.set(true);
  }

  protected salirArrastre(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
  }

  protected soltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    if (this.procesando()) return;

    const archivos = evento.dataTransfer?.files;
    if (!archivos?.length) return;
    if (archivos.length > 1) {
      this.informarError('Selecciona un solo archivo a la vez.');
      return;
    }
    void this.procesarArchivo(archivos[0]);
  }

  async procesarArchivo(archivo: File): Promise<void> {
    const validacion = validarArchivo(archivo, this.extensiones(), this.tamanoMaxMB());
    if (validacion) {
      this.nombreArchivo.set('');
      this.informarError(validacion);
      return;
    }

    this.procesando.set(true);
    this.mensajeError.set('');
    this.nombreArchivo.set(archivo.name);

    try {
      const contenido = await archivo.arrayBuffer();
      // El CSV se decodifica antes: leído como bytes, SheetJS lo toma como Windows-1252 y rompe las tildes.
      const libro =
        extensionDe(archivo.name) === '.csv'
          ? XLSX.read(decodificarCsv(contenido), { type: 'string', cellDates: true })
          : XLSX.read(contenido, { type: 'array', cellDates: true });
      const primeraHoja = libro.SheetNames[0];
      if (!primeraHoja) throw new Error('El archivo no contiene hojas.');

      const tabla = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[primeraHoja], {
        header: 1,
        defval: '',
        raw: false,
        blankrows: false,
      });
      if (tabla.length < 2) throw new Error('El archivo no contiene filas de datos.');
      const filas = filasConEncabezados(tabla, this.columnas());

      this.filas.set(filas.length);
      this.filasLeidas.emit(filas);
    } catch (causa) {
      const mensaje =
        causa instanceof Error && causa.message.startsWith('El archivo')
          ? causa.message
          : 'No se pudo leer el archivo. Comprueba que no esté dañado.';
      this.informarError(mensaje);
    } finally {
      this.procesando.set(false);
    }
  }

  /** Descarga un Excel con las columnas obligatorias en la primera fila, listo para llenar. */
  protected descargarPlantilla(): void {
    XLSX.writeFile(
      libroPlantilla(this.columnas(), this.ejemplos()),
      `${this.nombrePlantilla()}.xlsx`,
    );
  }

  private informarError(mensaje: string): void {
    this.mensajeError.set(mensaje);
    this.error.emit(mensaje);
  }
}
