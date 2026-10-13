/** Origen del usuario según la BD (CHECK): propio del sistema o vinculado al SIAC 1.0. */
export type OrigenUsuario = 'LOCAL' | 'SIAC';

/** Estado del usuario según la BD (CHECK): A = activo, I = inactivo. */
export type EstadoUsuario = 'A' | 'I';

/**
 * Tabla `usuario`, sin `password_hash` (nunca llega al front) ni las fechas de
 * creación/modificación.
 */
export interface Usuario {
  id: number;
  /** Único. */
  username: string;
  /** Único. */
  email: string;
  nombres: string;
  origen: OrigenUsuario;
  /** Único cuando tiene valor. */
  codigoSiac: string | null;
  estado: EstadoUsuario;
  /** No está en la tabla: nombres de sus roles (tabla `usuario_rol`), que la API devolverá unidos. */
  roles: string[];
}

/** Datos para crear o editar (sin id, que lo asigna la BD). */
export type DatosUsuario = Omit<Usuario, 'id'>;
