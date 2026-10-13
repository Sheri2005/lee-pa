/** Fila tal como la entrega `app-subir-archivo` (G4): encabezado → valor. */
export type FilaCruda = Record<string, unknown>;

export interface ColumnaPlantilla {
  /** Identificador interno de la columna (clave del dato que se envía al backend). */
  clave: string;
  /** Texto del encabezado en la plantilla descargable. */
  etiqueta: string;
  obligatorio?: boolean;
  /** Valor de la fila de ejemplo de la plantilla. Si el usuario deja esa fila, no se importa. */
  ejemplo?: string;
  /** Devuelve un mensaje de error, o `null` si el valor es válido. Solo se llama con valor no vacío. */
  validador?: (valor: string, fila: Record<string, string>) => string | null;
}

/** Definición de una carga masiva: la usan G2 (estudiantes estimados) y G3 (espacios y franjas). */
export interface PlantillaCarga {
  nombre: string;
  /** Nombre del archivo de plantilla, sin extensión. */
  nombreArchivo: string;
  columnas: ColumnaPlantilla[];
  /** Backend: `POST` con las filas válidas. */
  endpoint: string;
  extensiones?: readonly string[];
  tamanoMaxMB?: number;
}

export interface FilaValidada {
  /** Número de fila en el archivo (la 1 es el encabezado). */
  numero: number;
  datos: Record<string, string>;
  errores: string[];
  valida: boolean;
}

export interface ErrorImportacion {
  fila: number;
  mensaje: string;
}

export interface ResumenImportacion {
  total: number;
  importadas: number;
  rechazadas: number;
  errores: ErrorImportacion[];
}
