/** Estado de la facultad según la BD (CHECK): A = activa, I = inactiva. */
export type EstadoFacultad = 'A' | 'I';

/** Tabla `facultad`. Las fechas de creación/modificación no se usan en el front. */
export interface Facultad {
  id: number;
  codigo: string;
  nombre: string;
  /** FK a `usuario` (rol Decano). Única: un usuario es decano de una sola facultad. */
  decanoUsuarioId: number | null;
  /** No está en la tabla: es el nombre del decano que la API devolverá ya unido. */
  decanoNombre: string | null;
  codigoSiac: string | null;
  estado: EstadoFacultad;
}

/** Datos para crear o editar (sin id, que lo asigna la BD). */
export type DatosFacultad = Omit<Facultad, 'id'>;
