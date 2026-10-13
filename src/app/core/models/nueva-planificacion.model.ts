import { Planificacion } from './planificacion.model';

/** Carrera que se puede elegir al crear una planificación, con lo que hereda de ella. */
export interface CarreraCatalogo {
  id: number;
  codigo: string;
  nombre: string;
  /** Facultad heredada de la carrera. */
  facultad: Planificacion['facultad'];
  /** Malla vigente de la carrera. */
  malla: Planificacion['malla'];
}

/** Combinación carrera + período que ya tiene planificación (no se puede repetir). */
export interface CombinacionExistente {
  carreraId: number;
  periodoId: number;
}

/**
 * Datos que necesita el diálogo `app-planificacion-nueva` (C2-02).
 * Proyección temporal: cuando G1 publique sus selectores, carreras, períodos y mallas
 * vendrán de ellos y aquí solo quedarán las combinaciones existentes.
 */
export interface CatalogoNuevaPlanificacion {
  carreras: CarreraCatalogo[];
  periodos: Planificacion['periodo'][];
  existentes: CombinacionExistente[];
}

export interface SolicitudNuevaPlanificacion {
  carreraId: number;
  periodoId: number;
}
