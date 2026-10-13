import type {
  FiltrosReporte,
  OpcionCarreraReporte,
  OpcionFiltroReporte,
} from '../../../shared/components/filtros-reporte';

export interface OpcionEspacioOcupacion extends OpcionFiltroReporte {
  edificioId: string;
}

export interface CatalogosReporteOcupacion {
  facultades: readonly OpcionFiltroReporte[];
  carreras: readonly OpcionCarreraReporte[];
  periodos: readonly OpcionFiltroReporte[];
  edificios: readonly OpcionFiltroReporte[];
  espacios: readonly OpcionEspacioOcupacion[];
  franjas: readonly OpcionFiltroReporte[];
}

export interface ConsultaReporteOcupacion {
  filtros: FiltrosReporte;
  edificioId: string | null;
  espacioId: string | null;
  franjaId: string | null;
}

export interface FilaOcupacion {
  edificioId: string;
  edificio: string;
  espacioId: string;
  espacio: string;
  franjasDisponibles: number;
  franjasOcupadas: number;
}

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface CeldaOcupacionSemanal {
  espacioId: string;
  dia: DiaSemana;
  franjaId: string;
  ocupado: boolean;
  detalle?: string;
}

export interface ResultadoReporteOcupacion {
  filas: readonly FilaOcupacion[];
  grillaSemanal: readonly CeldaOcupacionSemanal[];
}

export interface ResumenOcupacion {
  franjasDisponibles: number;
  franjasOcupadas: number;
  porcentajeOcupacion: number;
  etiquetas: string[];
  porcentajesPorEspacio: number[];
}

export function resumirReporteOcupacion(
  filas: readonly FilaOcupacion[],
): ResumenOcupacion {
  const franjasDisponibles = filas.reduce(
    (total, fila) => total + fila.franjasDisponibles,
    0,
  );
  const franjasOcupadas = filas.reduce(
    (total, fila) => total + fila.franjasOcupadas,
    0,
  );

  return {
    franjasDisponibles,
    franjasOcupadas,
    porcentajeOcupacion:
      franjasDisponibles === 0
        ? 0
        : (franjasOcupadas / franjasDisponibles) * 100,
    etiquetas: filas.map((fila) => fila.espacio),
    porcentajesPorEspacio: filas.map((fila) =>
      fila.franjasDisponibles === 0
        ? 0
        : (fila.franjasOcupadas / fila.franjasDisponibles) * 100,
    ),
  };
}
