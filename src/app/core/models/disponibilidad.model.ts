import { FranjaHoraria, TipoPeriodo } from './franja.model';

/**
 * Disponibilidad docente por período (Módulo 2 · Grupo 2 · HU G2-09).
 *
 * Tabla `disponibilidad_docente` (docente_id, periodo_id, franja_id): una fila por franja en la
 * que el docente está disponible. La asignación de docentes (C2-13, C2-14) solo puede sugerir
 * docentes con disponibilidad registrada en el período.
 */

export interface PeriodoResumen {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoPeriodo;
}

/**
 * Docente en el contexto de la disponibilidad: incluye su carga máxima para poder comparar
 * las horas marcadas. (`DocenteResumen` de `paralelo.model.ts` no la trae.)
 */
export interface DocenteParaDisponibilidad {
  id: number;
  nombres: string;
  cargaMaximaHoras: number;
}

/** Todo lo que la pantalla necesita para pintar la matriz de un docente en un período. */
export interface DisponibilidadCargada {
  periodo: PeriodoResumen;
  docente: DocenteParaDisponibilidad;
  /** Franjas del tipo de período (las columnas y filas de la matriz). */
  franjas: FranjaHoraria[];
  /** Ids de las franjas que ya están marcadas como disponibles. */
  franjasDisponibles: number[];
}
