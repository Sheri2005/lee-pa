/** Tabla `permiso` (sin fechas de creación/modificación). */
export interface Permiso {
  id: number;
  /** Único. Es el código que revisan el menú y los guards (por ejemplo 'facultad.ver'). */
  codigo: string;
  nombre: string;
  descripcion: string | null;
}
