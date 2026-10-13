import { Materia } from './materia.model';
import { Planificacion } from './planificacion.model';

/** Límite propuesto para el motivo; confirmar con el contrato del backend. */
export const MAX_MOTIVO_CURSO_MANUAL = 500;

export interface SolicitudCursoManual {
  materiaId: number;
  numeroParalelos: number;
  motivo: string;
}

/** Registro de G2. No crea una materia ni genera todavía los paralelos de C2-11. */
export interface CursoManual extends SolicitudCursoManual {
  id: number;
  planificacionId: number;
  materia: Materia;
  origen: 'MANUAL';
}

export interface ContextoCursoManual {
  planificacion: Planificacion;
  cursosManuales: CursoManual[];
}
