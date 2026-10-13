import { DocenteResumen, Paralelo } from './paralelo.model';

/** Proyección mínima para C2-14; integrar con el modelo de G1 cuando esté disponible. */
export interface Docente extends DocenteResumen {
  cargaMaxima: number;
}

export interface CandidatoDocente {
  docente: Docente;
  /** Horas del mismo período, excluyendo el paralelo consultado. */
  cargaSinParalelo: number;
  /** cargaSinParalelo + horasSemanales del paralelo. */
  cargaProyectada: number;
}

export interface SugerenciaDocente {
  paralelo: Paralelo;
  candidatos: CandidatoDocente[];
}
