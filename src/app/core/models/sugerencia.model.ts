import { CursoPlanificado } from './curso-planificado.model';
import { EstadoPlanificacion } from './planificacion.model';

/**
 * Sugerencia de cursos y paralelos (Módulo 2 · Grupo 2 · HU G2-05 y G2-06).
 *
 * Las reglas proponen qué cursos aperturar y cuántos paralelos, con su justificación visible.
 * El coordinador puede aceptar, anular, cambiar el número de paralelos o agregar un curso a
 * mano, y cada curso queda marcado como SUGERIDO o MANUAL (tabla `curso_planificado.origen`).
 */

/** Parámetros de la planificación que controlan el cálculo (tabla `planificacion`). */
export interface ParametrosPlanificacion {
  cupoMaximo: number;
  minimoApertura: number;
  /** Niveles de la malla que se ofertan en el período (tabla `planificacion_nivel`). */
  nivelesOfertados: number[];
}

/** Un curso de la sugerencia con el número de paralelos que decidió el coordinador. */
export interface CursoSugerido {
  curso: CursoPlanificado;
  /**
   * Paralelos con los que se va a aperturar. Arranca igual a `curso.paralelosSugeridos` y el
   * coordinador lo puede cambiar (HU G2-06). Los paralelos en sí se definen en C2-11.
   */
  paralelosDecididos: number;
}

/** Por qué una materia no entró a la sugerencia. */
export type MotivoExclusion = 'NIVEL_NO_OFERTADO' | 'COMPARTIDA';

export interface MateriaExcluida {
  codigo: string;
  nombre: string;
  nivel: number | null;
  motivo: MotivoExclusion;
  /** Carrera responsable, cuando el motivo es que la materia es compartida. */
  carreraResponsable?: string;
}

export interface SugerenciaCursos {
  planificacionId: number;
  /** Solo se puede cambiar la sugerencia si la planificación está en BORRADOR (HU G2-06). */
  estado: EstadoPlanificacion;
  parametros: ParametrosPlanificacion;
  cursos: CursoSugerido[];
  /** Materias que las reglas dejaron fuera, para que el coordinador sepa por qué. */
  excluidas: MateriaExcluida[];
}
