import { CriterioRegla } from '../../shared/components/app-justificacion-regla/criterio-regla.model';
import { MateriaResumen } from './paralelo.model';

/**
 * Modelo de Curso planificado (Módulo 2 · Planificación · Grupo 2).
 *
 * Tabla `curso_planificado` del diccionario de datos (HU G2-05, G2-06, G2-07):
 * una materia que la planificación decide aperturar, con el origen de la decisión
 * (sugerida por reglas o agregada a mano) y su justificación.
 *
 * `nivel`, `horasSemanales`, `estudiantesEstimados`, `demandaHistorica`, `paralelosSugeridos`
 * y `cupoMaximo` son datos "de vista": la API los devuelve ya calculados (desde la malla, la
 * demanda estimada y los parámetros de la planificación) para no tener que volver a consultar.
 */

/** Cómo entró el curso a la planificación (curso_planificado.origen). */
export type OrigenCurso = 'SUGERIDO' | 'MANUAL';

/** Decisión del coordinador sobre el curso (curso_planificado.estado). */
export type EstadoCurso = 'SUGERIDO' | 'ACEPTADO' | 'ANULADO';

export interface CursoPlanificado {
  id: number;
  planificacionId: number;
  materia: MateriaResumen;
  /** Fila de la malla vigente de la que sale el curso; null si la materia no está en la malla. */
  mallaMateriaId: number | null;
  /** Nivel de la malla vigente; null si la materia no está en la malla. */
  nivel: number | null;
  origen: OrigenCurso;
  /** true si la materia es compartida y otra carrera es la responsable (no se apertura aquí). */
  esCompartida: boolean;
  estado: EstadoCurso;
  /** Criterios con los que las reglas justifican la sugerencia (los pinta C2-10). */
  justificacion: CriterioRegla[];
  /** Horas semanales tomadas de la malla: no se editan en el paralelo (HU G2-07). */
  horasSemanales: number;
  estudiantesEstimados: number;
  /** Demanda de períodos anteriores; null en el primer período (prioridad baja del MVP). */
  demandaHistorica: number | null;
  /** Paralelos que proponen las reglas: estudiantes estimados ÷ cupo máximo, hacia arriba. */
  paralelosSugeridos: number;
  /** Parámetro de la planificación: cupo máximo por paralelo (prellena los paralelos nuevos). */
  cupoMaximo: number;
  /** Motivo, cuando el curso se agregó a mano (HU G2-06). */
  motivoManual?: string;
}
