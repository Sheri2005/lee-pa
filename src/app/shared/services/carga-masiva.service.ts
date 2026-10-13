import { Injectable } from '@angular/core';
import { delay, Observable, of, tap } from 'rxjs';
import {
  FilaCruda,
  FilaValidada,
  PlantillaCarga,
  ResumenImportacion,
} from '../models/carga-masiva.model';
import { RegistroImportacion } from '../models/bitacora-importacion.model';
import { BITACORA_MOCK } from '../mocks/bitacora.mock';
import { crearXlsx } from '../utils/xlsx-minimo';

/** Minúsculas, sin tildes ni espacios sobrantes: "  Código " → "codigo". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function escaparCsv(valor: string): string {
  return /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

/**
 * Lógica de la carga masiva (C1-50). `generarCsvPlantilla`, `columnasFaltantes` y `validar` son
 * puras; `importar` hoy es un mock en memoria.
 */
@Injectable({ providedIn: 'root' })
export class CargaMasivaService {
  /** TEMPORAL: bitácora en memoria (C1-56). Empieza con los datos ficticios y crece con cada importación. */
  private bitacora: RegistroImportacion[] = BITACORA_MOCK.map((r) => copiarRegistro(r));

  /** Filas de la plantilla: encabezados y, si alguna columna define `ejemplo`, una fila de ejemplo. */
  filasPlantilla(config: PlantillaCarga): string[][] {
    const filas = [config.columnas.map((c) => c.etiqueta)];
    if (config.columnas.some((c) => c.ejemplo)) {
      filas.push(config.columnas.map((c) => c.ejemplo ?? ''));
    }
    return filas;
  }

  /** CSV de la plantilla (con BOM para que Excel respete las tildes). */
  generarCsvPlantilla(config: PlantillaCarga): string {
    const cuerpo = this.filasPlantilla(config)
      .map((fila) => fila.map(escaparCsv).join(','))
      .join('\r\n');
    return '\uFEFF' + cuerpo + '\r\n';
  }

  /** Excel (.xlsx) de la plantilla, con los mismos datos que el CSV. */
  generarXlsxPlantilla(config: PlantillaCarga): Uint8Array {
    return crearXlsx(this.filasPlantilla(config));
  }

  /** Columnas obligatorias que no aparecen en los encabezados del archivo. */
  columnasFaltantes(config: PlantillaCarga, filas: FilaCruda[]): string[] {
    const encabezados = this.encabezados(filas);
    return config.columnas
      .filter((c) => c.obligatorio && !this.buscar(encabezados, c))
      .map((c) => c.etiqueta);
  }

  /** Valida fila por fila. Se ignoran las filas totalmente vacías y la fila de ejemplo sin tocar. */
  validar(config: PlantillaCarga, filas: FilaCruda[]): FilaValidada[] {
    const encabezados = this.encabezados(filas);
    const resultado: FilaValidada[] = [];

    filas.forEach((fila, i) => {
      const datos: Record<string, string> = {};
      for (const c of config.columnas) {
        const original = this.buscar(encabezados, c);
        datos[c.clave] = original === undefined ? '' : String(fila[original] ?? '').trim();
      }
      if (Object.values(datos).every((v) => v === '')) return;
      if (this.esFilaEjemplo(config, datos)) return;

      const errores: string[] = [];
      for (const c of config.columnas) {
        const valor = datos[c.clave];
        if (valor === '') {
          if (c.obligatorio) errores.push(`${c.etiqueta} es obligatorio.`);
        } else {
          const mensaje = c.validador?.(valor, datos);
          if (mensaje) errores.push(mensaje);
        }
      }
      resultado.push({ numero: i + 2, datos, errores, valida: errores.length === 0 });
    });

    return resultado;
  }

  /**
   * Importa SOLO las filas válidas; las inválidas nunca se envían ni se guardan.
   * Backend: `POST config.endpoint` con `validas.map((f) => f.datos)`.
   */
  importar(config: PlantillaCarga, filas: FilaValidada[]): Observable<ResumenImportacion> {
    const validas = filas.filter((f) => f.valida);
    const resumen: ResumenImportacion = {
      total: filas.length,
      importadas: validas.length,
      rechazadas: filas.length - validas.length,
      errores: filas
        .filter((f) => !f.valida)
        .map((f) => ({ fila: f.numero, mensaje: f.errores.join(' ') })),
    };
    // Último paso del proceso del documento: "confirmar → registrar en bitácora".
    return of(resumen).pipe(
      delay(400),
      tap(() => this.registrarEnBitacora(config, filas, resumen)),
    );
  }

  /**
   * Bitácora de importaciones (C1-56, Jose): tabla `importacion_log` con su detalle de
   * `importacion_error`, de la más reciente a la más antigua.
   * TEMPORAL: datos ficticios. Backend: `GET /api/importaciones`.
   */
  listarBitacora(): Observable<RegistroImportacion[]> {
    const copia = this.bitacora.map((r) => copiarRegistro(r));
    return of(copia.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)));
  }

  /**
   * TEMPORAL: con backend lo hace el servidor al importar (tabla `importacion_log`).
   * - archivo: `app-subir-archivo` (C4-22, G4) todavía no entrega el nombre del archivo.
   * - usuario: todavía no existe el servicio de sesión (login, C1-05).
   */
  private registrarEnBitacora(
    config: PlantillaCarga,
    filas: FilaValidada[],
    resumen: ResumenImportacion,
  ): void {
    const id = Math.max(0, ...this.bitacora.map((r) => r.id)) + 1;
    this.bitacora.push({
      id,
      entidad: config.nombre,
      archivo: '(nombre no disponible)',
      usuarioId: null,
      usuarioNombre: 'Usuario de prueba',
      fecha: ahoraEnEcuador(),
      totalFilas: resumen.total,
      filasOk: resumen.importadas,
      filasError: resumen.rechazadas,
      errores: filas
        .filter((f) => !f.valida)
        .flatMap((f) => f.errores.map((mensaje) => ({ fila: f.numero, columna: null, mensaje }))),
    });
  }

  /** La fila de ejemplo de la plantilla, si el usuario no la borró, no se importa. */
  private esFilaEjemplo(config: PlantillaCarga, datos: Record<string, string>): boolean {
    return (
      config.columnas.some((c) => c.ejemplo) &&
      config.columnas.every((c) => datos[c.clave] === (c.ejemplo ?? '').trim())
    );
  }

  private encabezados(filas: FilaCruda[]): Map<string, string> {
    return new Map(Object.keys(filas[0] ?? {}).map((k) => [normalizar(k), k]));
  }

  /** Encabezado original del archivo que corresponde a la columna (por etiqueta o clave). */
  private buscar(
    encabezados: Map<string, string>,
    columna: { clave: string; etiqueta: string },
  ): string | undefined {
    return (
      encabezados.get(normalizar(columna.etiqueta)) ?? encabezados.get(normalizar(columna.clave))
    );
  }
}

function copiarRegistro(r: RegistroImportacion): RegistroImportacion {
  return { ...r, errores: r.errores.map((e) => ({ ...e })) };
}

/** Fecha y hora actuales en ISO con la zona de Ecuador (-05:00, sin horario de verano). */
function ahoraEnEcuador(): string {
  return new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 19) + '-05:00';
}
