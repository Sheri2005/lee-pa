import { Materia } from './materia.model';

/**
 * Materias compartidas desde la carrera dependiente (Módulo 2 · Grupo 2 · HU G2-08).
 *
 * Una materia compartida está en la malla de varias carreras, pero solo su
 * `carrera_responsable_id` puede aperturarla. Las demás no vuelven a planificarla: registran
 * una solicitud de cupos en los paralelos que abra la responsable (tabla `solicitud_cupo`).
 */

/** En qué va la planificación de la carrera responsable para esa materia. */
export type EstadoResponsable = 'NO_PLANIFICADA' | 'EN_BORRADOR' | 'PLANIFICADA';

/** Estado de una solicitud de cupos (solicitud_cupo.estado). */
export type EstadoSolicitudCupo = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

/** Paralelo ya abierto por la carrera responsable, donde se pueden pedir cupos. */
export interface ParaleloAbierto {
  id: number;
  codigo: string;
  cupo: number;
  /** Cupos libres después de los ya aceptados a otras carreras. */
  cuposDisponibles: number;
  /** Nombre del docente asignado; null si todavía no tiene. */
  docente: string | null;
}

export interface SolicitudCupo {
  id: number;
  paraleloId: number;
  /** Planificación de la carrera dependiente que pide los cupos. */
  planificacionId: number;
  cupos: number;
  estado: EstadoSolicitudCupo;
}

export interface MateriaCompartida {
  materia: Materia;
  /** Nivel en la malla vigente de la carrera dependiente. */
  nivel: number | null;
  estudiantesEstimados: number;
  estadoResponsable: EstadoResponsable;
  /** Vacío mientras la responsable no haya abierto paralelos. */
  paralelosAbiertos: ParaleloAbierto[];
  /** Solicitudes que esta planificación ya registró. */
  solicitudes: SolicitudCupo[];
  /** Carreras que la tienen en su malla (para el tooltip de C2-20). */
  carrerasQueLaUsan: string[];
}

export interface ListadoMateriasCompartidas {
  /** Carrera dependiente dueña de la planificación. */
  carreraId: number;
  carreraNombre: string;
  materias: MateriaCompartida[];
}
