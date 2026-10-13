import { Materia } from './materia.model';

/**
 * Por qué una materia entra en la planificación (HU G2-02):
 * - PROPIA_EN_MALLA: está en la malla vigente y la carrera es la responsable.
 * - PROPIA_FUERA_DE_MALLA: la carrera es la responsable aunque no esté en su malla.
 * - COMPARTIDA: está en la malla pero la responsable es otra carrera (solo se piden cupos).
 */
export type OrigenMateria = 'PROPIA_EN_MALLA' | 'PROPIA_FUERA_DE_MALLA' | 'COMPARTIDA';

export interface MateriaAPlanificar {
  materia: Materia;
  origen: OrigenMateria;
  /** Nivel en la malla vigente; null si la materia no está en la malla. */
  nivel: number | null;
  /** Horas semanales tomadas de la malla; null si la materia no está en la malla. */
  horasSemanales: number | null;
  /** Carreras que la tienen en su malla (para el tooltip de las compartidas). */
  carrerasQueLaUsan: string[];
}

export interface ListadoMateriasAPlanificar {
  /** Carrera dueña de la planificación (para saber qué materias son propias). */
  carreraId: number;
  materias: MateriaAPlanificar[];
}
