import type {
  FiltrosReporte,
  OpcionCarreraReporte,
  OpcionFiltroReporte,
} from '../../../shared/components/filtros-reporte';

export interface CatalogosReporteCargaDocente {
  facultades: readonly OpcionFiltroReporte[];
  carreras: readonly OpcionCarreraReporte[];
  periodos: readonly OpcionFiltroReporte[];
  docentes: readonly OpcionFiltroReporte[];
}

export interface ConsultaReporteCargaDocente {
  filtros: FiltrosReporte;
  docenteId: string | null;
}

export interface FilaCargaDocente {
  docenteId: string;
  docente: string;
  horasAsignadas: number;
  cargaMaxima: number;
}

export interface ResumenCargaDocente {
  totalHorasAsignadas: number;
  totalCargaMaxima: number;
  docentesSobrecargados: number;
  porcentajeCargaGlobal: number | null;
}

export function porcentajeCargaDocente(
  fila: FilaCargaDocente,
): number | null {
  return fila.cargaMaxima === 0
    ? null
    : (fila.horasAsignadas / fila.cargaMaxima) * 100;
}

export function resumirCargaDocente(
  filas: readonly FilaCargaDocente[],
): ResumenCargaDocente {
  const totalHorasAsignadas = filas.reduce(
    (total, fila) => total + fila.horasAsignadas,
    0,
  );
  const totalCargaMaxima = filas.reduce(
    (total, fila) => total + fila.cargaMaxima,
    0,
  );

  return {
    totalHorasAsignadas,
    totalCargaMaxima,
    docentesSobrecargados: filas.filter(
      (fila) => fila.horasAsignadas > fila.cargaMaxima,
    ).length,
    porcentajeCargaGlobal:
      totalCargaMaxima === 0
        ? null
        : (totalHorasAsignadas / totalCargaMaxima) * 100,
  };
}
