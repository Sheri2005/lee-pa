import { DocenteParaDisponibilidad, PeriodoResumen } from '../models/disponibilidad.model';
import { DiaSemana, FranjaHoraria, TipoPeriodo } from '../models/franja.model';

/**
 * Datos de prueba de `app-disponibilidad-docente` (C2-16).
 * PENDIENTE: períodos y docentes son del M1 (G1) y las franjas del M3 (G3); cuando publiquen
 * sus catálogos, estos mocks se reemplazan por sus datos.
 */

export const PERIODOS_MOCK: PeriodoResumen[] = [
  { id: 1, codigo: '2026-1', nombre: 'Semestre 2026-1', tipo: 'ORDINARIO' },
  { id: 2, codigo: '2026-V', nombre: 'Verano 2026', tipo: 'EXTRAORDINARIO' },
  { id: 3, codigo: '2025-2', nombre: 'Semestre 2025-2', tipo: 'ORDINARIO' },
];

export const DOCENTES_MOCK: DocenteParaDisponibilidad[] = [
  { id: 7, nombres: 'María Fernanda Torres', cargaMaximaHoras: 20 },
  { id: 12, nombres: 'Jorge Andrade', cargaMaximaHoras: 16 },
  { id: 21, nombres: 'Luis Vera', cargaMaximaHoras: 12 },
];

const BLOQUES_ORDINARIO = [
  ['07:00', '09:00'],
  ['09:00', '11:00'],
  ['11:00', '13:00'],
  ['17:00', '19:00'],
  ['19:00', '21:00'],
];

const BLOQUES_EXTRAORDINARIO = [
  ['08:00', '11:00'],
  ['11:00', '14:00'],
  ['17:00', '20:00'],
];

const DIAS_ORDINARIO: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
const DIAS_EXTRAORDINARIO: DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
];

/** Genera el catálogo de franjas de un tipo de período (día × bloque). */
function construirFranjas(
  tipoPeriodo: TipoPeriodo,
  dias: DiaSemana[],
  bloques: string[][],
  desdeId: number,
): FranjaHoraria[] {
  const franjas: FranjaHoraria[] = [];
  let id = desdeId;
  for (const [horaInicio, horaFin] of bloques) {
    for (const diaSemana of dias) {
      franjas.push({ id: id++, tipoPeriodo, diaSemana, horaInicio, horaFin });
    }
  }
  return franjas;
}

export const FRANJAS_MOCK: Record<TipoPeriodo, FranjaHoraria[]> = {
  ORDINARIO: construirFranjas('ORDINARIO', DIAS_ORDINARIO, BLOQUES_ORDINARIO, 100),
  EXTRAORDINARIO: construirFranjas(
    'EXTRAORDINARIO',
    DIAS_EXTRAORDINARIO,
    BLOQUES_EXTRAORDINARIO,
    200,
  ),
};

/**
 * Disponibilidad ya registrada, por `docenteId:periodoId`.
 * El período 3 (2025-2) sirve para probar "copiar del período anterior".
 */
export const DISPONIBILIDAD_MOCK: Record<string, number[]> = {
  '7:1': [100, 101, 105, 106],
  '7:3': [100, 101, 102, 105, 106, 107],
  '12:1': [110, 115],
  '21:2': [200, 201, 206],
};
