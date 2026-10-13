import { CandidatoDocente, Docente } from './asignacion-docente.model';
import { Paralelo } from './paralelo.model';

export interface FilaAsignacion {
  paralelo: Paralelo;
  cargaActual: number | null;
  cargaMaxima: number | null;
  /** Habilitados y disponibles; puede incluir sobrecarga para mostrar la alerta al elegir. */
  opcionesManuales: CandidatoDocente[];
}

export interface PanelAsignacion {
  planificacionId: number;
  editable: boolean;
  filas: FilaAsignacion[];
}

/** Contrato propuesto para asignacionChange; el Excel no define su payload. */
export interface CambioAsignacion {
  planificacionId: number;
  paraleloId: number;
  docente: Docente;
  estado: 'CONFIRMADO';
}
