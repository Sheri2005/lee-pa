// Modelos de ocupación y disponibilidad de espacios · Dueño: G4 · Reservas
// Los usan app-reserva-form (C4-06), app-ocurrencias-recurrentes (C4-10) y app-calendario-ocupacion (C4-14).
// app-validacion-disponibilidad (C4-07) puede recibir `ResultadoDisponibilidad` sin cambios.
// `AlternativaEspacio` la usa app-espacios-alternativos (C4-08).
// `FiltroDisponibilidad` lo emite app-filtros-disponibilidad (C4-02) y lo recibe DisponibilidadEspacioService.
import { Espacio } from './espacio.model';
import { EstadoReserva } from './reserva.model';

/** Clase del horario (G3) o reserva del módulo (G4). */
export type TipoOcupacion = 'CLASE' | 'RESERVA';

/** Bloque de tiempo en que un espacio está ocupado. */
export interface Ocupacion {
  tipo: TipoOcupacion;
  /** Id de la clase o de la reserva, según `tipo`. */
  id: number;
  espacio_id: number;
  /** YYYY-MM-DD */
  fecha: string;
  /** HH:mm */
  hora_inicio: string;
  /** HH:mm */
  hora_fin: string;
  /** Materia y paralelo de la clase, o motivo de la reserva. */
  titulo: string;
  /** Docente o solicitante, si se conoce. */
  responsable?: string;
  /** Solo reservas. Las rechazadas y canceladas no se envían porque ya no ocupan el espacio. */
  estado?: EstadoReserva;
}

/** Por qué una ocupación impide una fecha solicitada. */
export type MotivoConflicto = 'CRUCE' | 'SEPARACION';

export interface ConflictoOcurrencia {
  ocupacion: Ocupacion;
  /** `CRUCE`: los horarios se solapan. `SEPARACION`: quedan menos minutos libres de los exigidos. */
  motivo: MotivoConflicto;
}

/** `PENDIENTE`: todavía sin comprobar. */
export type EstadoOcurrencia = 'PENDIENTE' | 'DISPONIBLE' | 'CONFLICTO';

/** Una fecha de la solicitud (la única de una reserva puntual o una de la serie) con su resultado. */
export interface Ocurrencia {
  /** YYYY-MM-DD */
  fecha: string;
  /** HH:mm */
  hora_inicio: string;
  /** HH:mm */
  hora_fin: string;
  estado: EstadoOcurrencia;
  /** Vacío salvo en `CONFLICTO`. */
  conflictos: ConflictoOcurrencia[];
}

/** Resultado de comprobar todas las fechas de una solicitud en un espacio. */
export interface ResultadoDisponibilidad {
  espacio_id: number;
  /** `true` solo si todas las ocurrencias están disponibles. */
  disponible: boolean;
  ocurrencias: Ocurrencia[];
}

/**
 * Cercanía del espacio alternativo respecto al solicitado, según su edificio y piso. No se usan metros:
 * el modelo de datos no guarda coordenadas de los edificios.
 */
export type CercaniaEspacio = 'MISMO_PISO' | 'MISMO_EDIFICIO' | 'OTRO_EDIFICIO';

/** Espacio equivalente y libre que se sugiere cuando el solicitado tiene un conflicto. */
export interface AlternativaEspacio {
  espacio: Espacio;
  justificacion: string;
  /** El edificio es prioritario para la facultad de quien reserva (prioridad_espacio, G3). */
  prioridadFacultad: boolean;
  cercania: CercaniaEspacio;
}

/** Criterios de la búsqueda de espacios libres (C4-02 → C4-01 → DisponibilidadEspacioService). */
export interface FiltroDisponibilidad {
  /** YYYY-MM-DD */
  fecha: string;
  /** HH:mm */
  horaInicio: string;
  /** HH:mm */
  horaFin: string;
  /** Valor del catálogo ('AULA', 'LABORATORIO'…) o `null` para todos. */
  tipoEspacio: string | null;
  capacidadMinima: number | null;
  /** Ids de recursos instalados que debe tener el espacio (todos ellos). */
  recursos: number[];
  edificioId: number | null;
}
