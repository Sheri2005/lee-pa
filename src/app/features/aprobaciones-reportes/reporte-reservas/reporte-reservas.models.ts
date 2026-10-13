import type {
  FiltrosReporte,
  OpcionCarreraReporte,
  OpcionFiltroReporte,
} from '../../../shared/components/filtros-reporte';

export interface CatalogosReporteReservas {
  facultades: readonly OpcionFiltroReporte[];
  carreras: readonly OpcionCarreraReporte[];
  periodos: readonly OpcionFiltroReporte[];
  espacios: readonly OpcionFiltroReporte[];
}

export interface ConsultaReporteReservas {
  filtros: FiltrosReporte;
  espacioId: string | null;
  anio: number;
  mes: number;
}

export interface FilaReservaReporte {
  reservaId: string;
  fecha: string;
  espacioId: string;
  espacio: string;
  solicitante: string;
  estado: string;
  tiempoAprobacionHoras: number | null;
}

export interface DiaCalendarioReservas {
  fechaISO: string;
  numero: number;
  reservas: number;
}

export interface ResumenReporteReservas {
  totalReservas: number;
  tiempoPromedioAprobacionHoras: number | null;
  etiquetas: string[];
  reservasPorDia: number[];
}

function claveFecha(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function cantidadDiasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

export function construirCalendarioMensual(
  anio: number,
  mes: number,
  filas: readonly FilaReservaReporte[],
): (DiaCalendarioReservas | null)[] {
  const diasDelMes = cantidadDiasDelMes(anio, mes);
  const desplazamientoLunesPrimero =
    (new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay() + 6) % 7;
  const conteoPorFecha = new Map<string, number>();

  for (const fila of filas) {
    conteoPorFecha.set(
      fila.fecha,
      (conteoPorFecha.get(fila.fecha) ?? 0) + 1,
    );
  }

  const calendario: (DiaCalendarioReservas | null)[] = Array(42).fill(null);

  for (let dia = 1; dia <= diasDelMes; dia += 1) {
    const fechaISO = claveFecha(anio, mes, dia);
    calendario[desplazamientoLunesPrimero + dia - 1] = {
      fechaISO,
      numero: dia,
      reservas: conteoPorFecha.get(fechaISO) ?? 0,
    };
  }

  return calendario;
}

export function resumirReporteReservas(
  filas: readonly FilaReservaReporte[],
  anio: number,
  mes: number,
): ResumenReporteReservas {
  const duracionesValidas = filas
    .map((fila) => fila.tiempoAprobacionHoras)
    .filter(
      (duracion): duracion is number =>
        duracion !== null && Number.isFinite(duracion) && duracion >= 0,
    );
  const diasDelMes = cantidadDiasDelMes(anio, mes);
  const conteoPorFecha = new Map<string, number>();

  for (const fila of filas) {
    conteoPorFecha.set(
      fila.fecha,
      (conteoPorFecha.get(fila.fecha) ?? 0) + 1,
    );
  }

  return {
    totalReservas: filas.length,
    tiempoPromedioAprobacionHoras:
      duracionesValidas.length === 0
        ? null
        : duracionesValidas.reduce((total, duracion) => total + duracion, 0) /
          duracionesValidas.length,
    etiquetas: Array.from({ length: diasDelMes }, (_, index) =>
      String(index + 1),
    ),
    reservasPorDia: Array.from({ length: diasDelMes }, (_, index) =>
      conteoPorFecha.get(claveFecha(anio, mes, index + 1)) ?? 0,
    ),
  };
}
