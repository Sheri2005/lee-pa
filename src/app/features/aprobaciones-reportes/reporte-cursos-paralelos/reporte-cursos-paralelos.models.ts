import type {
  FiltrosReporte,
  OpcionCarreraReporte,
  OpcionFiltroReporte,
} from '../../../shared/components/filtros-reporte';
import type { GraficoSerie } from '../../../shared/components/grafico';

export interface CatalogosCursosParalelos {
  facultades: readonly OpcionFiltroReporte[];
  carreras: readonly OpcionCarreraReporte[];
  periodos: readonly OpcionFiltroReporte[];
  mallaIdPorCarreraId: Readonly<Record<string, string>>;
  nivelesPorMallaId: Readonly<Record<string, readonly number[]>>;
}

export interface ConsultaCursosParalelos {
  filtros: FiltrosReporte;
  niveles: readonly number[];
}

export interface FilaCursosParalelos {
  facultadId: string;
  facultad: string;
  carreraId: string;
  carrera: string;
  periodoId: string;
  periodo: string;
  nivel: number;
  cursos: number;
  paralelos: number;
}

export interface ResumenReporteCursosParalelos {
  totalCursos: number;
  totalParalelos: number;
  etiquetas: string[];
  series: GraficoSerie[];
}

export function resumirReporteCursosParalelos(
  filas: readonly FilaCursosParalelos[],
): ResumenReporteCursosParalelos {
  const porCarrera = new Map<
    string,
    { nombre: string; cursos: number; paralelos: number }
  >();

  for (const fila of filas) {
    const agregado = porCarrera.get(fila.carreraId) ?? {
      nombre: fila.carrera,
      cursos: 0,
      paralelos: 0,
    };

    agregado.cursos += fila.cursos;
    agregado.paralelos += fila.paralelos;
    porCarrera.set(fila.carreraId, agregado);
  }

  const agrupaciones = [...porCarrera.values()];

  return {
    totalCursos: filas.reduce((total, fila) => total + fila.cursos, 0),
    totalParalelos: filas.reduce((total, fila) => total + fila.paralelos, 0),
    etiquetas: agrupaciones.map(({ nombre }) => nombre),
    series: [
      { nombre: 'Cursos', valores: agrupaciones.map(({ cursos }) => cursos) },
      {
        nombre: 'Paralelos',
        valores: agrupaciones.map(({ paralelos }) => paralelos),
      },
    ],
  };
}
