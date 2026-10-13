/**
 * Parámetros de una planificación (HU G2-03 · C2-05 app-parametros-planificacion).
 * Se guardan por planificación; con backend serán una llamada HTTP.
 */
export interface ParametrosPlanificacion {
  /** Niveles de la malla vigente que se van a ofertar en el período. */
  nivelesOfertados: number[];
  /** Cupo máximo por paralelo. */
  cupoMaximoParalelo: number;
  /** Mínimo de estudiantes estimados para abrir un paralelo. */
  minimoEstudiantesAbrir: number;
}

export interface MateriaNivel {
  codigo: string;
  nombre: string;
  horasSemanales: number;
}

/**
 * Vista mínima de un nivel de la malla. Proyección temporal: integrar con el modelo
 * de G1 (`app-malla-por-niveles`) cuando lo publiquen.
 */
export interface NivelMalla {
  nivel: number;
  materias: MateriaNivel[];
}
