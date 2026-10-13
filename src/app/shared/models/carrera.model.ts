/** Jornada según la BD (CHECK). */
export type JornadaCarrera = 'MATUTINA' | 'VESPERTINA' | 'NOCTURNA';

/** Modalidad según la BD (CHECK). */
export type ModalidadCarrera = 'PRESENCIAL' | 'VIRTUAL';

/** Estado según la BD (CHECK): A = activa, I = inactiva. */
export type EstadoCarrera = 'A' | 'I';

/** Tabla `carrera` (sin fechas de creación/modificación). */
export interface Carrera {
  id: number;
  /** Único. */
  codigo: string;
  nombre: string;
  /** FK obligatoria a `facultad`: toda carrera pertenece a una facultad. */
  facultadId: number;
  /** No está en la tabla: nombre de la facultad que la API devolverá ya unido. */
  facultadNombre: string;
  jornada: JornadaCarrera;
  modalidad: ModalidadCarrera;
  /** FK a `usuario` (rol Coordinador). Única: un usuario coordina una sola carrera. */
  coordinadorUsuarioId: number | null;
  /** No está en la tabla: nombre del coordinador que la API devolverá ya unido. */
  coordinadorNombre: string | null;
  /** Único cuando tiene valor. */
  codigoSiac: string | null;
  estado: EstadoCarrera;
}

/** Datos para crear o editar (sin id, que lo asigna la BD). */
export type DatosCarrera = Omit<Carrera, 'id'>;
