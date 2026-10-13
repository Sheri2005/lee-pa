/** Estado del rol según la BD (CHECK): A = activo, I = inactivo. */
export type EstadoRol = 'A' | 'I';

/** Tabla `rol` (sin fechas de creación/modificación). */
export interface Rol {
  id: number;
  /** Único. Es el nombre que se guarda en los roles del usuario (por ejemplo 'Decano'). */
  nombre: string;
  descripcion: string | null;
  estado: EstadoRol;
}
