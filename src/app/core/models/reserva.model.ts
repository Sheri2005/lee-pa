// Modelos del módulo de reservas · Dueño: G4 · Reservas
// Siguen las tablas reserva, reserva_serie, recurso_reservable y reserva_recurso del modelo de datos
// (Anexo A de la planificación). Los usan C4-09, C4-13, C4-17 y C4-18.

export type EstadoReserva = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';

export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO';

export interface Reserva {
  id: number;
  solicitante_id: number;
  espacio_id: number;
  /** YYYY-MM-DD */
  fecha: string;
  /** HH:mm */
  hora_inicio: string;
  /** HH:mm */
  hora_fin: string;
  asistentes: number;
  motivo: string;
  estado: EstadoReserva;
  serie_id: number | null;
}

export interface ReservaSerie {
  id: number;
  frecuencia: 'SEMANAL';
  dias_semana: DiaSemana[];
  /** YYYY-MM-DD */
  fecha_desde: string;
  /** YYYY-MM-DD */
  fecha_hasta: string;
}

/**
 * Lo que envía app-reserva-form (C4-06) para pedir la aprobación de una reserva puntual o de una serie.
 * El solicitante lo toma el backend de la sesión; el backend vuelve a validar cada fecha antes de guardar.
 */
export interface NuevaSolicitudReserva {
  espacio_id: number;
  /** HH:mm, igual para todas las fechas. */
  hora_inicio: string;
  hora_fin: string;
  asistentes: number;
  motivo: string;
  /** `null` si la reserva es puntual. */
  serie: Omit<ReservaSerie, 'id'> | null;
  /** YYYY-MM-DD: la fecha de la reserva puntual o todas las que genera la serie, en orden. */
  fechas: string[];
  recursos: RecursoSolicitado[];
}

/** Respuesta al registrar una solicitud: las reservas creadas quedan pendientes de aprobación (G5). */
export interface SolicitudRegistrada {
  reserva_ids: number[];
  serie_id: number | null;
  estado: 'PENDIENTE';
}

/** Datos de una reserva ya resueltos para mostrarla (espacio, solicitante, sesiones y recursos). */
export interface ResumenReserva {
  id: number;
  estado: EstadoReserva;
  motivo: string;
  asistentes: number;
  solicitante: { id: number; nombres: string };
  // TEMPORAL: datos mínimos del espacio hasta que G3 publique su modelo Espacio.
  espacio: {
    id: number;
    codigo: string;
    nombre: string;
    edificio: string;
    piso: number;
    tipo_espacio: string;
    capacidad: number;
  };
  /** Una sesión si la reserva es puntual; todas las ocurrencias si pertenece a una serie. */
  sesiones: SesionReserva[];
  serie: ReservaSerie | null;
  recursos: { nombre: string; cantidad: number }[];
}

export interface SesionReserva {
  reserva_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoReserva;
}

/** Equipo que se presta junto con un espacio: proyector móvil, laptop, parlante… */
export interface RecursoReservable {
  id: number;
  nombre: string;
  /** Unidades que tiene la universidad. */
  cantidad: number;
  estado: boolean;
}

export interface ReservaRecurso {
  id: number;
  reserva_id: number;
  recurso_reservable_id: number;
  cantidad: number;
}

/** Recurso y cantidad que se piden en una solicitud de reserva. */
export interface RecursoSolicitado {
  recurso_reservable_id: number;
  cantidad: number;
}

/** Unidades libres de un recurso en una fecha y franja. */
export interface DisponibilidadRecurso {
  recurso: RecursoReservable;
  disponibles: number;
}

/** Datos mínimos con los que se buscan alternativas para una solicitud con conflicto. */
export interface SolicitudReserva {
  espacio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  asistentes: number;
  tipo_espacio: string;
  recursos_requeridos: number[];
  facultad_id?: number;
}
