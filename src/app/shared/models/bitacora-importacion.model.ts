/** Tabla `importacion_error`: una fila del archivo que no se importó. */
export interface ErrorRegistrado {
  fila: number;
  /** Columna con el problema; `null` si el error es de la fila completa. */
  columna: string | null;
  mensaje: string;
}

/**
 * Tabla `importacion_log`: una importación hecha con la carga masiva.
 * Regla de la BD: totalFilas = filasOk + filasError.
 */
export interface RegistroImportacion {
  id: number;
  /** Qué se importó (Usuarios, Docentes, Períodos…). */
  entidad: string;
  archivo: string;
  /** FK a `usuario`; `null` si el usuario fue eliminado (SET NULL). */
  usuarioId: number | null;
  /** No está en la tabla: nombre del usuario que la API devolverá ya unido. */
  usuarioNombre: string | null;
  /** Fecha y hora ISO (timestamptz). */
  fecha: string;
  totalFilas: number;
  filasOk: number;
  filasError: number;
  /** Detalle de `importacion_error`. */
  errores: ErrorRegistrado[];
}
