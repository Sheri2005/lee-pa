/** Cantidad de carreras activas de una facultad (para el gráfico del panel). */
export interface CarrerasPorFacultad {
  facultad: string;
  carreras: number;
}

/** Indicadores del panel administrativo (C1-60). */
export interface ResumenPanel {
  carrerasActivas: number;
  mallasVigentes: number;
  docentesRegistrados: number;
  /** Períodos en planificación o activos (todo lo que no está cerrado). */
  periodosAbiertos: number;
  registrosSinSiac: number;
  /** Solo facultades activas, en orden alfabético. */
  carrerasPorFacultad: CarrerasPorFacultad[];
}
