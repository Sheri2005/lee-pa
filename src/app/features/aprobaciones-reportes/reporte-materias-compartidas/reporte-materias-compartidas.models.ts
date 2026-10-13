import type {
  FiltrosReporte,
  OpcionCarreraReporte,
  OpcionFiltroReporte,
} from '../../../shared/components/filtros-reporte';

export interface CatalogosReporteMateriasCompartidas {
  facultades: readonly OpcionFiltroReporte[];
  carreras: readonly OpcionCarreraReporte[];
  periodos: readonly OpcionFiltroReporte[];
  materias: readonly OpcionFiltroReporte[];
}

export interface ConsultaReporteMateriasCompartidas {
  filtros: FiltrosReporte;
  materiaId: string | null;
}

export interface FilaMateriaCompartida {
  materiaId: string;
  materia: string;
  carreraResponsableId: string;
  carreraResponsable: string;
  carreraDependienteId: string;
  carreraDependiente: string;
  cuposSolicitados: number;
}

export interface ResumenMateriasCompartidas {
  totalMateriasCompartidas: number;
  totalCarrerasDependientes: number;
  totalCuposSolicitados: number;
}

export function resumirMateriasCompartidas(
  filas: readonly FilaMateriaCompartida[],
): ResumenMateriasCompartidas {
  const materias = new Set(filas.map((fila) => fila.materiaId));
  const dependencias = new Set(
    filas.map((fila) =>
      JSON.stringify([fila.materiaId, fila.carreraDependienteId]),
    ),
  );

  return {
    totalMateriasCompartidas: materias.size,
    totalCarrerasDependientes: dependencias.size,
    totalCuposSolicitados: filas.reduce(
      (total, fila) => total + fila.cuposSolicitados,
      0,
    ),
  };
}
